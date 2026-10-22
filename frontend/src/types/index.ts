export interface LearnerProfile {
  learnerId: string;
  name: string;
  experience: 'beginner' | 'some_coding' | 'intermediate';
  goal: string;
  explanationStyle: 'simple' | 'detailed' | 'analogy-based';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Topic {
  id: string;
  title: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface ExplainRequest {
  topic: string;
  topicId: string;
  profile: LearnerProfile;
}

export interface AskRequest {
  topic: string;
  topicId: string;
  profile: LearnerProfile;
  question: string;
  context: { role: 'user' | 'assistant' | 'system'; content: string }[];
}

export type QuestionType =
  | 'multiple_choice'
  | 'predict_output'
  | 'fill_blank'
  | 'find_error'
  | 'short_coding';

export interface PracticeQuestion {
  questionId: string;
  topicId: string;
  topic: string;
  difficulty: string;
  questionType: QuestionType;
  questionText: string;
  options?: string[];
  expectedAnswer?: string;
  explanation: string;
  hint: string;
}

export interface EvaluationResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  explanation: string;
  hint?: string;
  suggestedNextStep: string;
}

export interface QuizQuestion {
  questionId: string;
  questionText: string;
  options: string[];
  correctAnswer?: string;
  explanation?: string;
  hint: string;
  topic: string;
  difficulty: string;
}

export interface QuizAnswerResult {
  questionId: string;
  questionText: string;
  learnerAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizSubmitResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  results: QuizAnswerResult[];
  topicId: string;
  topicTitle: string;
  difficulty: string;
  recommendation: string;
}

export interface TopicProgress {
  topicId: string;
  topicTitle: string;
  lessonsCompleted: number;
  quizAttempts: number;
  practiceAttempts: number;
  bestQuizScore: number;
  averageAccuracy: number;
  masteryLevel: number;
}

export interface ProgressSummary {
  learnerId: string;
  totalLessonsCompleted: number;
  totalQuizzes: number;
  totalPractice: number;
  overallAccuracy: number;
  strongTopics: string[];
  weakTopics: string[];
  topicProgress: TopicProgress[];
}

export interface Recommendation {
  topicId: string;
  topicTitle: string;
  reason: string;
  suggestedActivity: 'learn' | 'practice' | 'quiz' | 'revise';
  difficulty: string;
}

export interface HealthStatus {
  status: string;
  message: string;
  model: string;
  ai_configured: boolean;
}
