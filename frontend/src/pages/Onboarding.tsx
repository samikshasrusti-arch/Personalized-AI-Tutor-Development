import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearnerStore } from '../store/learnerStore';
import { LearnerProfile } from '../types';
import { Sparkles, BrainCircuit, ArrowRight, Compass, Target, BookOpen } from 'lucide-react';

export const Onboarding = () => {
  const navigate = useNavigate();
  const setProfile = useLearnerStore((state) => state.setProfile);

  const [formData, setFormData] = useState<Partial<LearnerProfile>>({
    name: '',
    experience: 'beginner',
    goal: 'Build programming fundamentals and solve problems',
    explanationStyle: 'simple',
    difficulty: 'easy',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    setProfile(formData);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
            <BrainCircuit size={36} />
          </div>
        </div>
        <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Personalize Your Learning
        </h2>
        <p className="mt-2 text-center text-base text-gray-600 max-w-md mx-auto">
          Tell us about yourself so your AI Tutor can calibrate explanations, examples, and practice difficulty.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white/80 backdrop-blur-md py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                Your Name or Preferred Nickname
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="e.g. Alex"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-semibold text-gray-700 mb-1">
                Programming Experience
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'beginner', label: 'Beginner', desc: 'New to coding' },
                  { id: 'some_coding', label: 'Some Coding', desc: 'Know another language' },
                  { id: 'intermediate', label: 'Intermediate', desc: 'Know basic Python' },
                ].map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, experience: exp.id as any })}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      formData.experience === exp.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-medium ring-2 ring-indigo-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <div className="font-semibold text-sm">{exp.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{exp.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Explanation Style */}
            <div>
              <label htmlFor="explanationStyle" className="block text-sm font-semibold text-gray-700 mb-1">
                Preferred Explanation Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'simple', label: 'Simple & Direct', desc: 'Bite-sized, plain English' },
                  { id: 'detailed', label: 'In-Depth', desc: 'Deep dive with details' },
                  { id: 'analogy-based', label: 'Analogy-Rich', desc: 'Real-world stories & metaphors' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, explanationStyle: style.id as any })}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      formData.explanationStyle === style.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-medium ring-2 ring-indigo-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <div className="font-semibold text-sm">{style.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Difficulty */}
            <div>
              <label htmlFor="difficulty" className="block text-sm font-semibold text-gray-700 mb-1">
                Initial Practice Difficulty
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'easy', label: 'Gentle (Easy)' },
                  { id: 'medium', label: 'Balanced (Medium)' },
                  { id: 'hard', label: 'Challenging (Hard)' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficulty: d.id as any })}
                    className={`p-2.5 text-center rounded-xl border text-sm font-medium transition-all ${
                      formData.difficulty === d.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal */}
            <div>
              <label htmlFor="goal" className="block text-sm font-semibold text-gray-700 mb-1">
                Your Primary Goal
              </label>
              <input
                id="goal"
                type="text"
                placeholder="e.g. Ace university exams, automate tasks, build AI apps"
                value={formData.goal || ''}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center py-3.5 px-6 border border-transparent rounded-xl shadow-lg shadow-indigo-200 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Start Learning with AI Tutor</span>
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
