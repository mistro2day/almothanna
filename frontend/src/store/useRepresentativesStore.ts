import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

export interface Representative {
  id: string;
  name: string;
  phone: string;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RepresentativesState {
  representatives: Representative[];
  loading: boolean;
  fetchRepresentatives: () => Promise<void>;
  addRepresentative: (rep: { name: string; phone: string; commissionRate: number }) => Promise<Representative>;
  updateRepresentative: (id: string, data: Partial<Representative>) => Promise<Representative>;
  deleteRepresentative: (id: string) => Promise<void>;
}

export const useRepresentativesStore = create<RepresentativesState>((set, get) => ({
  representatives: [],
  loading: false,

  fetchRepresentatives: async () => {
    try {
      set({ loading: true });
      const { data } = await apiClient.get<Representative[]>('/representatives');
      set({ representatives: data });
    } catch (err) {
      console.error('Failed to fetch representatives:', err);
    } finally {
      set({ loading: false });
    }
  },

  addRepresentative: async (rep) => {
    const { data } = await apiClient.post<Representative>('/representatives', rep);
    set((state) => ({
      representatives: [...state.representatives, data].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return data;
  },

  updateRepresentative: async (id, data) => {
    const response = await apiClient.patch<Representative>(`/representatives/${id}`, data);
    set((state) => ({
      representatives: state.representatives.map((r) => (r.id === id ? response.data : r)),
    }));
    return response.data;
  },

  deleteRepresentative: async (id) => {
    await apiClient.delete(`/representatives/${id}`);
    set((state) => ({
      representatives: state.representatives.filter((r) => r.id !== id),
    }));
  },
}));
