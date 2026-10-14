"""
Progress service — computes mastery, records activity, and generates summaries.
Uses Python's built-in sqlite3 module (no SQLAlchemy).
All numeric calculations are done in application code (not delegated to LLM).
"""
import sqlite3
from app.models.schemas import TopicProgressSchema, ProgressSummary

TOPICS = [
    {"id": "intro",        "title": "Introduction to Python"},
    {"id": "variables",    "title": "Variables & Data Types"},
    {"id": "io",           "title": "Input & Output"},
    {"id": "operators",    "title": "Operators"},
    {"id": "conditionals", "title": "Conditional Statements"},
    {"id": "loops",        "title": "Loops"},
    {"id": "strings",      "title": "Strings"},
    {"id": "collections",  "title": "Lists, Tuples, Sets & Dicts"},
    {"id": "functions",    "title": "Functions"},
    {"id": "debugging",    "title": "Basic Problem-Solving & Debugging"},
]
TOPIC_MAP = {t["id"]: t["title"] for t in TOPICS}


def _compute_mastery(lessons: int, best_quiz: float, avg_accuracy: float, quiz_attempts: int, practice_attempts: int) -> float:
    """
    Mastery = weighted combination:
    - lesson completion (30%)
    - best quiz score   (40%)
    - avg practice acc  (20%)
    - engagement        (10%)
    A learner is NOT considered proficient from a single correct answer.
    """
    lesson_score = min(lessons * 25, 100)
    quiz_score   = best_quiz
    prac_score   = avg_accuracy
    engagement   = min((quiz_attempts + practice_attempts) * 5, 100)
    mastery = (0.30 * lesson_score + 0.40 * quiz_score + 0.20 * prac_score + 0.10 * engagement)
    return round(mastery, 1)


def _get_or_create_topic_progress(conn: sqlite3.Connection, learner_id: str, topic_id: str) -> dict:
    row = conn.execute(
        "SELECT * FROM topic_progress WHERE learner_id=? AND topic_id=?",
        (learner_id, topic_id)
    ).fetchone()
    if row:
        return dict(row)
    title = TOPIC_MAP.get(topic_id, topic_id)
    conn.execute(
        """INSERT INTO topic_progress (learner_id, topic_id, topic_title)
           VALUES (?, ?, ?)""",
        (learner_id, topic_id, title)
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM topic_progress WHERE learner_id=? AND topic_id=?",
        (learner_id, topic_id)
    ).fetchone()
    return dict(row)


def record_lesson_complete(conn: sqlite3.Connection, learner_id: str, topic_id: str, topic_title: str):
    conn.execute(
        """INSERT INTO learning_sessions (learner_id, topic_id, topic_title, completed)
           VALUES (?, ?, ?, 1)""",
        (learner_id, topic_id, topic_title)
    )
    tp = _get_or_create_topic_progress(conn, learner_id, topic_id)
    new_lessons = tp["lessons_completed"] + 1
    new_mastery = _compute_mastery(
        new_lessons, tp["best_quiz_score"],
        tp["average_accuracy"], tp["quiz_attempts"], tp["practice_attempts"]
    )
    conn.execute(
        """UPDATE topic_progress SET lessons_completed=?, mastery_level=?, updated_at=datetime('now')
           WHERE learner_id=? AND topic_id=?""",
        (new_lessons, new_mastery, learner_id, topic_id)
    )
    conn.commit()


def record_quiz_attempt(conn: sqlite3.Connection, learner_id: str, topic_id: str, topic_title: str,
                        score: float, total: int, correct: int, difficulty: str, time_taken: int):
    conn.execute(
        """INSERT INTO quiz_attempts (learner_id, topic_id, topic_title, score, total_questions, correct_count, difficulty, time_taken_seconds)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (learner_id, topic_id, topic_title, score, total, correct, difficulty, time_taken)
    )
    tp = _get_or_create_topic_progress(conn, learner_id, topic_id)
    new_quiz_attempts = tp["quiz_attempts"] + 1
    new_best = max(tp["best_quiz_score"], score)

    # Recompute average accuracy from all quiz attempts
    rows = conn.execute(
        "SELECT score FROM quiz_attempts WHERE learner_id=? AND topic_id=?",
        (learner_id, topic_id)
    ).fetchall()
    avg_acc = (sum(r["score"] for r in rows) / len(rows)) if rows else 0.0

    new_mastery = _compute_mastery(
        tp["lessons_completed"], new_best, avg_acc, new_quiz_attempts, tp["practice_attempts"]
    )
    conn.execute(
        """UPDATE topic_progress SET quiz_attempts=?, best_quiz_score=?, average_accuracy=?,
           mastery_level=?, updated_at=datetime('now') WHERE learner_id=? AND topic_id=?""",
        (new_quiz_attempts, new_best, avg_acc, new_mastery, learner_id, topic_id)
    )
    conn.commit()


def record_practice_attempt(conn: sqlite3.Connection, learner_id: str, topic_id: str,
                             question_type: str, difficulty: str, is_correct: bool,
                             question_text: str, learner_answer: str, correct_answer: str):
    conn.execute(
        """INSERT INTO practice_attempts (learner_id, topic_id, question_type, difficulty, is_correct, question_text, learner_answer, correct_answer)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (learner_id, topic_id, question_type, difficulty, 1 if is_correct else 0,
         question_text, learner_answer, correct_answer)
    )
    tp = _get_or_create_topic_progress(conn, learner_id, topic_id)
    new_practice = tp["practice_attempts"] + 1

    # Recompute average accuracy from all practice attempts
    rows = conn.execute(
        "SELECT is_correct FROM practice_attempts WHERE learner_id=? AND topic_id=?",
        (learner_id, topic_id)
    ).fetchall()
    avg_acc = (sum(r["is_correct"] for r in rows) / len(rows) * 100) if rows else 0.0

    new_mastery = _compute_mastery(
        tp["lessons_completed"], tp["best_quiz_score"], avg_acc, tp["quiz_attempts"], new_practice
    )
    conn.execute(
        """UPDATE topic_progress SET practice_attempts=?, average_accuracy=?, mastery_level=?,
           updated_at=datetime('now') WHERE learner_id=? AND topic_id=?""",
        (new_practice, avg_acc, new_mastery, learner_id, topic_id)
    )
    conn.commit()


def get_progress_summary(conn: sqlite3.Connection, learner_id: str) -> ProgressSummary:
    topic_rows = conn.execute(
        "SELECT * FROM topic_progress WHERE learner_id=?", (learner_id,)
    ).fetchall()

    total_quizzes = conn.execute(
        "SELECT COUNT(*) as c FROM quiz_attempts WHERE learner_id=?", (learner_id,)
    ).fetchone()["c"]

    total_practice = conn.execute(
        "SELECT COUNT(*) as c FROM practice_attempts WHERE learner_id=?", (learner_id,)
    ).fetchone()["c"]

    total_lessons = conn.execute(
        "SELECT COUNT(*) as c FROM learning_sessions WHERE learner_id=? AND completed=1", (learner_id,)
    ).fetchone()["c"]

    quiz_scores = conn.execute(
        "SELECT score FROM quiz_attempts WHERE learner_id=?", (learner_id,)
    ).fetchall()
    overall_accuracy = (sum(r["score"] for r in quiz_scores) / len(quiz_scores)) if quiz_scores else 0.0

    strong = [r["topic_id"] for r in topic_rows if r["mastery_level"] >= 70]
    weak   = [r["topic_id"] for r in topic_rows if r["mastery_level"] < 40 and (r["quiz_attempts"] + r["practice_attempts"]) > 0]

    topic_schemas = [
        TopicProgressSchema(
            topicId=r["topic_id"],
            topicTitle=r["topic_title"],
            lessonsCompleted=r["lessons_completed"],
            quizAttempts=r["quiz_attempts"],
            practiceAttempts=r["practice_attempts"],
            bestQuizScore=r["best_quiz_score"],
            averageAccuracy=r["average_accuracy"],
            masteryLevel=r["mastery_level"],
        )
        for r in topic_rows
    ]

    return ProgressSummary(
        learnerId=learner_id,
        totalLessonsCompleted=total_lessons,
        totalQuizzes=total_quizzes,
        totalPractice=total_practice,
        overallAccuracy=round(overall_accuracy, 1),
        strongTopics=strong,
        weakTopics=weak,
        topicProgress=topic_schemas,
    )
