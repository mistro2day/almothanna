import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  scientificName?: string;
  barcode?: string;
  category?: string;
  unit: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  productId: string;
  qty: number;
  costPrice: number;
  expiryDate: string;
  manufactureDate: string;
  productName?: string; // hydrated product name for easy FE list display
}

interface InventoryState {
  products: Product[];
  batches: Batch[];
  loading: boolean;
  setProducts: (products: Product[]) => void;
  setBatches: (batches: Batch[]) => void;
  addOfflineProduct: (prod: Product) => void;
  addOfflineBatch: (batch: Batch) => void;
  decrementBatchQty: (batchId: string, qty: number) => void;
  getFEFOBatches: (productId: string) => Batch[];
  getNearExpiryBatches: (monthsThreshold?: number) => Batch[];
  loadLocalCache: () => void;
  saveLocalCache: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => {
  return {
    products: [],
    batches: [],
    loading: false,

    setProducts: (products) => {
      set({ products });
      get().saveLocalCache();
    },

    setBatches: (batches) => {
      set({ batches });
      get().saveLocalCache();
    },

    addOfflineProduct: (prod) => {
      set((state) => ({
        products: [prod, ...state.products],
      }));
      get().saveLocalCache();
    },

    addOfflineBatch: (batch) => {
      set((state) => ({
        batches: [batch, ...state.batches],
      }));
      get().saveLocalCache();
    },

    decrementBatchQty: (batchId, qty) => {
      set((state) => ({
        batches: state.batches.map((b) =>
          b.id === batchId ? { ...b, qty: Math.max(0, b.qty - qty) } : b
        ),
      }));
      get().saveLocalCache();
    },

    // FEFO = First Expired First Out (sorted by expiryDate ascending)
    getFEFOBatches: (productId) => {
      const { batches } = get();
      return batches
        .filter((b) => b.productId === productId && b.qty > 0)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    },

    // Get batches expiring within X months
    getNearExpiryBatches: (monthsThreshold = 6) => {
      const { batches, products } = get();
      const thresholdDate = new Date();
      thresholdDate.setMonth(thresholdDate.getMonth() + monthsThreshold);

      return batches
        .filter((b) => b.qty > 0 && new Date(b.expiryDate) <= thresholdDate)
        .map((b) => ({
          ...b,
          productName: products.find((p) => p.id === b.productId)?.name || 'Unknown Product',
        }))
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    },

    loadLocalCache: () => {
      const cachedProducts = localStorage.getItem('cache_products');
      const cachedBatches = localStorage.getItem('cache_batches');
      set({
        products: cachedProducts ? JSON.parse(cachedProducts) : [],
        batches: cachedBatches ? JSON.parse(cachedBatches) : [],
      });
    },

    saveLocalCache: () => {
      const { products, batches } = get();
      localStorage.setItem('cache_products', JSON.stringify(products));
      localStorage.setItem('cache_batches', JSON.stringify(batches));
    },
  };
});
