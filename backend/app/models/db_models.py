from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.db.database import Base


class LearnerProfile(Base):
    __tablename__ = "learner_profiles"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    experience = Column(String, default="beginner")
    goal = Column(String, default="")
    explanation_style = Column(String, default="simple")
    difficulty = Column(String, default="easy")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    learner_id = Column(String, nullable=False, index=True)
    topic_id = Column(String, nullable=False)
    topic_title = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    messages_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    learner_id = Column(String, nullable=False, index=True)
    topic_id = Column(String, nullable=False)
    topic_title = Column(String, nullable=False)
    score = Column(Float, default=0.0)
    total_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    difficulty = Column(String, default="easy")
    time_taken_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())


class PracticeAttempt(Base):
    __tablename__ = "practice_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    learner_id = Column(String, nullable=False, index=True)
    topic_id = Column(String, nullable=False)
    question_type = Column(String, nullable=False)
    difficulty = Column(String, default="easy")
    is_correct = Column(Boolean, default=False)
    question_text = Column(Text, default="")
    learner_answer = Column(Text, default="")
    correct_answer = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())


class TopicProgress(Base):
    __tablename__ = "topic_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    learner_id = Column(String, nullable=False, index=True)
    topic_id = Column(String, nullable=False)
    topic_title = Column(String, nullable=False)
    lessons_completed = Column(Integer, default=0)
    quiz_attempts = Column(Integer, default=0)
    practice_attempts = Column(Integer, default=0)
    best_quiz_score = Column(Float, default=0.0)
    average_accuracy = Column(Float, default=0.0)
    mastery_level = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
