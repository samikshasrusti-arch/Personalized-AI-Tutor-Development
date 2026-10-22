import re
import sqlite3
from fastapi import APIRouter, HTTPException, Depends
from app.services.progress_service import get_progress_summary, TOPICS, TOPIC_MAP
from app.services.ai_service import ai_service, AIServiceError
from app.db.database import get_db

router = APIRouter()


def validate_learner_id(learner_id: str):
    """Validate learner ID format to prevent malformed or malicious inputs."""
    if not learner_id or not re.match(r"^[a-zA-Z0-9_\-]{1,64}$", learner_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid learner ID format. Must be alphanumeric and 1-64 characters."
        )


@router.get("/{learner_id}")
def get_progress(learner_id: str, conn: sqlite3.Connection = Depends(get_db)):
    """Return overall progress summary for a learner."""
    validate_learner_id(learner_id)
    try:
        summary = get_progress_summary(conn, learner_id)
        return summary.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve learner progress.")


@router.get("/{learner_id}/topics")
def get_topic_progress(learner_id: str, conn: sqlite3.Connection = Depends(get_db)):
    """Return topic-level progress with mastery levels."""
    validate_learner_id(learner_id)
    try:
        summary = get_progress_summary(conn, learner_id)
        topic_map = {tp.topicId: tp for tp in summary.topicProgress}
        result = []
        for t in TOPICS:
            if t["id"] in topic_map:
                result.append(topic_map[t["id"]].model_dump())
            else:
                result.append({
                    "topicId": t["id"],
                    "topicTitle": t["title"],
                    "lessonsCompleted": 0,
                    "quizAttempts": 0,
                    "practiceAttempts": 0,
                    "bestQuizScore": 0.0,
                    "averageAccuracy": 0.0,
                    "masteryLevel": 0.0,
                })
        return {"topics": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve topic progress.")


@router.get("/{learner_id}/recommendations")
@router.get("/{learner_id}/recommendation")
def get_recommendations(learner_id: str, conn: sqlite3.Connection = Depends(get_db)):
    """Return a personalized learning recommendation."""
    validate_learner_id(learner_id)
    try:
        summary = get_progress_summary(conn, learner_id)

        recent_scores = {}
        quiz_rows = conn.execute(
            """SELECT topic_id, score FROM quiz_attempts WHERE learner_id=?
               ORDER BY created_at DESC LIMIT 20""",
            (learner_id,)
        ).fetchall()
        for row in quiz_rows:
            if row["topic_id"] not in recent_scores:
                recent_scores[row["topic_id"]] = row["score"]

        weak_topic_titles = [
            tp.topicTitle for tp in summary.topicProgress
            if tp.masteryLevel < 40 and (tp.quizAttempts + tp.practiceAttempts) > 0
        ]
        completed_titles = [
            TOPIC_MAP.get(tp.topicId, tp.topicId)
            for tp in summary.topicProgress if tp.lessonsCompleted > 0
        ]

        rec = ai_service.get_recommendation(
            weak_topics=weak_topic_titles,
            recent_scores=recent_scores,
            completed=completed_titles,
        )
        return rec
    except AIServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to compute recommendations.")
