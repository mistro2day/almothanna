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
  createdAt: string;
  updatedAt: string;
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
  loading: boolean;
  fetchExpenses: (filters?: { startDate?: string; endDate?: string; categoryId?: string }) => Promise<void>;
  fetchCategories: () => Promise<void>;
  addExpense: (expense: { amount: number; description?: string; date?: string; categoryId: string; userId?: string }) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<ExpenseCategory>;
  deleteCategory: (id: string) => Promise<void>;
  fetchFinancialSummary: (startDate?: string, endDate?: string) => Promise<FinancialSummary>;
}

export const useExpensesStore = create<ExpensesState>((set) => ({
  expenses: [],
  categories: [],
  loading: false,

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

  fetchFinancialSummary: async (startDate, endDate) => {
    const params = {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    };
    const { data } = await apiClient.get<FinancialSummary>('/expenses/financial-summary', { params });
    return data;
  },
}));
