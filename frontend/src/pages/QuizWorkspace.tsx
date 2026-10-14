import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLearnerStore } from '../store/learnerStore';
import { QuizQuestion } from '../types';
import {
  FileQuestion,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  Send
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

export const QuizWorkspace = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profile = useLearnerStore((state) => state.profile);

  const initialTopic = searchParams.get('topic') || 'intro';

  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    profile?.difficulty || 'easy'
  );
  const [questionCount, setQuestionCount] = useState(5);

  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!profile) {
      navigate('/onboarding');
      return;
    }
  }, [profile, navigate]);

  // Timer
  useEffect(() => {
    let interval: any;
    if (quizStarted && !submitting) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted, submitting]);

  const handleStartQuiz = async () => {
    if (!profile) return;
    setLoading(true);
    setAnswers({});
    setCurrentIndex(0);
    setShowHint(false);
    setSecondsElapsed(0);

    try {
      const topicObj = TOPICS.find((t) => t.id === selectedTopic);
      const topicTitle = topicObj ? topicObj.title : selectedTopic;

      const res = await api.createQuiz(
        selectedTopic,
        topicTitle,
        difficulty,
        questionCount,
        profile
      );
      if (res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
        setQuizStarted(true);
      } else {
        alert('No questions were returned. Please try again.');
      }
    } catch (err: any) {
      alert(`Failed to create quiz: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!profile || submitting) return;

    // Check if some unanswered
    const unansweredCount = questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    const topicObj = TOPICS.find((t) => t.id === selectedTopic);
    const topicTitle = topicObj ? topicObj.title : selectedTopic;

    try {
      const result = await api.submitQuiz({
        learnerId: profile.learnerId,
        topicId: selectedTopic,
        topicTitle: topicTitle,
        difficulty: difficulty,
        questions: questions,
        answers: answers,
        timeTakenSeconds: secondsElapsed,
        profile: profile,
      });

      // Pass result into location state and navigate
      navigate('/quiz/results', { state: { result } });
    } catch (err: any) {
      alert(`Error submitting quiz: ${err.response?.data?.detail || err.message}`);
      setSubmitting(false);
    }
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!quizStarted ? (
        /* Quiz Setup Card */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10 space-y-8">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl">
              <FileQuestion size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Assessment Quiz</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Test your understanding with dynamically generated questions scored deterministically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Topic */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 text-xs rounded-lg capitalize transition-all ${
                      difficulty === d
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions count */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Questions Count
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
                {[3, 5, 10].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 text-xs rounded-lg transition-all ${
                      questionCount === cnt
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleStartQuiz}
              disabled={loading}
              className="inline-flex items-center px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="mr-2 animate-spin" />
                  Generating Quiz Questions...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Start Assessment Quiz
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Active Session */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Status Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs text-gray-400">
                • {answeredCount} answered
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
              <Clock size={14} className="text-purple-600" />
              <span>
                {Math.floor(secondsElapsed / 60)}:
                {(secondsElapsed % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question text */}
          <div className="text-lg font-bold text-gray-900 whitespace-pre-wrap leading-relaxed">
            {currentQ.questionText}
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt, i) => {
              const isSelected = answers[currentQ.questionId] === opt;
              return (
                <label
                  key={i}
                  className={`flex items-start p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-500/20 font-semibold'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name={`quiz-${currentQ.questionId}`}
                    value={opt}
                    checked={isSelected}
                    onChange={() => handleSelectOption(currentQ.questionId, opt)}
                    className="mt-0.5 mr-3.5 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              );
            })}
          </div>

          {/* Hint button */}
          {currentQ.hint && (
            <div className="pt-2">
              {showHint ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start space-x-2">
                  <Lightbulb size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Hint: </span>
                    {currentQ.hint}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center text-xs font-semibold text-amber-600 hover:text-amber-700"
                >
                  <Lightbulb size={14} className="mr-1" />
                  View Hint
                </button>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => {
                setShowHint(false);
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentIndex === 0}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-30 rounded-xl"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Previous
            </button>

            <div className="flex items-center space-x-3">
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => {
                    setShowHint(false);
                    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
                  }}
                  className="inline-flex items-center px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Next Question
                  <ArrowRight size={16} className="ml-1.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="inline-flex items-center px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-200 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={15} className="mr-1.5 animate-spin" />
                      Grading Quiz...
                    </>
                  ) : (
                    <>
                      <Send size={15} className="mr-1.5" />
                      Submit Quiz
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
