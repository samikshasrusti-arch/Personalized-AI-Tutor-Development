import sqlite3
from fastapi import APIRouter, HTTPException, Depends
from app.services.progress_service import get_progress_summary, TOPICS, TOPIC_MAP
from app.services.ai_service import ai_service, AIServiceError
from app.db.database import get_db

router = APIRouter()


@router.get("/{learner_id}")
def get_progress(learner_id: str, conn: sqlite3.Connection = Depends(get_db)):
    """Return overall progress summary for a learner."""
    try:
        summary = get_progress_summary(conn, learner_id)
        return summary.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{learner_id}/topics")
def get_topic_progress(learner_id: str, conn: sqlite3.Connection = Depends(get_db)):
    """Return topic-level progress with mastery levels."""
    try:
        summary = get_progress_summary(conn, learner_id)
        topic_map = {tp.topicId: tp for tp in summary.topicProgress}
        result = []
        for t in TOPICS:
            if t["id"] in topic_map:
                result.append(topic_map[t["id"]].dict())
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
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{learner_id}/recommendations")
def get_recommendations(learner_id: str, conn: sqlite3.Connection = Depends(get_db)):
    """Return a personalized learning recommendation."""
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
