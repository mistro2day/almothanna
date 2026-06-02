import { create } from 'zustand';

export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTANT';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: Role;
  permissions?: any;
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

// Default permissions fallback matrix based on role
export const getDefaultPermissions = (role: Role): any => {
  const base = {
    pages: {
      dashboard: false,
      inventory: false,
      sales: false,
      calendar: false,
      customers: false,
      suppliers: false,
      reports: false,
      settings: false,
      accounts: false,
    },
    buttons: {
      inventory: {
        addProduct: false,
        editProduct: false,
        deleteProduct: false,
        addBatch: false,
        editBatch: false,
        deleteBatch: false,
        exportExcel: false,
      },
      sales: {
        createInvoice: false,
        cancelInvoice: false,
        viewProfit: false,
      },
      customers: {
        addCustomer: false,
        editCustomer: false,
        deleteCustomer: false,
        manageReps: false,
        manageDeliveries: false,
      },
      suppliers: {
        addSupplier: false,
        editSupplier: false,
        deleteSupplier: false,
        manageOrders: false,
        managePayments: false,
      },
      settings: {
        editCompany: false,
        manageUsers: false,
        viewActivities: false,
        managePermissions: false,
      },
    },
  };

  if (role === 'ADMIN') {
    // ADMIN has ALL permissions
    const grantAll = (obj: any) => {
      for (const k in obj) {
        if (typeof obj[k] === 'object') {
          grantAll(obj[k]);
        } else if (typeof obj[k] === 'boolean') {
          obj[k] = true;
        }
      }
    };
    grantAll(base);
  } else if (role === 'SALES') {
    base.pages.dashboard = true;
    base.pages.sales = true;
    base.pages.calendar = true;
    base.pages.customers = true;
    base.buttons.sales.createInvoice = true;
    base.buttons.customers.addCustomer = true;
    base.buttons.customers.editCustomer = true;
    base.buttons.customers.manageDeliveries = true;
  } else if (role === 'WAREHOUSE') {
    base.pages.dashboard = true;
    base.pages.inventory = true;
    base.pages.calendar = true;
    base.pages.suppliers = true;
    base.buttons.inventory.addProduct = true;
    base.buttons.inventory.editProduct = true;
    base.buttons.inventory.addBatch = true;
    base.buttons.inventory.editBatch = true;
    base.buttons.inventory.exportExcel = true;
    base.buttons.customers.manageDeliveries = true;
    base.buttons.suppliers.manageOrders = true;
  } else if (role === 'ACCOUNTANT') {
    base.pages.dashboard = true;
    base.pages.sales = true;
    base.pages.calendar = true;
    base.pages.customers = true;
    base.pages.suppliers = true;
    base.pages.reports = true;
    base.pages.accounts = true;
    base.buttons.sales.viewProfit = true;
    base.buttons.suppliers.managePayments = true;
  }

  return base;
};

// Check if user has permission
export const hasPermission = (
  user: User | null,
  type: 'page' | 'button',
  section: string,
  action?: string
): boolean => {
  if (!user) return false;
  
  // ADMIN role always bypasses all checks
  if (user.role === 'ADMIN') return true;

  const permissions = user.permissions || getDefaultPermissions(user.role);

  if (type === 'page') {
    return !!permissions.pages?.[section];
  }

  if (type === 'button' && action) {
    return !!permissions.buttons?.[section]?.[action];
  }

  return false;
};
