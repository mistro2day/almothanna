import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

export interface Product {
  id: string;
  name: string;
  scientificName?: string;
  barcode?: string;
  category?: string;
  unit: string;
  supplierId?: string;
  supplier?: {
    id: string;
    name: string;
    companyName?: string;
  };
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
  fetchProducts: () => Promise<void>;
  fetchBatches: () => Promise<void>;
  addProduct: (prod: Omit<Product, 'id'>) => Promise<Product>;
  addBatch: (batch: Omit<Batch, 'id'>) => Promise<Batch>;
  addBatchQty: (batchId: string, qty: number) => Promise<void>;
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

    fetchProducts: async () => {
      set({ loading: true });
      try {
        const { data } = await apiClient.get<Product[]>('/products');
        set({ products: data });
        get().saveLocalCache();
      } catch (err) {
        console.error('Failed to fetch products from backend:', err);
      } finally {
        set({ loading: false });
      }
    },

    fetchBatches: async () => {
      set({ loading: true });
      try {
        const { data } = await apiClient.get<any[]>('/batches');
        const hydrated = data.map((b) => ({
          id: b.id,
          batchNumber: b.batchNumber,
          productId: b.productId,
          qty: b.qty,
          costPrice: b.costPrice,
          expiryDate: b.expiryDate.split('T')[0],
          manufactureDate: b.manufactureDate.split('T')[0],
          productName: b.product?.name,
        }));
        set({ batches: hydrated });
        get().saveLocalCache();
      } catch (err) {
        console.error('Failed to fetch batches from backend:', err);
      } finally {
        set({ loading: false });
      }
    },

    addProduct: async (prod) => {
      const { data } = await apiClient.post<Product>('/products', prod);
      set((state) => ({
        products: [data, ...state.products],
      }));
      get().saveLocalCache();
      return data;
    },

    addBatch: async (batch) => {
      const { data } = await apiClient.post<any>('/batches', batch);
      const hydrated: Batch = {
        id: data.id,
        batchNumber: data.batchNumber,
        productId: data.productId,
        qty: data.qty,
        costPrice: data.costPrice,
        expiryDate: data.expiryDate.split('T')[0],
        manufactureDate: data.manufactureDate.split('T')[0],
        productName: data.product?.name,
      };
      set((state) => ({
        batches: [hydrated, ...state.batches],
      }));
      get().saveLocalCache();
      return hydrated;
    },

    addBatchQty: async (batchId, qty) => {
      await apiClient.post(`/batches/${batchId}/add-qty`, { qty });
      set((state) => ({
        batches: state.batches.map((b) =>
          b.id === batchId ? { ...b, qty: b.qty + qty } : b
        ),
      }));
      get().saveLocalCache();
    },
  };
});
