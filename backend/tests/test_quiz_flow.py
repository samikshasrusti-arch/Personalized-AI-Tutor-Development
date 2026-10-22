import unittest
import sqlite3
import json
import uuid
from fastapi.testclient import TestClient
from main import app
from app.db.database import get_db


# In-memory database fixture for test isolation
def override_get_db():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE quiz_sessions (
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
    """)
    conn.execute("""
        CREATE TABLE quiz_attempts (
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
    """)
    conn.execute("""
        CREATE TABLE topic_progress (
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
    """)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


class TestQuizSessionFlow(unittest.TestCase):

    def setUp(self):
        # We use a standalone SQLite in-memory or file for test
        self.conn = sqlite3.connect(":memory:", check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("""
            CREATE TABLE quiz_sessions (
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
        """)
        self.conn.execute("""
            CREATE TABLE quiz_attempts (
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
        """)
        self.conn.execute("""
            CREATE TABLE topic_progress (
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
        """)

        self.conn.execute("""
            CREATE TABLE practice_sessions (
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
        """)

        def get_test_db():
            try:
                yield self.conn
                self.conn.commit()
            except Exception:
                self.conn.rollback()
                raise

        app.dependency_overrides[get_db] = get_test_db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.conn.close()

    def test_submit_quiz_authoritative_scoring(self):
        quiz_id = str(uuid.uuid4())
        authoritative_questions = [
            {
                "questionId": "q1",
                "questionText": "What keyword defines a function?",
                "options": ["A) def", "B) func", "C) fn", "D) define"],
                "correctAnswer": "A) def",
                "explanation": "def defines a function."
            },
            {
                "questionId": "q2",
                "questionText": "What is 2 ** 3 in Python?",
                "options": ["A) 6", "B) 8", "C) 9", "D) 5"],
                "correctAnswer": "B) 8",
                "explanation": "** is exponentiation."
            }
        ]

        self.conn.execute(
            """INSERT INTO quiz_sessions 
               (id, learner_id, topic_id, topic_title, difficulty, questions_json, status)
               VALUES (?, 'learner-123', 'functions', 'Functions', 'easy', ?, 'pending')""",
            (quiz_id, json.dumps(authoritative_questions))
        )
        self.conn.commit()

        # Submit 1 correct, 1 incorrect
        resp = self.client.post("/api/quiz/submit", json={
            "quizId": quiz_id,
            "learnerId": "learner-123",
            "topicId": "functions",
            "topicTitle": "Functions",
            "difficulty": "easy",
            "answers": {
                "q1": "A",
                "q2": "A"
            },
            "timeTakenSeconds": 30,
            "profile": {
                "learnerId": "learner-123",
                "name": "Alex",
                "experience": "beginner",
                "goal": "Learn",
                "explanationStyle": "simple",
                "difficulty": "easy"
            }
        })

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["correctCount"], 1)
        self.assertEqual(data["totalQuestions"], 2)
        self.assertEqual(data["score"], 50.0)

        # Ensure answer explanations are now revealed post-submission
        self.assertEqual(data["results"][0]["correctAnswer"], "A) def")
        self.assertEqual(data["results"][0]["explanation"], "def defines a function.")

        # Duplicate submission prevention (should return 409 Conflict)
        dup_resp = self.client.post("/api/quiz/submit", json={
            "quizId": quiz_id,
            "learnerId": "learner-123",
            "topicId": "functions",
            "topicTitle": "Functions",
            "difficulty": "easy",
            "answers": {"q1": "A"},
            "profile": {
                "learnerId": "learner-123",
                "name": "Alex",
                "experience": "beginner",
                "goal": "Learn",
                "explanationStyle": "simple",
                "difficulty": "easy"
            }
        })
        self.assertEqual(dup_resp.status_code, 409)

    def test_submit_quiz_nonexistent_session(self):
        resp = self.client.post("/api/quiz/submit", json={
            "quizId": "nonexistent-id",
            "learnerId": "learner-123",
            "topicId": "functions",
            "topicTitle": "Functions",
            "difficulty": "easy",
            "answers": {},
            "profile": {
                "learnerId": "learner-123",
                "name": "Alex",
                "experience": "beginner",
                "goal": "Learn",
                "explanationStyle": "simple",
                "difficulty": "easy"
            }
        })
        self.assertEqual(resp.status_code, 404)

    def test_submit_quiz_unknown_question_id_rejected(self):
        quiz_id = str(uuid.uuid4())
        authoritative_questions = [
            {
                "questionId": "q1",
                "questionText": "What keyword defines a function?",
                "options": ["A) def", "B) func"],
                "correctAnswer": "A) def",
                "explanation": "def is correct."
            }
        ]
        self.conn.execute(
            """INSERT INTO quiz_sessions 
               (id, learner_id, topic_id, topic_title, difficulty, questions_json, status)
               VALUES (?, 'learner-123', 'functions', 'Functions', 'easy', ?, 'pending')""",
            (quiz_id, json.dumps(authoritative_questions))
        )
        self.conn.commit()

        # Submit with unknown question ID
        resp = self.client.post("/api/quiz/submit", json={
            "quizId": quiz_id,
            "learnerId": "learner-123",
            "topicId": "functions",
            "topicTitle": "Functions",
            "difficulty": "easy",
            "answers": {"fabricated_question_id": "A"},
            "profile": {
                "learnerId": "learner-123",
                "name": "Alex",
                "experience": "beginner",
                "goal": "Learn",
                "explanationStyle": "simple",
                "difficulty": "easy"
            }
        })
        self.assertEqual(resp.status_code, 422)

    def test_practice_evaluation_authoritative(self):
        question_id = str(uuid.uuid4())
        # Store practice question in database
        self.conn.execute(
            """INSERT INTO practice_sessions 
               (id, learner_id, topic_id, topic_title, difficulty, question_type, 
                question_text, options_json, expected_answer, explanation, hint, status)
               VALUES (?, 'learner-123', 'variables', 'Variables', 'easy', 'multiple_choice', 
                       'What type is 42?', '[\"A) int\", \"B) float\"]', 'A) int', 
                       '42 is an integer.', 'Think of whole numbers.', 'pending')""",
            (question_id,)
        )
        self.conn.commit()

        # Client attempts to cheat by providing expectedAnswer="B) float"
        resp = self.client.post("/api/practice/evaluate", json={
            "questionId": question_id,
            "learnerAnswer": "A",
            "expectedAnswer": "B) float",  # Spoofed by client
            "explanation": "Fake explanation",
            "questionType": "multiple_choice",
            "questionText": "What type is 42?",
            "topicId": "variables",
            "topic": "Variables",
            "learnerId": "learner-123"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # Evaluated against AUTHORITATIVE expected answer ('A) int'), NOT spoofed ('B) float')
        self.assertTrue(data["isCorrect"])
        self.assertEqual(data["explanation"], "42 is an integer.")


if __name__ == "__main__":
    unittest.main()
