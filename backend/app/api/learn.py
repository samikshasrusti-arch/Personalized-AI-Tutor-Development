import sqlite3
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    ExplainRequest, AskRequest, MarkCompleteRequest,
)
from app.services.ai_service import ai_service, AIServiceError
from app.services.progress_service import record_lesson_complete
from app.db.database import get_db

router = APIRouter()


@router.post("/explain")
def explain_topic(req: ExplainRequest, conn: sqlite3.Connection = Depends(get_db)):
    """Generate an initial explanation for a Python topic."""
    try:
        explanation = ai_service.explain_concept(req.topic, req.profile.dict())
        return {"content": explanation}
    except AIServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/ask")
def ask_follow_up(req: AskRequest, conn: sqlite3.Connection = Depends(get_db)):
    """Handle follow-up questions within a learning session."""
    if not req.question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty.")
    if len(req.question) > 2000:
        raise HTTPException(status_code=422, detail="Question is too long (max 2000 chars).")

    try:
        context = [{"role": msg.role, "content": msg.content} for msg in req.context]
        answer = ai_service.answer_question(req.topic, req.question, req.profile.dict(), context)
        return {"content": answer}
    except AIServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/complete")
def mark_lesson_complete(req: MarkCompleteRequest, conn: sqlite3.Connection = Depends(get_db)):
    """Record that a learner completed a lesson."""
    try:
        record_lesson_complete(conn, req.learnerId, req.topicId, req.topicTitle)
        return {"success": True, "message": f"Lesson '{req.topicTitle}' marked as complete."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
