import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLearnerStore } from '../store/learnerStore';
import { ProgressSummary, Recommendation } from '../types';
import {
  Trophy,
  Target,
  BookOpen,
  Award,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Compass,
  FileQuestion
} from 'lucide-react';

export const ProgressRevision = () => {
  const navigate = useNavigate();
  const profile = useLearnerStore((state) => state.profile);

  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [prog, rec] = await Promise.allSettled([
        api.getProgress(profile.learnerId),
        api.getRecommendation(profile.learnerId),
      ]);
      if (prog.status === 'fulfilled') setProgress(prog.value);
      if (rec.status === 'fulfilled') setRecommendation(rec.value);
    } catch (err) {
      console.warn('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) {
      navigate('/onboarding');
      return;
    }
    fetchStats();
  }, [profile, navigate]);

  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Progress & Revision Hub
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Real performance tracking derived from your recorded quiz attempts, practice evaluations, and completed lessons.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs self-start"
        >
          <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 text-indigo-600">
            <BookOpen size={20} />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Lessons</span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">
            {progress?.totalLessonsCompleted || 0} <span className="text-xs text-gray-400 font-normal">/ 10</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 text-emerald-600">
            <Target size={20} />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Practice</span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">
            {progress?.totalPractice || 0} <span className="text-xs text-gray-400 font-normal">questions</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 text-purple-600">
            <Trophy size={20} />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Quizzes</span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">
            {progress?.totalQuizzes || 0} <span className="text-xs text-gray-400 font-normal">completed</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 text-blue-600">
            <TrendingUp size={20} />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Accuracy</span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">
            {Math.round(progress?.overallAccuracy || 0)}%
          </p>
        </div>
      </div>

      {/* Strong & Weak Topics Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Topics */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 size={18} />
            <h3>Strong Topics (Mastery ≥ 70%)</h3>
          </div>
          {progress?.strongTopics && progress.strongTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {progress.strongTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200"
                >
                  {topic.replace('-', ' ').toUpperCase()}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 pt-1">
              Complete lessons and score above 70% in quizzes to establish strong topics.
            </p>
          )}
        </div>

        {/* Weak Topics */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
            <AlertTriangle size={18} />
            <h3>Topics Needing Revision</h3>
          </div>
          {progress?.weakTopics && progress.weakTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {progress.weakTopics.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/practice?topic=${topic}`)}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-semibold border border-amber-200 flex items-center gap-1 transition-colors"
                >
                  <span>{topic.replace('-', ' ').toUpperCase()}</span>
                  <ArrowRight size={12} />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 pt-1">
              No weak topics detected yet! Keep practicing to calibrate your learning profile.
            </p>
          )}
        </div>
      </div>

      {/* AI Recommendation Banner */}
      {recommendation && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <Compass size={16} />
              <span>Personalized Study Plan</span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">
              Recommended: {recommendation.topicTitle}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {recommendation.reason}
            </p>
          </div>

          <button
            onClick={() => {
              if (recommendation.suggestedActivity === 'practice') {
                navigate(`/practice?topic=${recommendation.topicId}`);
              } else if (recommendation.suggestedActivity === 'quiz') {
                navigate(`/quiz?topic=${recommendation.topicId}`);
              } else {
                navigate(`/learn/${recommendation.topicId}`);
              }
            }}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-105"
          >
            <span>Revise This Topic</span>
            <ArrowRight size={14} className="ml-1.5" />
          </button>
        </div>
      )}

      {/* Topic-by-Topic Mastery Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900">Topic-Level Performance</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Mastery is determined by lesson completion, practice activity, and validated quiz scores.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-6">Topic</th>
                <th className="py-3 px-4">Mastery</th>
                <th className="py-3 px-4">Lessons</th>
                <th className="py-3 px-4">Practice</th>
                <th className="py-3 px-4">Best Quiz</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {progress?.topicProgress && progress.topicProgress.length > 0 ? (
                progress.topicProgress.map((tp) => (
                  <tr key={tp.topicId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">
                      {tp.topicTitle}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              tp.masteryLevel >= 75
                                ? 'bg-emerald-500'
                                : tp.masteryLevel >= 40
                                ? 'bg-indigo-600'
                                : 'bg-gray-300'
                            }`}
                            style={{ width: `${Math.max(tp.masteryLevel, 4)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-700">
                          {Math.round(tp.masteryLevel)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {tp.lessonsCompleted > 0 ? (
                        <span className="inline-flex items-center text-emerald-600 font-semibold">
                          <CheckCircle2 size={13} className="mr-1" /> Done
                        </span>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-600 font-medium">
                      {tp.practiceAttempts} attempted
                    </td>
                    <td className="py-4 px-4 text-gray-600 font-medium">
                      {tp.quizAttempts > 0 ? (
                        <span>{Math.round(tp.bestQuizScore)}%</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/learn/${tp.topicId}`)}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-semibold transition-colors"
                      >
                        Learn
                      </button>
                      <button
                        onClick={() => navigate(`/practice?topic=${tp.topicId}`)}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-semibold transition-colors"
                      >
                        Practice
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No topic activity recorded yet. Start by taking your first lesson!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
