import uuid
import json
import sqlite3
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    CreateQuizRequest, CreateQuizResponse, QuizQuestionPublic,
    SubmitQuizRequest, QuizSubmitResult, QuizAnswerResult
)
from app.services.ai_service import ai_service, AIServiceError
from app.services.progress_service import record_quiz_attempt
from app.db.database import get_db

router = APIRouter()


def _is_option_match(learner_ans: str, correct_ans: str) -> bool:
    """Check if learner's answer matches the correct option securely without substring false positives."""
    l_strip = learner_ans.strip()
    c_strip = correct_ans.strip()
    if not l_strip:
        return False
    if l_strip.lower() == c_strip.lower():
        return True

    # If correct answer is formatted like "A) Option text"
    if len(c_strip) >= 2 and c_strip[1] in (")", ".", ":"):
        prefix = c_strip[0].strip().upper()
        # Learner typed just "A" or "a"
        if l_strip.upper() == prefix:
            return True
        # Learner typed the text after the prefix (e.g. "Option text")
        rest_of_correct = c_strip[2:].strip().lower()
        if l_strip.lower() == rest_of_correct:
            return True

    # If learner answer has prefix "A) Option text" but correct answer is "A"
    if len(l_strip) >= 2 and l_strip[1] in (")", ".", ":"):
        if l_strip[0].strip().upper() == c_strip.upper():
            return True

    return False


@router.post("/create", response_model=CreateQuizResponse)
def create_quiz(req: CreateQuizRequest, conn: sqlite3.Connection = Depends(get_db)):
    """
    Generate a complete quiz on a given Python topic.
    Stores authoritative questions and answer keys in SQLite server-side storage.
    Returns sanitized questions without answer keys to the frontend.

    IDENTITY NOTE: learnerId is supplied by the client as part of the profile.
    Session ownership is bound to this learnerId for consistency, but full
    cryptographic authentication is out of scope in the current identity model.
    """
    try:
        raw_questions = ai_service.generate_quiz_questions(
            topic=req.topic,
            difficulty=req.difficulty,
            count=req.questionCount,
            profile=req.profile.model_dump(),
        )

        quiz_id = str(uuid.uuid4())
        learner_id = req.profile.learnerId or "anonymous"

        # Store authoritative questions (with answer keys) on server
        conn.execute(
            """INSERT INTO quiz_sessions 
               (id, learner_id, topic_id, topic_title, difficulty, questions_json, status)
               VALUES (?, ?, ?, ?, ?, ?, 'pending')""",
            (
                quiz_id,
                learner_id,
                req.topicId,
                req.topic,
                req.difficulty,
                json.dumps(raw_questions),
            )
        )
        conn.commit()

        # Sanitize questions sent to frontend: exclude correctAnswer and explanation
        client_questions = []
        for q in raw_questions:
            client_questions.append(QuizQuestionPublic(
                questionId=q.get("questionId", ""),
                questionText=q.get("questionText", ""),
                options=q.get("options", []),
                hint=q.get("hint", ""),
                topic=req.topic,
                difficulty=req.difficulty,
            ))

        return CreateQuizResponse(
            quizId=quiz_id,
            questions=client_questions,
            topic=req.topic,
            difficulty=req.difficulty,
        )
    except AIServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/submit", response_model=QuizSubmitResult)
def submit_quiz(req: SubmitQuizRequest, conn: sqlite3.Connection = Depends(get_db)):
    """
    Score a completed quiz against authoritative backend session.
    - Rejects fabricated answer keys and unlisted question IDs.
    - Uses atomic compare-and-swap on SQLite to prevent race conditions or duplicate scoring.
    - Checks session expiration (4-hour validity limit).
    - Checks session ownership consistency with current identity model.
    """
    if not req.quizId:
        raise HTTPException(
            status_code=422,
            detail="Missing quizId. All submissions must reference an authoritative quiz session."
        )

    # 1. Retrieve authoritative session from database
    row = conn.execute(
        "SELECT * FROM quiz_sessions WHERE id=?",
        (req.quizId,)
    ).fetchone()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Quiz session not found or invalid."
        )

    session = dict(row)

    # 2. Check for duplicate submission
    if session["status"] == "completed":
        raise HTTPException(
            status_code=409,
            detail="This quiz has already been submitted and scored. Duplicate submissions are not permitted."
        )

    # 3. Check session expiration (4-hour limit)
    created_str = session.get("created_at")
    if created_str:
        try:
            # Handle standard SQLite datetime formats
            clean_ts = created_str.replace(" ", "T")
            if not clean_ts.endswith("Z") and "+" not in clean_ts:
                clean_ts += "+00:00"
            created_dt = datetime.fromisoformat(clean_ts)
            now_dt = datetime.now(timezone.utc)
            if (now_dt - created_dt).total_seconds() > 14400:  # 4 hours
                raise HTTPException(
                    status_code=410,
                    detail="Quiz session has expired (limit: 4 hours). Please generate a new quiz."
                )
        except HTTPException:
            raise
        except Exception:
            pass

    # 4. Learner ownership check (under current identity model)
    session_learner_id = session.get("learner_id")
    if session_learner_id and session_learner_id != "anonymous" and req.learnerId:
        if session_learner_id != req.learnerId:
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: this quiz session belongs to another learner ID."
            )

    # 5. Parse authoritative questions
    try:
        auth_questions = json.loads(session["questions_json"])
    except Exception:
        raise HTTPException(status_code=500, detail="Corrupted quiz session data.")

    if not auth_questions:
        raise HTTPException(status_code=422, detail="No questions found in this quiz session.")

    auth_map = {q["questionId"]: q for q in auth_questions if "questionId" in q}

    # 6. Validate submitted question IDs against authoritative set
    for q_id in req.answers.keys():
        if q_id not in auth_map:
            raise HTTPException(
                status_code=422,
                detail=f"Unknown question ID '{q_id}' submitted. Question does not exist in this quiz."
            )

    # 7. Deterministic scoring exclusively on authoritative backend answer keys
    results = []
    correct_count = 0

    for auth_q in auth_questions:
        q_id = auth_q["questionId"]
        learner_ans = req.answers.get(q_id, "").strip()
        correct_ans = auth_q.get("correctAnswer", "").strip()

        is_correct = _is_option_match(learner_ans, correct_ans)
        if is_correct:
            correct_count += 1

        results.append(QuizAnswerResult(
            questionId=q_id,
            questionText=auth_q.get("questionText", ""),
            learnerAnswer=learner_ans if learner_ans else "(No answer)",
            correctAnswer=correct_ans,
            isCorrect=is_correct,
            explanation=auth_q.get("explanation", ""),
        ))

    total = len(auth_questions)
    score_pct = round((correct_count / total) * 100, 1) if total > 0 else 0.0

    if score_pct >= 80:
        recommendation = "Excellent! You have a strong grasp of this topic. Try a harder difficulty or move to the next topic."
    elif score_pct >= 60:
        recommendation = "Good effort! Review the questions you got wrong and try practicing more on this topic."
    else:
        recommendation = "Keep going! Review the explanations below and revisit the Learn section for this topic."

    final_result = QuizSubmitResult(
        score=score_pct,
        correctCount=correct_count,
        totalQuestions=total,
        timeTakenSeconds=req.timeTakenSeconds,
        results=results,
        topicId=session["topic_id"],
        topicTitle=session["topic_title"],
        difficulty=session["difficulty"],
        recommendation=recommendation,
    )

    # 8. Atomic finalize: status='pending' -> status='completed' to prevent race conditions
    cursor = conn.execute(
        """UPDATE quiz_sessions 
           SET status='completed', score=?, correct_count=?, total_questions=?, 
               time_taken_seconds=?, result_json=?, submitted_at=datetime('now')
           WHERE id=? AND status='pending'""",
        (
            score_pct,
            correct_count,
            total,
            req.timeTakenSeconds,
            final_result.model_dump_json(),
            req.quizId,
        )
    )
    if cursor.rowcount == 0:
        raise HTTPException(
            status_code=409,
            detail="This quiz has already been submitted or is being processed concurrently."
        )
    conn.commit()

    if req.learnerId:
        try:
            record_quiz_attempt(
                conn=conn,
                learner_id=req.learnerId,
                topic_id=session["topic_id"],
                topic_title=session["topic_title"],
                score=score_pct,
                total=total,
                correct=correct_count,
                difficulty=session["difficulty"],
                time_taken=req.timeTakenSeconds,
            )
        except Exception:
            pass

    return final_result
