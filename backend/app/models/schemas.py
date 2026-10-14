from pydantic import BaseModel, Field
from typing import List, Optional, Literal


# ─── Profile ────────────────────────────────────────────────────────────────

class ProfileSchema(BaseModel):
    learnerId: str = ""
    name: str
    experience: Literal["beginner", "some_coding", "intermediate"] = "beginner"
    goal: str = ""
    explanationStyle: Literal["simple", "detailed", "analogy-based"] = "simple"
    difficulty: Literal["easy", "medium", "hard"] = "easy"


# ─── Learn ──────────────────────────────────────────────────────────────────

class ExplainRequest(BaseModel):
    topic: str
    topicId: str = ""
    profile: ProfileSchema


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class AskRequest(BaseModel):
    topic: str
    topicId: str = ""
    profile: ProfileSchema
    question: str
    context: List[ChatMessage] = []


class MarkCompleteRequest(BaseModel):
    learnerId: str
    topicId: str
    topicTitle: str


# ─── Practice ───────────────────────────────────────────────────────────────

class GeneratePracticeRequest(BaseModel):
    topicId: str
    topic: str
    difficulty: Literal["easy", "medium", "hard"] = "easy"
    questionType: Literal["multiple_choice", "predict_output", "fill_blank", "find_error", "short_coding"] = "multiple_choice"
    profile: ProfileSchema


class PracticeQuestion(BaseModel):
    questionId: str
    topicId: str
    topic: str
    difficulty: str
    questionType: str
    questionText: str
    options: Optional[List[str]] = None
    expectedAnswer: Optional[str] = None
    explanation: str
    hint: str


class EvaluatePracticeRequest(BaseModel):
    questionId: str
    topicId: str
    topic: str
    questionType: str
    questionText: str
    options: Optional[List[str]] = None
    expectedAnswer: Optional[str] = None
    learnerAnswer: str
    hint: str
    explanation: str
    profile: ProfileSchema
    learnerId: str = ""
    difficulty: str = "easy"


class EvaluationResult(BaseModel):
    isCorrect: bool
    score: float = 0.0          # 0-1
    feedback: str
    explanation: str
    hint: Optional[str] = None
    suggestedNextStep: str


# ─── Quiz ───────────────────────────────────────────────────────────────────

class CreateQuizRequest(BaseModel):
    topicId: str
    topic: str
    difficulty: Literal["easy", "medium", "hard"] = "easy"
    questionCount: int = Field(default=5, ge=3, le=15)
    profile: ProfileSchema


class QuizQuestion(BaseModel):
    questionId: str
    questionText: str
    options: List[str]
    correctAnswer: str
    explanation: str
    hint: str
    topic: str
    difficulty: str


class QuizQuestionWithAnswer(QuizQuestion):
    pass


class SubmitQuizRequest(BaseModel):
    learnerId: str
    topicId: str
    topicTitle: str
    difficulty: str
    questions: List[QuizQuestion]
    answers: dict           # questionId -> learner's answer string
    timeTakenSeconds: int = 0
    profile: ProfileSchema


class QuizAnswerResult(BaseModel):
    questionId: str
    questionText: str
    learnerAnswer: str
    correctAnswer: str
    isCorrect: bool
    explanation: str


class QuizSubmitResult(BaseModel):
    score: float            # percentage 0-100
    correctCount: int
    totalQuestions: int
    timeTakenSeconds: int
    results: List[QuizAnswerResult]
    topicId: str
    topicTitle: str
    difficulty: str
    recommendation: str


# ─── Progress ───────────────────────────────────────────────────────────────

class TopicProgressSchema(BaseModel):
    topicId: str
    topicTitle: str
    lessonsCompleted: int = 0
    quizAttempts: int = 0
    practiceAttempts: int = 0
    bestQuizScore: float = 0.0
    averageAccuracy: float = 0.0
    masteryLevel: float = 0.0   # 0-100


class ProgressSummary(BaseModel):
    learnerId: str
    totalLessonsCompleted: int = 0
    totalQuizzes: int = 0
    totalPractice: int = 0
    overallAccuracy: float = 0.0
    strongTopics: List[str] = []
    weakTopics: List[str] = []
    topicProgress: List[TopicProgressSchema] = []


class RecommendationSchema(BaseModel):
    topicId: str
    topicTitle: str
    reason: str
    suggestedActivity: Literal["learn", "practice", "quiz", "revise"]
    difficulty: str
