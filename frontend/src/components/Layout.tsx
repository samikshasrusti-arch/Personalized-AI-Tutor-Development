import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, BrainCircuit, LayoutDashboard, Settings as SettingsIcon, Target, Trophy, FileQuestion } from 'lucide-react';
import { useLearnerStore } from '../store/learnerStore';

export const Layout = () => {
  const location = useLocation();
  const profile = useLearnerStore(state => state.profile);

  const getInitials = (name?: string) => {
    if (!name) return 'AT';
    return name.substring(0, 2).toUpperCase();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Topics', path: '/topics', icon: <BookOpen size={20} /> },
    { name: 'Practice', path: '/practice', icon: <Target size={20} /> },
    { name: 'Quiz', path: '/quiz', icon: <FileQuestion size={20} /> },
    { name: 'Progress', path: '/progress', icon: <Trophy size={20} /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:block">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <BrainCircuit className="text-primary-dark mr-2" size={28} />
          <span className="text-xl font-bold text-gray-900">AI Tutor</span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={`mr-3 ${isActive ? 'text-indigo-700' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top navbar for mobile + extra header stuff */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 md:justify-end">
          <div className="flex items-center md:hidden">
             <BrainCircuit className="text-primary-dark mr-2" size={24} />
             <span className="text-lg font-bold">AI Tutor</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {profile?.name || 'Guest Learner'}
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {getInitials(profile?.name)}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
