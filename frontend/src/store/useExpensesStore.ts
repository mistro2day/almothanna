import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

export interface ExpenseCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  description?: string;
  date: string;
  categoryId: string;
  category: ExpenseCategory;
  userId?: string;
  user?: {
    name: string;
  };
  documentNumber?: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_MONEY';
  createdAt: string;
  updatedAt: string;
}

export interface RevenueCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface Revenue {
  id: string;
  amount: number;
  description?: string;
  date: string;
  categoryId: string;
  category: RevenueCategory;
  userId?: string;
  user?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FundTransaction {
  id: string;
  transactionCode: string;
  amount: number;
  type: 'INFLOW' | 'OUTFLOW';
  source: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'REVENUE' | 'SUPPLIER_PAYMENT' | 'RETURN' | 'MANUAL';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_MONEY';
  reference?: string;
  documentNumber?: string;
  description: string;
  date: string;
  user: string;
}

export interface FundSummary {
  currentBalance: number;
  totalInflow: number;
  totalOutflow: number;
}

export interface FinancialSummary {
  totalSales: number;
  totalSalesPaid: number;
  totalSalesUnpaid: number;
  totalPurchases: number;
  totalPurchasesPaid: number;
  totalExpenses: number;
  netProfitExpected: number;
  netProfitActual: number;
}

interface ExpensesState {
  expenses: Expense[];
  categories: ExpenseCategory[];
  revenues: Revenue[];
  revenueCategories: RevenueCategory[];
  fundTransactions: FundTransaction[];
  fundSummary: FundSummary | null;
  loading: boolean;
  
  // Expenses
  fetchExpenses: (filters?: { startDate?: string; endDate?: string; categoryId?: string }) => Promise<void>;
  fetchCategories: () => Promise<void>;
  addExpense: (expense: { amount: number; description?: string; date?: string; categoryId: string; userId?: string; documentNumber?: string; paymentMethod?: string }) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<ExpenseCategory>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Revenues
  fetchRevenues: (filters?: { startDate?: string; endDate?: string; categoryId?: string }) => Promise<void>;
  fetchRevenueCategories: () => Promise<void>;
  addRevenue: (revenue: { amount: number; description?: string; date?: string; categoryId: string; userId?: string; documentNumber?: string; paymentMethod?: string }) => Promise<Revenue>;
  deleteRevenue: (id: string) => Promise<void>;
  addRevenueCategory: (name: string) => Promise<RevenueCategory>;
  deleteRevenueCategory: (id: string) => Promise<void>;
  
  // Fund
  fetchFundLedger: (filters?: { startDate?: string; endDate?: string; paymentMethod?: string; source?: string; type?: string }) => Promise<void>;
  fetchFundSummary: (startDate?: string, endDate?: string) => Promise<FundSummary>;
  addManualFundTransaction: (tx: { amount: number; type: 'INFLOW' | 'OUTFLOW'; paymentMethod?: string; reference?: string; documentNumber?: string; description: string; date?: string; userId?: string }) => Promise<FundTransaction>;
  deleteManualFundTransaction: (id: string) => Promise<void>;
  
  // Financial Summary
  fetchFinancialSummary: (startDate?: string, endDate?: string) => Promise<FinancialSummary>;
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  categories: [],
  revenues: [],
  revenueCategories: [],
  fundTransactions: [],
  fundSummary: null,
  loading: false,

  // Expenses Actions
  fetchExpenses: async (filters) => {
    try {
      set({ loading: true });
      const { data } = await apiClient.get<Expense[]>('/expenses', { params: filters });
      set({ expenses: data });
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      set({ loading: true });
      const { data } = await apiClient.get<ExpenseCategory[]>('/expenses/categories');
      set({ categories: data });
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      set({ loading: false });
    }
  },

  addExpense: async (expense) => {
    const { data } = await apiClient.post<Expense>('/expenses', expense);
    set((state) => ({
      expenses: [data, ...state.expenses],
    }));
    return data;
  },

  deleteExpense: async (id) => {
    await apiClient.delete(`/expenses/${id}`);
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }));
  },

  addCategory: async (name) => {
    const { data } = await apiClient.post<ExpenseCategory>('/expenses/categories', { name });
    set((state) => ({
      categories: [...state.categories, data].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return data;
  },

  deleteCategory: async (id) => {
    await apiClient.delete(`/expenses/categories/${id}`);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },

  // Revenues Actions
  fetchRevenues: async (filters) => {
    try {
      set({ loading: true });
      const { data } = await apiClient.get<Revenue[]>('/expenses/revenues', { params: filters });
      set({ revenues: data });
    } catch (err) {
      console.error('Failed to fetch revenues:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchRevenueCategories: async () => {
    try {
      set({ loading: true });
      const { data } = await apiClient.get<RevenueCategory[]>('/expenses/revenues/categories');
      set({ revenueCategories: data });
    } catch (err) {
      console.error('Failed to fetch revenue categories:', err);
    } finally {
      set({ loading: false });
    }
  },

  addRevenue: async (revenue) => {
    const { data } = await apiClient.post<Revenue>('/expenses/revenues', revenue);
    set((state) => ({
      revenues: [data, ...state.revenues],
    }));
    return data;
  },

  deleteRevenue: async (id) => {
    await apiClient.delete(`/expenses/revenues/${id}`);
    set((state) => ({
      revenues: state.revenues.filter((r) => r.id !== id),
    }));
  },

  addRevenueCategory: async (name) => {
    const { data } = await apiClient.post<RevenueCategory>('/expenses/revenues/categories', { name });
    set((state) => ({
      revenueCategories: [...state.revenueCategories, data].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return data;
  },

  deleteRevenueCategory: async (id) => {
    await apiClient.delete(`/expenses/revenues/categories/${id}`);
    set((state) => ({
      revenueCategories: state.revenueCategories.filter((c) => c.id !== id),
    }));
  },

  // Fund Actions
  fetchFundLedger: async (filters) => {
    try {
      set({ loading: true });
      const { data } = await apiClient.get<FundTransaction[]>('/expenses/fund/ledger', { params: filters });
      set({ fundTransactions: data });
    } catch (err) {
      console.error('Failed to fetch fund ledger:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchFundSummary: async (startDate, endDate) => {
    const params = {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    };
    const { data } = await apiClient.get<FundSummary>('/expenses/fund/summary', { params });
    set({ fundSummary: data });
    return data;
  },

  addManualFundTransaction: async (tx) => {
    const { data } = await apiClient.post<FundTransaction>('/expenses/fund/manual', tx);
    set((state) => ({
      fundTransactions: [data, ...state.fundTransactions],
    }));
    return data;
  },

  deleteManualFundTransaction: async (id) => {
    await apiClient.delete(`/expenses/fund/${id}`);
    set((state) => ({
      fundTransactions: state.fundTransactions.filter((tx) => tx.id !== id),
    }));
  },

  // Financial Summary Actions
  fetchFinancialSummary: async (startDate, endDate) => {
    const params = {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    };
    const { data } = await apiClient.get<FinancialSummary>('/expenses/financial-summary', { params });
    return data;
  },
}));
