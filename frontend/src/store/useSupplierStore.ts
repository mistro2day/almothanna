import { create } from 'zustand';

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

  // Supplier CRUD
  setSuppliers: (suppliers: Supplier[]) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;

  // Purchase Orders
  setPurchaseOrders: (orders: PurchaseOrder[]) => void;
  addPurchaseOrder: (order: PurchaseOrder) => void;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;

  // Payments
  setPayments: (payments: SupplierPayment[]) => void;
  addPayment: (payment: SupplierPayment) => void;

  // Financial helpers
  getSupplierTotalPurchases: (supplierId: string) => number;
  getSupplierTotalPayments: (supplierId: string) => number;
  getSupplierBalance: (supplierId: string) => number;
  getTotalOutstanding: () => number;

  // Cache
  loadLocalCache: () => void;
  saveLocalCache: () => void;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  purchaseOrders: [],
  payments: [],

  setSuppliers: (suppliers) => {
    set({ suppliers });
    get().saveLocalCache();
  },

  addSupplier: (supplier) => {
    set((state) => ({ suppliers: [supplier, ...state.suppliers] }));
    get().saveLocalCache();
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

  addPurchaseOrder: (order) => {
    set((state) => ({
      purchaseOrders: [order, ...state.purchaseOrders],
    }));
    get().saveLocalCache();
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

  addPayment: (payment) => {
    set((state) => ({
      payments: [payment, ...state.payments],
    }));
    // Also update the paid amount on related purchase orders
    const { purchaseOrders } = get();
    const supplierOrders = purchaseOrders.filter(
      (o) => o.supplierId === payment.supplierId
    );
    // Distribute payment across unpaid orders (oldest first)
    let remaining = payment.amount;
    const updatedOrders = purchaseOrders.map((o) => {
      if (o.supplierId === payment.supplierId && remaining > 0) {
        const owed = o.total - o.paid;
        if (owed > 0) {
          const applied = Math.min(remaining, owed);
          remaining -= applied;
          return {
            ...o,
            paid: o.paid + applied,
            status: (o.paid + applied >= o.total ? 'RECEIVED' : 'PARTIAL') as PurchaseOrder['status'],
          };
        }
      }
      return o;
    });
    set({ purchaseOrders: updatedOrders });
    get().saveLocalCache();
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
}));
