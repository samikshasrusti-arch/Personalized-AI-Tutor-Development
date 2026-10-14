import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLearnerStore } from '../store/learnerStore';
import { api } from '../services/api';
import { ProgressSummary, Recommendation } from '../types';
import {
  BrainCircuit,
  Sparkles,
  BookOpen,
  Target,
  FileQuestion,
  Trophy,
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  Compass,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const profile = useLearnerStore((state) => state.profile);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      navigate('/onboarding');
      return;
    }

    const loadData = async () => {
      try {
        const [progData, recData] = await Promise.allSettled([
          api.getProgress(profile.learnerId),
          api.getRecommendation(profile.learnerId),
        ]);

        if (progData.status === 'fulfilled') setProgress(progData.value);
        if (recData.status === 'fulfilled') setRecommendation(recData.value);
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile, navigate]);

  if (!profile) return null;

  const totalLessons = progress?.totalLessonsCompleted || 0;
  const totalQuizzes = progress?.totalQuizzes || 0;
  const totalPractice = progress?.totalPractice || 0;
  const overallAccuracy = progress?.overallAccuracy || 0;

  // Compute average mastery across topics
  const avgMastery = progress?.topicProgress?.length
    ? Math.round(
        progress.topicProgress.reduce((acc, t) => acc + (t.masteryLevel || 0), 0) /
          progress.topicProgress.length
      )
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white p-8 md:p-10 shadow-xl shadow-indigo-200/50">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-4 text-indigo-100">
            <Sparkles size={14} className="text-yellow-300" />
            <span>AI-Powered Python Learning Assistant</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Welcome back, {profile.name}! 👋
          </h1>
          <p className="mt-2 text-indigo-100 text-base md:text-lg leading-relaxed">
            {profile.goal ? `Goal: ${profile.goal}` : 'Ready to master Python through personalized tutoring and practice?'}
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 font-medium">
              Level: <strong className="capitalize">{profile.experience.replace('_', ' ')}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 font-medium">
              Style: <strong className="capitalize">{profile.explanationStyle}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 font-medium">
              Difficulty: <strong className="capitalize">{profile.difficulty}</strong>
            </span>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overall Mastery</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{avgMastery}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed Lessons</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalLessons} <span className="text-xs text-gray-400 font-normal">/ 10</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Target size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Practice Solved</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalPractice}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Accuracy Rate</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5">{Math.round(overallAccuracy)}%</p>
          </div>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      {recommendation && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-indigo-200/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <Compass size={16} />
              <span>Personalized Recommendation</span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">
              Next Up: {recommendation.topicTitle}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {recommendation.reason}
            </p>
          </div>

          <div className="flex-shrink-0">
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
              className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
            >
              <span>{recommendation.suggestedActivity === 'quiz' ? 'Take Quiz' : recommendation.suggestedActivity === 'practice' ? 'Practice Now' : 'Start Lesson'}</span>
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Launch Learning Modes */}
      <div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">Choose Your Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/topics"
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <BookOpen size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Learn Concepts
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Explore conversational lessons tailored to your level with interactive follow-up doubts & examples.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-indigo-600">
              <span>View Topics</span>
              <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/practice"
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Target size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                Dynamic Practice
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Solve MCQs, code output predictions, fill-in-the-blanks, and code bug-fixing with instant AI feedback.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-emerald-600">
              <span>Start Practice</span>
              <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/quiz"
            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <FileQuestion size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                Assessment Quiz
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Test your knowledge with timed evaluations, deterministic scoring, and detailed review breakdowns.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-purple-600">
              <span>Take a Quiz</span>
              <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
