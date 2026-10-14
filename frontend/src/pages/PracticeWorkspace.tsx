import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLearnerStore } from '../store/learnerStore';
import { PracticeQuestion, EvaluationResult, QuestionType } from '../types';
import {
  Target,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Code2,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const TOPICS = [
  { id: 'intro', title: 'Introduction to Python' },
  { id: 'variables', title: 'Variables & Data Types' },
  { id: 'io', title: 'Input & Output' },
  { id: 'operators', title: 'Operators' },
  { id: 'conditionals', title: 'Conditional Statements' },
  { id: 'loops', title: 'Loops' },
  { id: 'strings', title: 'Strings & Manipulation' },
  { id: 'collections', title: 'Lists, Tuples, Sets, Dicts' },
  { id: 'functions', title: 'Functions & Scope' },
  { id: 'debugging', title: 'Problem-Solving & Debugging' },
];

const QUESTION_TYPES: { id: QuestionType; label: string; desc: string }[] = [
  { id: 'multiple_choice', label: 'Multiple Choice', desc: 'Select correct option' },
  { id: 'predict_output', label: 'Predict Output', desc: 'Determine output of snippet' },
  { id: 'fill_blank', label: 'Fill in the Blank', desc: 'Complete missing keyword or syntax' },
  { id: 'find_error', label: 'Find the Bug', desc: 'Identify syntax or logic bug' },
  { id: 'short_coding', label: 'Short Code Snippet', desc: 'Write 1-3 lines of code' },
];

export const PracticeWorkspace = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profile = useLearnerStore((state) => state.profile);

  const initialTopic = searchParams.get('topic') || 'intro';

  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    profile?.difficulty || 'easy'
  );
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');

  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [learnerAnswer, setLearnerAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  useEffect(() => {
    if (!profile) {
      navigate('/onboarding');
      return;
    }
  }, [profile, navigate]);

  const handleGenerateQuestion = async () => {
    if (!profile) return;
    setLoading(true);
    setQuestion(null);
    setEvaluation(null);
    setLearnerAnswer('');
    setShowHint(false);

    try {
      const topicObj = TOPICS.find((t) => t.id === selectedTopic);
      const topicTitle = topicObj ? topicObj.title : selectedTopic;

      const q = await api.generatePracticeQuestion(
        selectedTopic,
        topicTitle,
        difficulty,
        questionType,
        profile
      );
      setQuestion(q);
    } catch (err: any) {
      alert(`Failed to generate question: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!question || !learnerAnswer.trim() || !profile) return;
    setEvaluating(true);

    try {
      const res = await api.evaluatePracticeAnswer({
        questionId: question.questionId,
        topicId: question.topicId,
        topic: question.topic,
        questionType: question.questionType,
        questionText: question.questionText,
        options: question.options,
        expectedAnswer: question.expectedAnswer,
        learnerAnswer: learnerAnswer,
        hint: question.hint,
        explanation: question.explanation,
        profile: profile,
        learnerId: profile.learnerId,
        difficulty: difficulty,
      });
      setEvaluation(res);
    } catch (err: any) {
      alert(`Evaluation error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Configuration Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Target size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Practice Mode</h1>
              <p className="text-xs text-gray-500">Configure your target practice session</p>
            </div>
          </div>

          <button
            onClick={handleGenerateQuestion}
            disabled={loading}
            className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="mr-1.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} className="mr-1.5" />
                {question ? 'Next Question' : 'Start Practice'}
              </>
            )}
          </button>
        </div>

        {/* Selection Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
          {/* Topic */}
          <div>
            <label className="block text-gray-600 mb-1.5">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={loading}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-gray-600 mb-1.5">Difficulty</label>
            <div className="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-1.5 rounded-lg capitalize transition-all ${
                    difficulty === d
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-gray-600 mb-1.5">Question Format</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              disabled={loading}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {QUESTION_TYPES.map((qt) => (
                <option key={qt.id} value={qt.id}>
                  {qt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Question Card */}
      {question ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 capitalize">
                {question.difficulty}
              </span>
              <span className="text-xs text-gray-400 capitalize">
                • {question.questionType.replace('_', ' ')}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-400">
              {question.topic}
            </span>
          </div>

          {/* Question Body */}
          <div className="text-base text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
            {question.questionText}
          </div>

          {/* Answer Options or Input */}
          <div className="space-y-3">
            {question.questionType === 'multiple_choice' && question.options && question.options.length > 0 ? (
              <div className="space-y-2.5">
                {question.options.map((option, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all ${
                      learnerAnswer === option
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="practiceOption"
                      value={option}
                      checked={learnerAnswer === option}
                      onChange={(e) => setLearnerAnswer(e.target.value)}
                      className="mt-0.5 mr-3 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Your Answer / Code:</label>
                <textarea
                  rows={question.questionType === 'short_coding' ? 4 : 2}
                  placeholder={
                    question.questionType === 'short_coding'
                      ? 'Type your Python code here...'
                      : 'Type the exact output or missing value...'
                  }
                  value={learnerAnswer}
                  onChange={(e) => setLearnerAnswer(e.target.value)}
                  className="w-full p-3 font-mono text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Hint toggle */}
          {question.hint && (
            <div>
              {showHint ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start space-x-2">
                  <Lightbulb size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Hint: </span>
                    {question.hint}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center text-xs font-semibold text-amber-600 hover:text-amber-700"
                >
                  <Lightbulb size={14} className="mr-1" />
                  Need a hint?
                </button>
              )}
            </div>
          )}

          {/* Action Row */}
          {!evaluation && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleEvaluate}
                disabled={!learnerAnswer.trim() || evaluating}
                className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200 disabled:opacity-50 transition-all"
              >
                {evaluating ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    Submit Answer
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Evaluation Feedback */}
          {evaluation && (
            <div
              className={`p-6 rounded-2xl border transition-all space-y-4 ${
                evaluation.isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center space-x-3">
                {evaluation.isCorrect ? (
                  <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle size={24} className="text-rose-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-extrabold text-base">
                    {evaluation.isCorrect ? 'Correct! Excellent work.' : 'Not quite right'}
                  </h4>
                  <p className="text-xs opacity-80 mt-0.5">
                    Score: {Math.round(evaluation.score * 100)}%
                  </p>
                </div>
              </div>

              {/* Feedback text */}
              <p className="text-sm leading-relaxed">{evaluation.feedback}</p>

              {/* Explanation */}
              {evaluation.explanation && (
                <div className="p-3.5 bg-white/70 rounded-xl text-xs space-y-1">
                  <span className="font-bold">Detailed Explanation:</span>
                  <p>{evaluation.explanation}</p>
                </div>
              )}

              {/* Next Step */}
              {evaluation.suggestedNextStep && (
                <div className="text-xs font-medium opacity-90">
                  <span className="font-bold">Suggested next step: </span>
                  {evaluation.suggestedNextStep}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleGenerateQuestion}
                  className="inline-flex items-center px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <span>Next Practice Question</span>
                  <ChevronRight size={15} className="ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
            <Target size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Ready to Practice?</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Click the button below to generate a real-time question customized for your chosen topic, format, and difficulty.
          </p>
          <div>
            <button
              onClick={handleGenerateQuestion}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all hover:scale-105"
            >
              <Sparkles size={16} className="mr-2" />
              Generate First Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
