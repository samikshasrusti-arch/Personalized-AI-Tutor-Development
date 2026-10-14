import axios from 'axios';
import {
  LearnerProfile,
  Topic,
  PracticeQuestion,
  EvaluationResult,
  QuizQuestion,
  QuizSubmitResult,
  ProgressSummary,
  Recommendation,
  HealthStatus,
  QuestionType,
} from '../types';

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 seconds for LLM responses
});

export const api = {
  // Health
  async getHealth(): Promise<HealthStatus> {
    const res = await client.get('/health');
    return res.data;
  },

  // Topics
  async getTopics(): Promise<Topic[]> {
    const res = await client.get('/topics/');
    return res.data.topics || [];
  },

  // Learn
  async explainTopic(topic: string, topicId: string, profile: LearnerProfile): Promise<string> {
    const res = await client.post('/learn/explain', {
      topic,
      topicId,
      profile,
    });
    return res.data.content;
  },

  async askQuestion(
    topic: string,
    topicId: string,
    profile: LearnerProfile,
    question: string,
    context: { role: string; content: string }[]
  ): Promise<string> {
    const res = await client.post('/learn/ask', {
      topic,
      topicId,
      profile,
      question,
      context,
    });
    return res.data.content;
  },

  async markLessonComplete(learnerId: string, topicId: string, topicTitle: string): Promise<boolean> {
    const res = await client.post('/learn/complete', {
      learnerId,
      topicId,
      topicTitle,
    });
    return res.data.success;
  },

  // Practice
  async generatePracticeQuestion(
    topicId: string,
    topic: string,
    difficulty: string,
    questionType: QuestionType,
    profile: LearnerProfile
  ): Promise<PracticeQuestion> {
    const res = await client.post('/practice/generate', {
      topicId,
      topic,
      difficulty,
      questionType,
      profile,
    });
    return res.data;
  },

  async evaluatePracticeAnswer(data: {
    questionId: string;
    topicId: string;
    topic: string;
    questionType: string;
    questionText: string;
    options?: string[];
    expectedAnswer?: string;
    learnerAnswer: string;
    hint: string;
    explanation: string;
    profile: LearnerProfile;
    learnerId: string;
    difficulty: string;
  }): Promise<EvaluationResult> {
    const res = await client.post('/practice/evaluate', data);
    return res.data;
  },

  // Quiz
  async createQuiz(
    topicId: string,
    topic: string,
    difficulty: string,
    questionCount: number,
    profile: LearnerProfile
  ): Promise<{ questions: QuizQuestion[]; topic: string; difficulty: string }> {
    const res = await client.post('/quiz/create', {
      topicId,
      topic,
      difficulty,
      questionCount,
      profile,
    });
    return res.data;
  },

  async submitQuiz(data: {
    learnerId: string;
    topicId: string;
    topicTitle: string;
    difficulty: string;
    questions: QuizQuestion[];
    answers: Record<string, string>;
    timeTakenSeconds: number;
    profile: LearnerProfile;
  }): Promise<QuizSubmitResult> {
    const res = await client.post('/quiz/submit', data);
    return res.data;
  },

  // Progress
  async getProgress(learnerId: string): Promise<ProgressSummary> {
    const res = await client.get(`/progress/${learnerId}`);
    return res.data;
  },

  async getRecommendation(learnerId: string): Promise<Recommendation> {
    const res = await client.get(`/progress/${learnerId}/recommendation`);
    return res.data;
  },
};
