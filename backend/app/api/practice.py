import uuid
import json
import sqlite3
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    GeneratePracticeRequest, PracticeQuestion,
    EvaluatePracticeRequest, EvaluationResult
)
from app.services.ai_service import ai_service, AIServiceError
from app.services.evaluator import (
    evaluate_multiple_choice,
    evaluate_predict_output,
    evaluate_fill_blank,
    evaluate_numeric_or_string,
)
from app.services.progress_service import record_practice_attempt
from app.db.database import get_db

router = APIRouter()


@router.post("/generate", response_model=PracticeQuestion)
def generate_practice_question(req: GeneratePracticeRequest, conn: sqlite3.Connection = Depends(get_db)):
    """
    Dynamically generate a practice question using AI and persist authoritative answer keys in SQLite.
    Returns a sanitized question to the client without exposing expectedAnswer or explanation.
    """
    try:
        data = ai_service.generate_practice_question(
            topic=req.topic,
            difficulty=req.difficulty,
            question_type=req.questionType,
            profile=req.profile.model_dump(),
        )
        question_id = str(uuid.uuid4())
        expected_answer = str(data.get("correctAnswer") or data.get("expectedAnswer") or "").strip()
        explanation = str(data.get("explanation", "")).strip()
        hint = str(data.get("hint", "Think carefully about the concept.")).strip()
        options = data.get("options") or []
        options_json = json.dumps(options) if options else None
        learner_id = req.profile.learnerId or "anonymous"

        # Store authoritative practice session in database
        conn.execute(
            """INSERT INTO practice_sessions 
               (id, learner_id, topic_id, topic_title, difficulty, question_type, 
                question_text, options_json, expected_answer, explanation, hint, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')""",
            (
                question_id,
                learner_id,
                req.topicId,
                req.topic,
                req.difficulty,
                req.questionType,
                data.get("questionText", ""),
                options_json,
                expected_answer,
                explanation,
                hint,
            )
        )
        conn.commit()

        # Return sanitized question to client with withheld expectedAnswer and explanation
        return PracticeQuestion(
            questionId=question_id,
            topicId=req.topicId,
            topic=req.topic,
            difficulty=req.difficulty,
            questionType=req.questionType,
            questionText=data.get("questionText", ""),
            options=options,
            expectedAnswer="",  # Redacted from client before submission
            explanation="",     # Redacted from client before submission
            hint=hint,
        )
    except AIServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/evaluate", response_model=EvaluationResult)
def evaluate_practice_answer(req: EvaluatePracticeRequest, conn: sqlite3.Connection = Depends(get_db)):
    """
    Evaluate a learner's practice answer using type-specific deterministic matching
    or safe semantic AI evaluation.
    Authoritative answer keys are loaded from SQLite to prevent client manipulation.
    Never executes learner code in the backend process.
    """
    if not req.learnerAnswer.strip():
        raise HTTPException(status_code=422, detail="Answer cannot be empty.")

    # 1. Retrieve authoritative practice session if present
    row = conn.execute(
        "SELECT * FROM practice_sessions WHERE id=?",
        (req.questionId,)
    ).fetchone()

    if row:
        session = dict(row)
        expected = session["expected_answer"]
        explanation = session["explanation"]
        hint = session.get("hint") or req.hint or ""
        q_text = session["question_text"]
        q_type = session["question_type"]
        difficulty = session["difficulty"]
        topic_id = session["topic_id"]
        options = json.loads(session["options_json"]) if session.get("options_json") else (req.options or [])
    else:
        # Fallback for unpersisted / direct requests
        expected = req.expectedAnswer or ""
        explanation = req.explanation or ""
        hint = req.hint or ""
        q_text = req.questionText
        q_type = req.questionType
        difficulty = req.difficulty
        topic_id = req.topicId
        options = req.options or []

    is_correct = False
    score = 0.0
    feedback = ""
    suggested = "Review the concept and try again."

    # 2. Type-aware deterministic checks for objective question types
    if q_type == "multiple_choice" and expected:
        is_correct, feedback = evaluate_multiple_choice(
            learner_ans=req.learnerAnswer,
            expected_ans=expected,
            options=options,
        )
        score = 1.0 if is_correct else 0.0
        suggested = "Great job! Try the next question." if is_correct else "Review the options and try again."

    elif q_type == "predict_output" and expected:
        is_correct, feedback = evaluate_predict_output(
            learner_ans=req.learnerAnswer,
            expected_ans=expected,
        )
        score = 1.0 if is_correct else 0.0
        suggested = "Excellent output tracing! Keep it up." if is_correct else "Trace the code line-by-line to find the output."

    elif q_type == "fill_blank" and expected:
        is_correct, feedback = evaluate_fill_blank(
            learner_ans=req.learnerAnswer,
            expected_ans=expected,
        )
        score = 1.0 if is_correct else 0.0
        suggested = "Spot on syntax! Continue practicing." if is_correct else "Pay close attention to exact keywords and syntax."

    # 3. Open-ended evaluation (find_error, short_coding, or when expected is absent)
    else:
        # Check for exact string match first before querying AI
        if expected and req.learnerAnswer.strip() == expected.strip():
            is_correct = True
            score = 1.0
            feedback = "Correct! Matches the expected solution exactly."
            suggested = "Try the next coding challenge!"
        else:
            try:
                # Semantic AI evaluation (never executes code via exec/eval)
                result = ai_service.evaluate_answer(
                    question_text=q_text,
                    expected=expected,
                    learner_answer=req.learnerAnswer,
                    question_type=q_type,
                )
                is_correct = bool(result.get("isCorrect", False))
                try:
                    score = float(result.get("score", 1.0 if is_correct else 0.0))
                    score = max(0.0, min(1.0, score))
                except (ValueError, TypeError):
                    score = 1.0 if is_correct else 0.0

                feedback = str(result.get("feedback", ""))
                explanation = str(result.get("explanation", explanation))
                hint = str(result.get("hint", hint))
                suggested = str(result.get("suggestedNextStep", suggested))
            except AIServiceError as e:
                raise HTTPException(status_code=503, detail=str(e))
            except Exception:
                # Fallback to deterministic string check if AI call fails
                is_correct, feedback = evaluate_numeric_or_string(req.learnerAnswer, expected)
                score = 1.0 if is_correct else 0.0

    # 4. Mark session completed in database
    if row:
        conn.execute(
            """UPDATE practice_sessions 
               SET status='completed', evaluated_at=datetime('now')
               WHERE id=?""",
            (req.questionId,)
        )
        conn.commit()

    if req.learnerId:
        try:
            record_practice_attempt(
                conn=conn,
                learner_id=req.learnerId,
                topic_id=topic_id,
                question_type=q_type,
                difficulty=difficulty,
                is_correct=is_correct,
                question_text=q_text[:500],
                learner_answer=req.learnerAnswer[:500],
                correct_answer=expected[:500],
            )
        except Exception:
            pass

    return EvaluationResult(
        isCorrect=is_correct,
        score=score,
        feedback=feedback,
        explanation=explanation,
        hint=hint,
        suggestedNextStep=suggested,
    )
