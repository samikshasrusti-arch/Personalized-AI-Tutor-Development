import uuid
import sqlite3
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    GeneratePracticeRequest, PracticeQuestion,
    EvaluatePracticeRequest, EvaluationResult
)
from app.services.ai_service import ai_service, AIServiceError
from app.services.progress_service import record_practice_attempt
from app.db.database import get_db

router = APIRouter()


@router.post("/generate", response_model=PracticeQuestion)
def generate_practice_question(req: GeneratePracticeRequest, conn: sqlite3.Connection = Depends(get_db)):
    """Dynamically generate a practice question using AI."""
    try:
        data = ai_service.generate_practice_question(
            topic=req.topic,
            difficulty=req.difficulty,
            question_type=req.questionType,
            profile=req.profile.dict(),
        )
        question = PracticeQuestion(
            questionId=str(uuid.uuid4()),
            topicId=req.topicId,
            topic=req.topic,
            difficulty=req.difficulty,
            questionType=req.questionType,
            questionText=data.get("questionText", ""),
            options=data.get("options"),
            expectedAnswer=data.get("correctAnswer") or data.get("expectedAnswer"),
            explanation=data.get("explanation", ""),
            hint=data.get("hint", "Think carefully about the concept."),
        )
        return question
    except AIServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/evaluate", response_model=EvaluationResult)
def evaluate_practice_answer(req: EvaluatePracticeRequest, conn: sqlite3.Connection = Depends(get_db)):
    """Evaluate a learner's practice answer."""
    if not req.learnerAnswer.strip():
        raise HTTPException(status_code=422, detail="Answer cannot be empty.")

    is_correct = False
    score = 0.0
    feedback = ""
    explanation = req.explanation
    hint = req.hint
    suggested = "Review the concept and try again."

    objective_types = {"multiple_choice", "predict_output", "fill_blank"}
    if req.questionType in objective_types and req.expectedAnswer:
        learner_clean = req.learnerAnswer.strip().lower()
        expected_clean = req.expectedAnswer.strip().lower()
        if learner_clean == expected_clean:
            is_correct = True
        elif expected_clean in learner_clean or learner_clean in expected_clean:
            is_correct = True
        score = 1.0 if is_correct else 0.0
        if is_correct:
            feedback = "Correct! Great job."
        else:
            feedback = f"Not quite. The correct answer is: {req.expectedAnswer}"
        suggested = "Try the next question!" if is_correct else "Review this topic before proceeding."
    else:
        try:
            result = ai_service.evaluate_answer(
                question_text=req.questionText,
                expected=req.expectedAnswer or "",
                learner_answer=req.learnerAnswer,
                question_type=req.questionType,
            )
            is_correct = result.get("isCorrect", False)
            score = float(result.get("score", 1.0 if is_correct else 0.0))
            feedback = result.get("feedback", "")
            explanation = result.get("explanation", explanation)
            hint = result.get("hint", hint)
            suggested = result.get("suggestedNextStep", suggested)
        except AIServiceError as e:
            raise HTTPException(status_code=503, detail=str(e))

    if req.learnerId:
        try:
            record_practice_attempt(
                conn=conn,
                learner_id=req.learnerId,
                topic_id=req.topicId,
                question_type=req.questionType,
                difficulty=req.difficulty,
                is_correct=is_correct,
                question_text=req.questionText[:500],
                learner_answer=req.learnerAnswer[:500],
                correct_answer=(req.expectedAnswer or "")[:500],
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
