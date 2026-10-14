import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LearnerProfile } from '../types';

interface LearnerState {
  profile: LearnerProfile | null;
  activeTopicId: string | null;
  setActiveTopicId: (topicId: string | null) => void;
  setProfile: (profile: Partial<LearnerProfile>) => void;
  clearProfile: () => void;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return 'learner_' + crypto.randomUUID().slice(0, 8);
  }
  return 'learner_' + Math.random().toString(36).substring(2, 10);
};

export const useLearnerStore = create<LearnerState>()(
  persist(
    (set) => ({
      profile: null,
      activeTopicId: null,
      setActiveTopicId: (topicId) => set({ activeTopicId: topicId }),
      setProfile: (newProfile) =>
        set((state) => {
          const current = state.profile || {
            learnerId: generateId(),
            name: 'Learner',
            experience: 'beginner',
            goal: 'Master Python fundamentals',
            explanationStyle: 'simple',
            difficulty: 'easy',
          };
          return {
            profile: {
              ...current,
              ...newProfile,
              learnerId: current.learnerId || generateId(),
            },
          };
        }),
      clearProfile: () => set({ profile: null, activeTopicId: null }),
    }),
    {
      name: 'learner-storage-v2',
    }
  )
);
