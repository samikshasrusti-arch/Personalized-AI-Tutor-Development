import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { QuizSubmitResult } from '../types';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Target,
  LayoutDashboard,
  Sparkles,
  BookOpen
} from 'lucide-react';

export const QuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result: QuizSubmitResult | undefined = location.state?.result;

  if (!result) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">No recent quiz result found</h2>
        <p className="text-sm text-gray-500">Take a quiz first to view results and analytics.</p>
        <div>
          <Link
            to="/quiz"
            className="inline-flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md"
          >
            Go to Quiz Mode
          </Link>
        </div>
      </div>
    );
  }

  const isPassing = result.score >= 60;
  const isMastered = result.score >= 80;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Score Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10 text-center relative overflow-hidden">
        <div className="inline-flex p-4 rounded-3xl bg-purple-50 text-purple-600 mb-4 shadow-inner">
          <Trophy size={48} className={isMastered ? 'text-amber-500 animate-bounce' : 'text-purple-600'} />
        </div>

        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quiz Complete!</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">{result.topicTitle} • {result.difficulty.toUpperCase()}</p>

        {/* Big Score Display */}
        <div className="my-6">
          <div className="text-6xl font-black text-purple-600 tracking-tight">
            {Math.round(result.score)}%
          </div>
          <p className="text-sm font-semibold text-gray-600 mt-2">
            You answered <span className="text-purple-600 font-bold">{result.correctCount}</span> out of{' '}
            <span className="font-bold">{result.totalQuestions}</span> questions correctly
          </p>
        </div>

        {/* Time and Stats Chips */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-gray-500">
          <span className="flex items-center px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
            <Clock size={14} className="mr-1.5 text-purple-600" />
            Time Taken: {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s
          </span>
          <span className={`px-3 py-1.5 rounded-xl border ${
            isMastered
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isPassing
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {isMastered ? 'Mastery Achieved' : isPassing ? 'Passed' : 'Needs Practice'}
          </span>
        </div>

        {/* AI Recommendation Message */}
        {result.recommendation && (
          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-100 text-left flex items-start space-x-3">
            <Sparkles size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                AI Tutor Recommendation
              </h4>
              <p className="text-sm text-purple-950 mt-1 leading-relaxed">
                {result.recommendation}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate(`/quiz?topic=${result.topicId}`)}
            className="inline-flex items-center px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all"
          >
            <RotateCcw size={15} className="mr-1.5" />
            Retry Quiz
          </button>
          <button
            onClick={() => navigate(`/practice?topic=${result.topicId}`)}
            className="inline-flex items-center px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all"
          >
            <Target size={15} className="mr-1.5" />
            Practice Weak Areas
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-200 transition-all"
          >
            <LayoutDashboard size={15} className="mr-1.5" />
            Dashboard
          </button>
        </div>
      </div>

      {/* Question by Question Review */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-gray-900">Question Review</h2>
        <div className="space-y-4">
          {result.results.map((q, idx) => (
            <div
              key={q.questionId || idx}
              className={`bg-white rounded-2xl border p-6 shadow-2xs space-y-3 transition-all ${
                q.isCorrect ? 'border-gray-100' : 'border-rose-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-bold text-gray-900">{q.questionText}</p>
                </div>
                {q.isCorrect ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                    <CheckCircle2 size={13} className="mr-1" /> Correct
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex-shrink-0">
                    <XCircle size={13} className="mr-1" /> Incorrect
                  </span>
                )}
              </div>

              {/* Answers comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div
                  className={`p-3 rounded-xl border ${
                    q.isCorrect
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/50 border-rose-200 text-rose-950'
                  }`}
                >
                  <span className="font-bold opacity-75">Your Answer:</span>
                  <p className="mt-1 font-medium">{q.learnerAnswer}</p>
                </div>

                <div className="p-3 rounded-xl border bg-gray-50 border-gray-200 text-gray-900">
                  <span className="font-bold opacity-75">Correct Answer:</span>
                  <p className="mt-1 font-medium text-emerald-700">{q.correctAnswer}</p>
                </div>
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-100">
                  <span className="font-bold text-gray-800">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
