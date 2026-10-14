import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, ArrowRight } from 'lucide-react';

export const Welcome = () => {
  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col justify-center items-center p-6">
      <div className="max-w-2xl text-center space-y-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg">
            <BrainCircuit className="text-white w-16 h-16" />
          </div>
        </div>
        
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
          Master Python with your <br />
          <span className="text-indigo-600">Personal AI Tutor</span>
        </h1>
        
        <p className="text-xl text-gray-600 leading-relaxed">
          An adaptive learning platform that understands your level, explains concepts in a way that clicks, and provides personalized practice to build real mastery.
        </p>
        
        <div className="pt-8">
          <Link 
            to="/onboarding" 
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            Start Learning Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
