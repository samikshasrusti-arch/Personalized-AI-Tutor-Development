import sqlite3
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    CreateQuizRequest, QuizQuestion,
    SubmitQuizRequest, QuizSubmitResult, QuizAnswerResult
)
from app.services.ai_service import ai_service, AIServiceError
from app.services.progress_service import record_quiz_attempt
from app.db.database import get_db

router = APIRouter()


@router.post("/create")
def create_quiz(req: CreateQuizRequest, conn: sqlite3.Connection = Depends(get_db)):
    """Generate a complete quiz on a given Python topic."""
    try:
        raw_questions = ai_service.generate_quiz_questions(
            topic=req.topic,
            difficulty=req.difficulty,
            count=req.questionCount,
            profile=req.profile.dict(),
        )
        questions = []
        for q in raw_questions:
            questions.append(QuizQuestion(
                questionId=q.get("questionId", ""),
                questionText=q.get("questionText", ""),
                options=q.get("options", []),
                correctAnswer=q.get("correctAnswer", ""),
                explanation=q.get("explanation", ""),
                hint=q.get("hint", ""),
                topic=req.topic,
                difficulty=req.difficulty,
            ))
        return {"questions": [q.dict() for q in questions], "topic": req.topic, "difficulty": req.difficulty}
    except AIServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/submit", response_model=QuizSubmitResult)
def submit_quiz(req: SubmitQuizRequest, conn: sqlite3.Connection = Depends(get_db)):
    """
    Score a completed quiz.
    Scoring is done deterministically in application code — NOT by the LLM.
    """
    if not req.questions:
        raise HTTPException(status_code=422, detail="No questions provided.")

    results = []
    correct_count = 0

    for question in req.questions:
        learner_ans = req.answers.get(question.questionId, "").strip()
        correct_ans = question.correctAnswer.strip()

        is_correct = learner_ans.lower() == correct_ans.lower()
        if not is_correct and len(correct_ans) > 1 and correct_ans[1:2] == ")":
            # Compare just leading letter (e.g. learner typed "A" vs "A) Python is...")
            if learner_ans.upper() == correct_ans[0].upper():
                is_correct = True

        if is_correct:
            correct_count += 1

        results.append(QuizAnswerResult(
            questionId=question.questionId,
            questionText=question.questionText,
            learnerAnswer=learner_ans if learner_ans else "(No answer)",
            correctAnswer=correct_ans,
            isCorrect=is_correct,
            explanation=question.explanation,
        ))

    total = len(req.questions)
    score_pct = round((correct_count / total) * 100, 1) if total > 0 else 0.0

    if req.learnerId:
        try:
            record_quiz_attempt(
                conn=conn,
                learner_id=req.learnerId,
                topic_id=req.topicId,
                topic_title=req.topicTitle,
                score=score_pct,
                total=total,
                correct=correct_count,
                difficulty=req.difficulty,
                time_taken=req.timeTakenSeconds,
            )
        except Exception:
            pass

    if score_pct >= 80:
        recommendation = "Excellent! You have a strong grasp of this topic. Try a harder difficulty or move to the next topic."
    elif score_pct >= 60:
        recommendation = "Good effort! Review the questions you got wrong and try practicing more on this topic."
    else:
        recommendation = "Keep going! Review the explanations below and revisit the Learn section for this topic."

    return QuizSubmitResult(
        score=score_pct,
        correctCount=correct_count,
        totalQuestions=total,
        timeTakenSeconds=req.timeTakenSeconds,
        results=results,
        topicId=req.topicId,
        topicTitle=req.topicTitle,
        difficulty=req.difficulty,
        recommendation=recommendation,
    )
