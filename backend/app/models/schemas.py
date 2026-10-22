from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict


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
    topicId: str = Field(..., min_length=1, max_length=64)
    topic: str = Field(..., min_length=1, max_length=100)
    difficulty: Literal["easy", "medium", "hard"] = "easy"
    questionType: Literal["multiple_choice", "predict_output", "fill_blank", "find_error", "short_coding"] = "multiple_choice"
    profile: ProfileSchema


class PracticeQuestionPublic(BaseModel):
    questionId: str
    topicId: str
    topic: str
    difficulty: str
    questionType: str
    questionText: str
    options: Optional[List[str]] = None
    hint: str = ""


class PracticeQuestion(PracticeQuestionPublic):
    expectedAnswer: Optional[str] = ""
    explanation: Optional[str] = ""


class EvaluatePracticeRequest(BaseModel):
    questionId: str = Field(..., min_length=1, max_length=64)
    learnerAnswer: str = Field(..., min_length=1, max_length=5000)
    topicId: str = Field(default="", max_length=64)
    topic: str = Field(default="", max_length=100)
    questionType: str = Field(default="multiple_choice", max_length=50)
    questionText: str = Field(default="", max_length=5000)
    options: Optional[List[str]] = None
    expectedAnswer: Optional[str] = None
    hint: Optional[str] = ""
    explanation: Optional[str] = ""
    profile: Optional[ProfileSchema] = None
    learnerId: str = Field(default="", max_length=64)
    difficulty: str = Field(default="easy", max_length=20)


class EvaluationResult(BaseModel):
    isCorrect: bool
    score: float = 0.0          # 0-1
    feedback: str
    explanation: str
    hint: Optional[str] = None
    suggestedNextStep: str


# ─── Quiz ───────────────────────────────────────────────────────────────────

class CreateQuizRequest(BaseModel):
    topicId: str = Field(..., min_length=1, max_length=64)
    topic: str = Field(..., min_length=1, max_length=100)
    difficulty: Literal["easy", "medium", "hard"] = "easy"
    questionCount: int = Field(default=5, ge=3, le=15)
    profile: ProfileSchema


class QuizQuestionPublic(BaseModel):
    questionId: str
    questionText: str
    options: List[str]
    hint: str = ""
    topic: str = ""
    difficulty: str = ""


class QuizQuestion(QuizQuestionPublic):
    correctAnswer: Optional[str] = ""
    explanation: Optional[str] = ""


class QuizQuestionWithAnswer(QuizQuestion):
    pass


class CreateQuizResponse(BaseModel):
    quizId: str
    questions: List[QuizQuestionPublic]
    topic: str
    difficulty: str


class SubmitQuizRequest(BaseModel):
    quizId: str = Field(..., min_length=1, max_length=64)
    learnerId: str = Field(default="", max_length=64)
    topicId: str = Field(default="", max_length=64)
    topicTitle: str = Field(default="", max_length=100)
    difficulty: str = Field(default="easy", max_length=20)
    questions: Optional[List[QuizQuestion]] = None
    answers: Dict[str, str] = Field(default_factory=dict)
    timeTakenSeconds: int = Field(default=0, ge=0, le=86400)
    profile: Optional[ProfileSchema] = None


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
