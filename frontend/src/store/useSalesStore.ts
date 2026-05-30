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

export interface OfflineSalesQueueItem {
  id: string;
  cart: CartItem[];
  customerId: string;
  customerName: string;
  total: number;
  timestamp: string;
}

interface SalesState {
  customers: Customer[];
  cart: CartItem[];
  offlineSalesQueue: OfflineSalesQueueItem[];
  setCustomers: (customers: Customer[]) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (batchId: string) => void;
  updateCartQty: (batchId: string, qty: number) => void;
  clearCart: () => void;
  addToOfflineQueue: (item: OfflineSalesQueueItem) => void;
  removeFromOfflineQueue: (id: string) => void;
  clearOfflineQueue: () => void;
}

export const useSalesStore = create<SalesState>((set) => {
  return {
    customers: [],
    cart: [],
    offlineSalesQueue: [],

    setCustomers: (customers) => {
      set({ customers });
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

    addToOfflineQueue: (item) => {
      set((state) => ({
        offlineSalesQueue: [...state.offlineSalesQueue, item],
      }));
    },

    removeFromOfflineQueue: (id) => {
      set((state) => ({
        offlineSalesQueue: state.offlineSalesQueue.filter((i) => i.id !== id),
      }));
    },

    clearOfflineQueue: () => set({ offlineSalesQueue: [] }),
  };
});
