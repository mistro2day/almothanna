import { create } from 'zustand';

export interface Customer {
  id: string;
  name: string;
  type: string; // Pharmacy / Hospital / Distributor
  state: string; // Sudan state
  phone: string;
  creditLimit: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  qty: number;
  price: number;
  costPrice: number;
}

export interface OfflineSale {
  id: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  paid: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  createdAt: string;
}

interface SalesState {
  customers: Customer[];
  cart: CartItem[];
  offlineSalesQueue: OfflineSale[];
  setCustomers: (customers: Customer[]) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (batchId: string) => void;
  updateCartQty: (batchId: string, qty: number) => void;
  clearCart: () => void;
  addOfflineSale: (sale: OfflineSale) => void;
  clearOfflineSalesQueue: () => void;
  loadLocalCache: () => void;
  saveLocalCache: () => void;
}

export const useSalesStore = create<SalesState>((set, get) => {
  return {
    customers: [],
    cart: [],
    offlineSalesQueue: [],

    setCustomers: (customers) => {
      set({ customers });
      get().saveLocalCache();
    },

    addToCart: (item) => {
      set((state) => {
        const existing = state.cart.find((i) => i.batchId === item.batchId);
        if (existing) {
          return {
            cart: state.cart.map((i) =>
              i.batchId === item.batchId ? { ...i, qty: i.qty + item.qty } : i
            ),
          };
        }
        return { cart: [...state.cart, item] };
      });
    },

    removeFromCart: (batchId) => {
      set((state) => ({
        cart: state.cart.filter((i) => i.batchId !== batchId),
      }));
    },

    updateCartQty: (batchId, qty) => {
      set((state) => ({
        cart: state.cart.map((i) => (i.batchId === batchId ? { ...i, qty } : i)),
      }));
    },

    clearCart: () => set({ cart: [] }),

    addOfflineSale: (sale) => {
      set((state) => ({
        offlineSalesQueue: [...state.offlineSalesQueue, sale],
      }));
      get().saveLocalCache();
    },

    clearOfflineSalesQueue: () => {
      set({ offlineSalesQueue: [] });
      get().saveLocalCache();
    },

    loadLocalCache: () => {
      const cachedCustomers = localStorage.getItem('cache_customers');
      const cachedQueue = localStorage.getItem('offline_sales_queue');
      set({
        customers: cachedCustomers ? JSON.parse(cachedCustomers) : [],
        offlineSalesQueue: cachedQueue ? JSON.parse(cachedQueue) : [],
      });
    },

    saveLocalCache: () => {
      const { customers, offlineSalesQueue } = get();
      localStorage.setItem('cache_customers', JSON.stringify(customers));
      localStorage.setItem('offline_sales_queue', JSON.stringify(offlineSalesQueue));
    },
  };
});
