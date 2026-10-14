import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLearnerStore } from '../store/learnerStore';
import { ChatMessage, Topic } from '../types';
import {
  BrainCircuit,
  Send,
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Code2,
  RefreshCw,
  Target,
  FileQuestion,
  ChevronLeft
} from 'lucide-react';

const TOPIC_NAMES: Record<string, string> = {
  intro: 'Introduction to Python',
  variables: 'Variables & Data Types',
  io: 'Input & Output',
  operators: 'Operators',
  conditionals: 'Conditional Statements',
  loops: 'Loops',
  strings: 'Strings & Manipulation',
  collections: 'Lists, Tuples, Sets, Dicts',
  functions: 'Functions & Scope',
  debugging: 'Problem-Solving & Debugging',
};

export const LearnWorkspace = () => {
  const { topicId = 'intro' } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const profile = useLearnerStore((state) => state.profile);

  const topicTitle = TOPIC_NAMES[topicId] || topicId.replace('-', ' ').toUpperCase();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!profile) {
      navigate('/onboarding');
      return;
    }

    const initLesson = async () => {
      setInitialLoading(true);
      setMessages([]);
      try {
        const initialExplanation = await api.explainTopic(topicTitle, topicId, profile);
        setMessages([
          {
            id: 'init-1',
            role: 'assistant',
            content: initialExplanation,
            timestamp: Date.now(),
          },
        ]);
      } catch (err: any) {
        setMessages([
          {
            id: 'err-1',
            role: 'assistant',
            content: `⚠️ Failed to fetch initial explanation: ${err.response?.data?.detail || err.message}. Please check your Groq configuration.`,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setInitialLoading(false);
      }
    };

    initLesson();
  }, [topicId, profile, topicTitle, navigate]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading || !profile) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const historyContext = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await api.askQuestion(topicTitle, topicId, profile, text, historyContext);

      const botMsg: ChatMessage = {
        id: 'ast-' + Date.now(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: `⚠️ Error getting answer: ${err.response?.data?.detail || err.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!profile || completed || completing) return;
    setCompleting(true);
    try {
      await api.markLessonComplete(profile.learnerId, topicId, topicTitle);
      setCompleted(true);
    } catch (err) {
      console.warn('Failed to mark complete in backend:', err);
      setCompleted(true);
    } finally {
      setCompleting(false);
    }
  };

  const quickPrompts = [
    { label: 'Simpler explanation', text: 'Can you explain this more simply with an easy everyday analogy?' },
    { label: 'Another example', text: 'Can you show another practical, real-world code example?' },
    { label: 'Common mistakes', text: 'What are common mistakes or syntax errors beginners make with this?' },
    { label: 'Test my knowledge', text: 'Give me a quick question to test if I understood this concept correctly.' },
  ];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Top Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/topics')}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
            title="Back to topics"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                Learn Mode
              </span>
              <span className="text-xs text-gray-400 capitalize">• {profile?.explanationStyle} Style</span>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 mt-0.5">{topicTitle}</h1>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkComplete}
            disabled={completed || completing}
            className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              completed
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
            }`}
          >
            <CheckCircle2 size={16} className="mr-1.5" />
            {completed ? 'Lesson Completed' : completing ? 'Saving...' : 'Mark Complete'}
          </button>

          <button
            onClick={() => navigate(`/practice?topic=${topicId}`)}
            className="inline-flex items-center px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Target size={15} className="mr-1.5" />
            Practice
          </button>

          <button
            onClick={() => navigate(`/quiz?topic=${topicId}`)}
            className="inline-flex items-center px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <FileQuestion size={15} className="mr-1.5" />
            Quiz
          </button>
        </div>
      </div>

      {/* Chat / Tutor Stream */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 overflow-y-auto space-y-6">
        {initialLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 py-16">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-700">AI Tutor is crafting your personalized lesson...</p>
            <p className="text-xs text-gray-400">Tailoring examples to your experience level</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-100">
                  <BrainCircuit size={18} />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-100'
                    : 'bg-gray-50 text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans space-y-2">
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-100">
              <BrainCircuit size={18} />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm p-4 text-gray-500 text-sm flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span>AI Tutor is thinking...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-gray-400 flex items-center flex-shrink-0">
          <Lightbulb size={13} className="mr-1 text-amber-500" />
          Quick Ask:
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            disabled={loading || initialLoading}
            onClick={() => handleSendMessage(p.text)}
            className="px-3 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 rounded-full text-xs font-medium border border-gray-200 transition-all flex-shrink-0 shadow-2xs disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask a question or request another example..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading || initialLoading}
          className="flex-1 px-4 py-2 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading || initialLoading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 transition-all shadow-sm"
          title="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
