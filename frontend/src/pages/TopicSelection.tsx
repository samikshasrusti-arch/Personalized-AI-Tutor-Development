import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLearnerStore } from '../store/learnerStore';
import { Topic, TopicProgress } from '../types';
import { BookOpen, Target, FileQuestion, CheckCircle2, ChevronRight, Search, Sparkles, Flame } from 'lucide-react';

const FALLBACK_TOPICS: Topic[] = [
  { id: 'intro', title: 'Introduction to Python', description: 'What is Python, how it works, and why it is so popular.' },
  { id: 'variables', title: 'Variables & Data Types', description: 'Integers, floats, strings, booleans, and dynamic typing.' },
  { id: 'io', title: 'Input & Output', description: 'Reading user input with input() and formatted output with print().' },
  { id: 'operators', title: 'Operators', description: 'Arithmetic, logical, comparison, and assignment operators.' },
  { id: 'conditionals', title: 'Conditional Statements', description: 'Making decisions with if, elif, and else branching.' },
  { id: 'loops', title: 'Loops', description: 'Iterating using for loops, while loops, break, and continue.' },
  { id: 'strings', title: 'Strings & Manipulation', description: 'Indexing, slicing, formatting, and common string methods.' },
  { id: 'collections', title: 'Lists, Tuples, Sets, Dicts', description: 'Storing collections of data and choosing the right structure.' },
  { id: 'functions', title: 'Functions & Scope', description: 'Defining reusable code blocks, parameters, return values, and scope.' },
  { id: 'debugging', title: 'Problem-Solving & Debugging', description: 'Tracing execution, reading error tracebacks, and fixing bugs.' },
];

export const TopicSelection = () => {
  const navigate = useNavigate();
  const profile = useLearnerStore((state) => state.profile);
  const setActiveTopicId = useLearnerStore((state) => state.setActiveTopicId);

  const [topics, setTopics] = useState<Topic[]>(FALLBACK_TOPICS);
  const [topicProgress, setTopicProgress] = useState<Record<string, TopicProgress>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedTopics = await api.getTopics();
        if (fetchedTopics && fetchedTopics.length > 0) {
          setTopics(fetchedTopics);
        }
      } catch (e) {
        console.warn('Using fallback topics:', e);
      }

      if (profile?.learnerId) {
        try {
          const progress = await api.getProgress(profile.learnerId);
          if (progress?.topicProgress) {
            const map: Record<string, TopicProgress> = {};
            progress.topicProgress.forEach((tp) => {
              map[tp.topicId] = tp;
            });
            setTopicProgress(map);
          }
        } catch (e) {
          console.warn('Could not load progress:', e);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [profile?.learnerId]);

  const filteredTopics = topics.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = (topicId: string, mode: 'learn' | 'practice' | 'quiz') => {
    setActiveTopicId(topicId);
    if (mode === 'learn') navigate(`/learn/${topicId}`);
    if (mode === 'practice') navigate(`/practice?topic=${topicId}`);
    if (mode === 'quiz') navigate(`/quiz?topic=${topicId}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Python Curriculum</h1>
          <p className="text-gray-600 mt-1">
            Choose a topic to explore interactive tutoring explanations, guided practice, or assessment quizzes.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Grid of Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTopics.map((topic, index) => {
          const progress = topicProgress[topic.id];
          const mastery = progress?.masteryLevel || 0;
          const isCompleted = (progress?.lessonsCompleted || 0) > 0;

          return (
            <div
              key={topic.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {topic.title}
                    </h3>
                  </div>

                  {mastery >= 80 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mastered
                    </span>
                  ) : mastery > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      In Progress
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Not Started
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{topic.description}</p>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-1.5 font-medium">
                    <span>Topic Mastery</span>
                    <span className="font-semibold text-gray-700">{Math.round(mastery)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        mastery >= 80 ? 'bg-emerald-500' : mastery >= 50 ? 'bg-indigo-600' : 'bg-blue-400'
                      }`}
                      style={{ width: `${Math.max(mastery, 4)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleAction(topic.id, 'learn')}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-semibold transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Learn
                </button>
                <button
                  onClick={() => handleAction(topic.id, 'practice')}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-semibold transition-all border border-gray-100"
                >
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  Practice
                </button>
                <button
                  onClick={() => handleAction(topic.id, 'quiz')}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-700 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-semibold transition-all border border-gray-100"
                >
                  <FileQuestion className="w-3.5 h-3.5 mr-1.5" />
                  Quiz
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
