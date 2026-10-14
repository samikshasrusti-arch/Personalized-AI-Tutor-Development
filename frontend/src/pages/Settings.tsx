import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearnerStore } from '../store/learnerStore';
import { api } from '../services/api';
import { HealthStatus, LearnerProfile } from '../types';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Cpu,
  ShieldCheck,
  Server,
  Sparkles
} from 'lucide-react';

export const Settings = () => {
  const navigate = useNavigate();
  const profile = useLearnerStore((state) => state.profile);
  const setProfile = useLearnerStore((state) => state.setProfile);
  const clearProfile = useLearnerStore((state) => state.clearProfile);

  const [formData, setFormData] = useState<Partial<LearnerProfile>>({
    name: profile?.name || '',
    experience: profile?.experience || 'beginner',
    goal: profile?.goal || '',
    explanationStyle: profile?.explanationStyle || 'simple',
    difficulty: profile?.difficulty || 'easy',
  });

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!profile) {
      navigate('/onboarding');
      return;
    }

    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        setHealth(res);
      } catch (e: any) {
        setHealth({
          status: 'error',
          message: 'Unable to connect to backend server at http://127.0.0.1:8001',
          model: 'Unknown',
          ai_configured: false,
        });
      } finally {
        setHealthLoading(false);
      }
    };

    checkHealth();
  }, [profile, navigate]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    const confirm = window.confirm(
      'Are you sure you want to reset your learner profile? You will need to complete onboarding again.'
    );
    if (confirm) {
      clearProfile();
      navigate('/onboarding');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings & System</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal learner preferences and verify your AI Tutor backend connectivity.
        </p>
      </div>

      {/* System Status Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-3 text-indigo-600 font-bold text-sm">
          <Server size={20} />
          <h2 className="text-base text-gray-900">Backend & Groq AI Status</h2>
        </div>

        {healthLoading ? (
          <div className="py-4 text-xs text-gray-400">Pinging backend status...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">FastAPI Server</span>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    health?.status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="text-sm font-bold text-gray-900 capitalize">
                  {health?.status === 'ok' ? 'Operational' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Groq AI Model</span>
              <div className="flex items-center space-x-2 mt-1">
                <Cpu size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-gray-900 truncate">
                  {health?.model || 'openai/gpt-oss-120b'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">API Key Configured</span>
              <div className="flex items-center space-x-2 mt-1">
                <ShieldCheck
                  size={16}
                  className={health?.ai_configured ? 'text-emerald-600' : 'text-amber-500'}
                />
                <span className="text-sm font-bold text-gray-900">
                  {health?.ai_configured ? 'Active & Verified' : 'Missing Key'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-black text-gray-900 mb-6">Learner Profile Preferences</h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Learner Name
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Programming Experience
              </label>
              <select
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">Complete Beginner</option>
                <option value="some_coding">Some Coding (other languages)</option>
                <option value="intermediate">Know basic Python</option>
              </select>
            </div>

            {/* Style */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Explanation Style
              </label>
              <select
                value={formData.explanationStyle}
                onChange={(e) => setFormData({ ...formData, explanationStyle: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="simple">Simple & Direct</option>
                <option value="detailed">In-Depth & Technical</option>
                <option value="analogy-based">Analogy-Rich & Stories</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Practice Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Primary Learning Goal
            </label>
            <input
              type="text"
              value={formData.goal || ''}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="e.g. Pass semester exams, build automation scripts"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <RotateCcw size={14} className="mr-1.5" />
              Reset Profile
            </button>

            <div className="flex items-center space-x-3">
              {savedSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <CheckCircle2 size={16} className="mr-1" /> Preferences saved!
                </span>
              )}
              <button
                type="submit"
                className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
              >
                <Save size={15} className="mr-1.5" />
                Save Preferences
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
