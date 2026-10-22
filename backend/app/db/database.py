"""
Lightweight SQLite data access layer using Python's built-in sqlite3 module.
This avoids SQLAlchemy's compiled C extensions which may be blocked on some systems.
"""
import sqlite3
import os
from typing import Generator
from contextlib import contextmanager

DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ai_tutor.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def get_db_context():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_db() -> Generator:
    """FastAPI dependency — yields a sqlite3 connection."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create all tables if they don't exist."""
    with get_db_context() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS learner_profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            experience TEXT DEFAULT 'beginner',
            goal TEXT DEFAULT '',
            explanation_style TEXT DEFAULT 'simple',
            difficulty TEXT DEFAULT 'easy',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS learning_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            learner_id TEXT NOT NULL,
            topic_id TEXT NOT NULL,
            topic_title TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            messages_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_learning_sessions_learner_id ON learning_sessions(learner_id);

        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            learner_id TEXT NOT NULL,
            topic_id TEXT NOT NULL,
            topic_title TEXT NOT NULL,
            score REAL DEFAULT 0.0,
            total_questions INTEGER DEFAULT 0,
            correct_count INTEGER DEFAULT 0,
            difficulty TEXT DEFAULT 'easy',
            time_taken_seconds INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_learner_id ON quiz_attempts(learner_id);

        CREATE TABLE IF NOT EXISTS practice_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            learner_id TEXT NOT NULL,
            topic_id TEXT NOT NULL,
            question_type TEXT NOT NULL,
            difficulty TEXT DEFAULT 'easy',
            is_correct INTEGER DEFAULT 0,
            question_text TEXT DEFAULT '',
            learner_answer TEXT DEFAULT '',
            correct_answer TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_practice_attempts_learner_id ON practice_attempts(learner_id);

        CREATE TABLE IF NOT EXISTS topic_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            learner_id TEXT NOT NULL,
            topic_id TEXT NOT NULL,
            topic_title TEXT NOT NULL,
            lessons_completed INTEGER DEFAULT 0,
            quiz_attempts INTEGER DEFAULT 0,
            practice_attempts INTEGER DEFAULT 0,
            best_quiz_score REAL DEFAULT 0.0,
            average_accuracy REAL DEFAULT 0.0,
            mastery_level REAL DEFAULT 0.0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_topic_progress_learner_id ON topic_progress(learner_id);

        CREATE TABLE IF NOT EXISTS quiz_sessions (
            id TEXT PRIMARY KEY,
            learner_id TEXT NOT NULL,
            topic_id TEXT NOT NULL,
            topic_title TEXT NOT NULL,
            difficulty TEXT DEFAULT 'easy',
            questions_json TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            score REAL DEFAULT 0.0,
            correct_count INTEGER DEFAULT 0,
            total_questions INTEGER DEFAULT 0,
            time_taken_seconds INTEGER DEFAULT 0,
            result_json TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            submitted_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_quiz_sessions_learner_id ON quiz_sessions(learner_id);

        CREATE TABLE IF NOT EXISTS practice_sessions (
            id TEXT PRIMARY KEY,
            learner_id TEXT NOT NULL,
            topic_id TEXT NOT NULL,
            topic_title TEXT NOT NULL,
            difficulty TEXT DEFAULT 'easy',
            question_type TEXT NOT NULL,
            question_text TEXT NOT NULL,
            options_json TEXT,
            expected_answer TEXT NOT NULL,
            explanation TEXT NOT NULL,
            hint TEXT DEFAULT '',
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT (datetime('now')),
            evaluated_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_practice_sessions_learner_id ON practice_sessions(learner_id);
        """)
