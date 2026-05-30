import { create } from 'zustand';

export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTANT';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: Role;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isOffline: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setOfflineStatus: (status: boolean) => void;
}

const digitMap: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

const normalizeDigits = (value: string) => value.replace(/[٠-٩]/g, (digit) => digitMap[digit] ?? digit);

const getInitialSession = () => {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isOffline: false };
  }

  try {
    const savedUserRaw = window.localStorage.getItem('user');
    const savedToken = window.localStorage.getItem('token');
    const parsedUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;

    if (parsedUser && typeof parsedUser.phone === 'string') {
      parsedUser.phone = normalizeDigits(parsedUser.phone);
    }

    return {
      user: parsedUser,
      token: savedToken,
      isOffline: !window.navigator.onLine,
    };
  } catch (error) {
    console.warn('Failed to restore auth session:', error);
    return { user: null, token: null, isOffline: false };
  }
};

export const useAuthStore = create<AuthState>((set) => {
  const initialState = getInitialSession();

  return {
    user: initialState.user,
    token: initialState.token,
    isOffline: initialState.isOffline,
    login: (user, token) => {
      const normalizedUser: User = {
        ...user,
        phone: normalizeDigits(user.phone),
        email: user.email ?? null,
      };

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('user', JSON.stringify(normalizedUser));
        window.localStorage.setItem('token', token);
      }

      set({ user: normalizedUser, token });
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('user');
        window.localStorage.removeItem('token');
      }
      set({ user: null, token: null });
    },
    setOfflineStatus: (status) => set({ isOffline: status }),
  };
});

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAuthStore.getState().setOfflineStatus(false);
  });

  window.addEventListener('offline', () => {
    useAuthStore.getState().setOfflineStatus(true);
  });
}
