import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

export interface Activity {
  id: string;
  userId: string;
  user: {
    name: string;
    role: string;
  };
  action: string;
  details: string;
  createdAt: string;
}

interface ActivityState {
  activities: Activity[];
  loadingActivities: boolean;
  fetchActivities: () => Promise<Activity[]>;
  logActivity: (action: string, details: string) => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  loadingActivities: false,

  fetchActivities: async () => {
    set({ loadingActivities: true });
    try {
      const { data } = await apiClient.get<Activity[]>('/activities');
      set({ activities: data, loadingActivities: false });
      return data;
    } catch (e) {
      console.error('Failed to fetch activities', e);
      set({ loadingActivities: false });
      return [];
    }
  },

  logActivity: async (action, details) => {
    try {
      await apiClient.post('/activities', { action, details });
      // Refresh activities
      get().fetchActivities();
    } catch (e) {
      console.error('Failed to log activity', e);
    }
  },
}));
