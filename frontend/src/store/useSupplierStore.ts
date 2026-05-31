import { create } from 'zustand';
import { apiClient } from '../api/apiClient';

export interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  type: string; // pharma_company, wholesaler, manufacturer
  phone: string;
  email?: string;
  country: string;
  city?: string;
  address?: string;
  commercialReg?: string;
  contactPerson?: string;
  contactPhone?: string;
  creditLimit: number;
  paymentTerms: string; // CASH_ON_DELIVERY, NET_7, NET_15, NET_30, NET_60, NET_90
  currency: string; // SDG, USD, EUR
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  batchNumber?: string;
  qty: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  total: number;
  paid: number;
  status: 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'PARTIAL' | 'CANCELLED';
  items: PurchaseOrderItem[];
  notes?: string;
  receivedDate?: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_MONEY';
  reference?: string;
  notes?: string;
  paidAt: string;
}

interface SupplierState {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  payments: SupplierPayment[];
  loading: boolean;

  // Supplier CRUD
  setSuppliers: (suppliers: Supplier[]) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<Supplier>;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;

  // Purchase Orders
  setPurchaseOrders: (orders: PurchaseOrder[]) => void;
  addPurchaseOrder: (order: { supplierId: string; total: number; paid?: number; status: string; notes?: string; items: any[] }) => Promise<PurchaseOrder>;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;

  // Payments
  setPayments: (payments: SupplierPayment[]) => void;
  addPayment: (payment: { supplierId: string; amount: number; paymentMethod: string; reference?: string; notes?: string }) => Promise<SupplierPayment>;

  // Financial helpers
  getSupplierTotalPurchases: (supplierId: string) => number;
  getSupplierTotalPayments: (supplierId: string) => number;
  getSupplierBalance: (supplierId: string) => number;
  getTotalOutstanding: () => number;

  // Cache & Live Sync
  loadLocalCache: () => void;
  saveLocalCache: () => void;
  fetchSuppliers: () => Promise<void>;
  fetchPurchaseOrders: () => Promise<void>;
  fetchPayments: () => Promise<void>;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  purchaseOrders: [],
  payments: [],
  loading: false,

  setSuppliers: (suppliers) => {
    set({ suppliers });
    get().saveLocalCache();
  },

  addSupplier: async (supplier) => {
    const { data } = await apiClient.post<Supplier>('/suppliers', supplier);
    set((state) => ({ suppliers: [data, ...state.suppliers] }));
    get().saveLocalCache();
    return data;
  },

  updateSupplier: (id, data) => {
    set((state) => ({
      suppliers: state.suppliers.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    }));
    get().saveLocalCache();
  },

  setPurchaseOrders: (purchaseOrders) => {
    set({ purchaseOrders });
    get().saveLocalCache();
  },

  addPurchaseOrder: async (order) => {
    const { data } = await apiClient.post<any>('/suppliers/purchase-orders', order);
    const mappedOrder: PurchaseOrder = {
      id: data.id,
      orderNumber: data.orderNumber,
      supplierId: data.supplierId,
      supplierName: data.supplier?.name || 'Unknown',
      total: data.total,
      paid: data.paid,
      status: data.status,
      notes: data.notes,
      createdAt: data.createdAt,
      items: data.items.map((i: any) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product?.name || 'Unknown',
        qty: i.qty,
        unitCost: i.unitCost,
        batchNumber: i.batchNumber,
      })),
    };
    set((state) => ({
      purchaseOrders: [mappedOrder, ...state.purchaseOrders],
    }));
    get().saveLocalCache();
    return mappedOrder;
  },

  updatePurchaseOrderStatus: (id, status) => {
    set((state) => ({
      purchaseOrders: state.purchaseOrders.map((o) =>
        o.id === id ? { ...o, status } : o
      ),
    }));
    get().saveLocalCache();
  },

  setPayments: (payments) => {
    set({ payments });
    get().saveLocalCache();
  },

  addPayment: async (payment) => {
    const { data } = await apiClient.post<any>('/suppliers/payments', payment);
    const mappedPayment: SupplierPayment = {
      id: data.id,
      supplierId: data.supplierId,
      supplierName: data.supplier?.name || 'Unknown',
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      notes: data.notes,
      paidAt: data.createdAt,
    };
    
    set((state) => ({
      payments: [mappedPayment, ...state.payments],
    }));

    // Trigger purchase order reloading to keep remaining balance in sync
    await get().fetchPurchaseOrders();
    get().saveLocalCache();
    return mappedPayment;
  },

  getSupplierTotalPurchases: (supplierId) => {
    return get()
      .purchaseOrders.filter((o) => o.supplierId === supplierId && o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.total, 0);
  },

  getSupplierTotalPayments: (supplierId) => {
    return get()
      .payments.filter((p) => p.supplierId === supplierId)
      .reduce((sum, p) => sum + p.amount, 0);
  },

  getSupplierBalance: (supplierId) => {
    return get().getSupplierTotalPurchases(supplierId) - get().getSupplierTotalPayments(supplierId);
  },

  getTotalOutstanding: () => {
    const { suppliers } = get();
    return suppliers.reduce((sum, s) => sum + get().getSupplierBalance(s.id), 0);
  },

  loadLocalCache: () => {
    const cachedSuppliers = localStorage.getItem('cache_suppliers');
    const cachedPO = localStorage.getItem('cache_purchase_orders');
    const cachedPayments = localStorage.getItem('cache_supplier_payments');
    set({
      suppliers: cachedSuppliers ? JSON.parse(cachedSuppliers) : [],
      purchaseOrders: cachedPO ? JSON.parse(cachedPO) : [],
      payments: cachedPayments ? JSON.parse(cachedPayments) : [],
    });
  },

  saveLocalCache: () => {
    const { suppliers, purchaseOrders, payments } = get();
    localStorage.setItem('cache_suppliers', JSON.stringify(suppliers));
    localStorage.setItem('cache_purchase_orders', JSON.stringify(purchaseOrders));
    localStorage.setItem('cache_supplier_payments', JSON.stringify(payments));
  },

  fetchSuppliers: async () => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get<Supplier[]>('/suppliers');
      set({ suppliers: data });
      get().saveLocalCache();
    } catch (err) {
      console.error('Failed to fetch suppliers from backend:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchPurchaseOrders: async () => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get<any[]>('/suppliers/purchase-orders');
      const mapped = data.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        supplierId: o.supplierId,
        supplierName: o.supplier?.name || 'Unknown',
        total: o.total,
        paid: o.paid,
        status: o.status,
        notes: o.notes,
        createdAt: o.createdAt,
        items: o.items.map((i: any) => ({
          id: i.id,
          productId: i.productId,
          productName: i.product?.name || 'Unknown',
          qty: i.qty,
          unitCost: i.unitCost,
          batchNumber: i.batchNumber,
        })),
      }));
      set({ purchaseOrders: mapped });
      get().saveLocalCache();
    } catch (err) {
      console.error('Failed to fetch purchase orders from backend:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchPayments: async () => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get<any[]>('/suppliers/payments');
      const mapped = data.map((p) => ({
        id: p.id,
        supplierId: p.supplierId,
        supplierName: p.supplier?.name || 'Unknown',
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        notes: p.notes,
        paidAt: p.createdAt,
      }));
      set({ payments: mapped });
      get().saveLocalCache();
    } catch (err) {
      console.error('Failed to fetch payments from backend:', err);
    } finally {
      set({ loading: false });
    }
  },
}));
