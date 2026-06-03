import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import { Role } from './useAuthStore';

export interface CompanySettings {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  logo: string | null; // base64
  commercialReg: string | null;
  taxNumber: string | null;
  currency: string;
  invoiceFooter: string | null;
  linkSalesToFund: boolean;
  linkPurchasesToFund: boolean;
  linkExpensesToFund: boolean;
  updatedAt: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: Role;
  permissions?: any;
  createdAt: string;
}

interface SettingsState {
  settings: CompanySettings | null;
  users: ManagedUser[];
  loadingSettings: boolean;
  loadingUsers: boolean;
  fetchSettings: () => Promise<CompanySettings>;
  updateSettings: (dto: Partial<CompanySettings>) => Promise<CompanySettings>;
  fetchUsers: () => Promise<ManagedUser[]>;
  createUser: (user: { name: string; phone: string; email?: string; password?: string; role: Role; permissions?: any }) => Promise<ManagedUser>;
  updateUser: (id: string, user: Partial<ManagedUser> & { password?: string; permissions?: any }) => Promise<ManagedUser>;
  deleteUser: (id: string) => Promise<void>;
  loadLocalCache: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  users: [],
  loadingSettings: false,
  loadingUsers: false,

  loadLocalCache: () => {
    try {
      const cachedSettings = localStorage.getItem('company_settings');
      if (cachedSettings) {
        set({ settings: JSON.parse(cachedSettings) });
      }
      const cachedUsers = localStorage.getItem('managed_users');
      if (cachedUsers) {
        set({ users: JSON.parse(cachedUsers) });
      }
    } catch (e) {
      console.warn('Failed to load settings local cache', e);
    }
  },

  fetchSettings: async () => {
    set({ loadingSettings: true });
    try {
      const { data } = await apiClient.get<CompanySettings>('/settings');
      localStorage.setItem('company_settings', JSON.stringify(data));
      set({ settings: data, loadingSettings: false });
      return data;
    } catch (error) {
      set({ loadingSettings: false });
      // Fallback to default settings if call fails and no cache exists
      const fallbackSettings: CompanySettings = get().settings || {
        id: 'default',
        name: "المثنى للأدوية",
        phone: "0912345678",
        email: "info@almothanna.com",
        address: "السودان - أمدرمان",
        logo: null,
        commercialReg: "12345",
        taxNumber: "67890",
        currency: "SDG",
        invoiceFooter: "شكراً لتعاملكم معنا - المثنى للأدوية",
        linkSalesToFund: true,
        linkPurchasesToFund: true,
        linkExpensesToFund: true,
        updatedAt: new Date().toISOString()
      };
      set({ settings: fallbackSettings });
      return fallbackSettings;
    }
  },

  updateSettings: async (dto) => {
    set({ loadingSettings: true });
    try {
      const { data } = await apiClient.put<CompanySettings>('/settings', dto);
      localStorage.setItem('company_settings', JSON.stringify(data));
      set({ settings: data, loadingSettings: false });
      return data;
    } catch (error) {
      set({ loadingSettings: false });
      throw error;
    }
  },

  fetchUsers: async () => {
    set({ loadingUsers: true });
    try {
      const { data } = await apiClient.get<ManagedUser[]>('/users');
      localStorage.setItem('managed_users', JSON.stringify(data));
      set({ users: data, loadingUsers: false });
      return data;
    } catch (error) {
      set({ loadingUsers: false });
      return get().users;
    }
  },

  createUser: async (user) => {
    try {
      const { data } = await apiClient.post<ManagedUser>('/users', user);
      const updatedUsers = [...get().users, data];
      set({ users: updatedUsers });
      localStorage.setItem('managed_users', JSON.stringify(updatedUsers));
      return data;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (id, user) => {
    try {
      const { data } = await apiClient.put<ManagedUser>(`/users/${id}`, user);
      const updatedUsers = get().users.map(u => u.id === id ? data : u);
      set({ users: updatedUsers });
      localStorage.setItem('managed_users', JSON.stringify(updatedUsers));
      return data;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      await apiClient.delete(`/users/${id}`);
      const updatedUsers = get().users.filter(u => u.id !== id);
      set({ users: updatedUsers });
      localStorage.setItem('managed_users', JSON.stringify(updatedUsers));
    } catch (error) {
      throw error;
    }
  }
}));
