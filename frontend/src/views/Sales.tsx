import React, { useState, useEffect } from 'react';
import { useInventoryStore, Batch } from '../store/useInventoryStore';
import { useSalesStore, Customer, CartItem, OfflineSale } from '../store/useSalesStore';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/apiClient';
import { 
  ShoppingCart, 
  Trash2, 
  UserCheck, 
  Calendar, 
  AlertCircle, 
  Check, 
  FileText,
  CreditCard,
  TrendingUp,
  Plus
} from 'lucide-react';

interface InvoiceItem {
  productName: string;
  batchNumber: string;
  qty: number;
  price: number;
}

interface Invoice {
  id: string;
  customerName: string;
  total: number;
  paid: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  createdAt: string;
  items: InvoiceItem[];
}

export default function Sales() {
  const { products, batches, getFEFOBatches } = useInventoryStore();
  const { customers, cart, offlineSalesQueue, addToCart, removeFromCart, updateCartQty, clearCart, addOfflineSale } = useSalesStore();
  const { isOffline } = useAuthStore();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // FEFO suggested batch details
  const [fefoBatches, setFefoBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const [paidAmount, setPaidAmount] = useState(0);
  const [invoiceSuccess, setInvoiceSuccess] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issuingInvoice, setIssuingInvoice] = useState(false);
  const [sales, setSales] = useState<Invoice[]>([]);

  const invoiceList = isOffline ? offlineSalesQueue.map((sale) => ({
    id: sale.id,
    customerName: sale.customerName,
    total: sale.total,
    paid: sale.paid,
    status: sale.status,
    createdAt: sale.createdAt,
    items: sale.items.map((item) => ({
      productName: item.productName,
      batchNumber: item.batchNumber,
      qty: item.qty,
      price: item.price,
    })),
  })) : sales;

  // Update FEFO batches when product changes
  useEffect(() => {
    if (selectedProductId) {
      const suggested = getFEFOBatches(selectedProductId);
      setFefoBatches(suggested);
      if (suggested.length > 0) {
        setSelectedBatchId(suggested[0].id); // Auto-suggest oldest batch (FEFO)
        setPrice(Math.round(suggested[0].costPrice * 1.25)); // Auto markup 25% as default selling price
      } else {
        setSelectedBatchId('');
        setPrice(0);
      }
    } else {
      setFefoBatches([]);
      setSelectedBatchId('');
    }
    setQty(1);
  }, [selectedProductId]);

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedBatchId || qty <= 0) return;

    const prod = products.find(p => p.id === selectedProductId);
    const batch = batches.find(b => b.id === selectedBatchId);
    if (!prod || !batch) return;

    // Check if quantity exceeds available stock
    if (qty > batch.qty) {
      alert(`الكمية المطلوبة تتجاوز المتاح في هذه التشغيلة (${batch.qty} قطعة)`);
      return;
    }

    const item: CartItem = {
      productId: prod.id,
      productName: prod.name,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      qty,
      price,
      costPrice: batch.costPrice
    };

    addToCart(item);
    
    // Deduct stock locally in Zustand store to prevent double-allocation
    batch.qty -= qty;

    // Reset picker inputs
    setSelectedProductId('');
    setSelectedBatchId('');
    setQty(1);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const loadSales = async () => {
    try {
      const { data } = await apiClient.get<Invoice[]>('/sales');
      setSales(data);
    } catch (error) {
      console.error('Failed to load sales from server:', error);
    }
  };

  useEffect(() => {
    if (!isOffline) {
      loadSales();
    }
  }, [isOffline]);

  const handleCheckout = async () => {
    if (!selectedCustomerId || cart.length === 0) return;

    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const sale: OfflineSale = {
      id: crypto.randomUUID(),
      customerId: selectedCustomerId,
      customerName: selectedCustomer?.name || 'Unknown',
      items: [...cart],
      total: cartTotal,
      paid: paidAmount,
      status: paidAmount >= cartTotal ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING',
      createdAt: new Date().toISOString(),
    };

    if (!isOffline) {
      try {
        const response = await apiClient.post<Invoice>('/sales/offline', {
          customerId: sale.customerId,
          items: sale.items.map((item) => ({
            productId: item.productId,
            batchId: item.batchId,
            qty: item.qty,
            price: item.price,
          })),
          total: sale.total,
          paid: sale.paid,
          createdAt: sale.createdAt,
        });

        setSales((prev) => [response.data, ...prev]);
      } catch (error) {
        console.error('Failed to save sale on server, adding to offline queue:', error);
        addOfflineSale(sale);
      }
    } else {
      addOfflineSale(sale);
    }

    setInvoiceNumber(invoiceId);
    setInvoiceSuccess(true);
    clearCart();
    setPaidAmount(0);
    setIssuingInvoice(false);

    setTimeout(() => {
      setInvoiceSuccess(false);
    }, 5000);
  };

  const invoiceCount = invoiceList.length;
  const totalSalesAmount = invoiceList.reduce((sum, sale) => sum + sale.total, 0);
  const totalPaidAmount = invoiceList.reduce((sum, sale) => sum + sale.paid, 0);
  const totalOutstanding = invoiceList.reduce((sum, sale) => sum + Math.max(0, sale.total - sale.paid), 0);

  const closeIssueModal = () => {
    setIssuingInvoice(false);
    setSelectedCustomerId('');
    setSelectedProductId('');
    setSelectedBatchId('');
    setQty(1);
    setPrice(0);
    setPaidAmount(0);
    clearCart();
  };

  return (
    <div className="animate-fade-in-slide" dir="rtl">
      {!issuingInvoice ? (
        <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-[var(--text-primary)]">إدارة الفواتير</h1>
          <p className="mt-2 text-[var(--text-secondary)] text-sm max-w-2xl">
            شاشة شاملة لعرض الفواتير المصدرة، مراقبة المبيعات، وحفظ سجل الفواتير داخل النظام.
          </p>
        </div>

        <button
          onClick={() => setIssuingInvoice(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>إصدار فاتورة جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">عدد الفواتير</p>
              <h2 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{invoiceCount}</h2>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">الفواتير المسجلة حتى الآن.</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">إجمالي المبيعات</p>
              <h2 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{totalSalesAmount.toLocaleString('en-US')} SDG</h2>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">قيمة الفواتير الإجمالية.</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">المدفوعات المحصلة</p>
              <h2 className="mt-2 text-3xl font-bold text-emerald-500">{totalPaidAmount.toLocaleString('en-US')} SDG</h2>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">المبالغ المسددة من الفواتير.</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">المستحقات المتبقية</p>
              <h2 className="mt-2 text-3xl font-bold text-rose-500">{totalOutstanding.toLocaleString('en-US')} SDG</h2>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">المبالغ المتبقية من الفواتير.</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">الفواتير المصدرة</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">عرض سريع لكل الفواتير المسجلة وأوضاع الدفع.</p>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">آخر تحديث: {new Date().toLocaleDateString('en-US')}</div>
        </div>

        {invoiceCount === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border-color)] p-10 text-center text-[var(--text-secondary)]">
            لا توجد فواتير مسجلة حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                  <th className="py-3 pr-2">رقم الفاتورة</th>
                  <th className="py-3 text-center">العميل</th>
                  <th className="py-3 text-center">التاريخ</th>
                  <th className="py-3 text-center">الإجمالي</th>
                  <th className="py-3 text-center">المدفوع</th>
                  <th className="py-3 text-center">المتبقي</th>
                  <th className="py-3 pl-2 text-left">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {offlineSalesQueue.map((sale) => {
                  const remaining = Math.max(0, sale.total - sale.paid);
                  return (
                    <tr key={sale.id} className="hover:bg-[var(--border-color)]/30 transition-colors">
                      <td className="py-3 pr-2 font-mono font-semibold text-[var(--text-primary)]">{sale.id}</td>
                      <td className="py-3 text-center text-[var(--text-primary)]">{sale.customerName}</td>
                      <td className="py-3 text-center font-mono text-[var(--text-secondary)]">{new Date(sale.createdAt).toLocaleDateString('en-US')}</td>
                      <td className="py-3 text-center font-bold text-[var(--text-primary)]">{sale.total.toLocaleString('en-US')} SDG</td>
                      <td className="py-3 text-center font-bold text-emerald-500">{sale.paid.toLocaleString('en-US')} SDG</td>
                      <td className="py-3 text-center font-mono text-rose-500">{remaining.toLocaleString('en-US')} SDG</td>
                      <td className="py-3 pl-2 text-left">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${sale.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : sale.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-500/10 text-gray-500'}`}>
                          {sale.status === 'PAID' ? 'مدفوع' : sale.status === 'PARTIAL' ? 'جزئي' : 'معلق'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
        ) : (
        <div className="min-h-screen bg-[var(--bg-primary)]">
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">إصدار فاتورة جديدة</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                تحديث شامل لمعلومات الفاتورة والعميل، مع إمكانية إدارة المنتجات والملخص المالي.
              </p>
            </div>
            <button
              onClick={closeIssueModal}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-2xl font-semibold transition-colors"
            >
              ← العودة
            </button>
          </div>

          <div className="p-6" dir="rtl">

                <div className="grid grid-cols-1 xl:grid-cols-[2fr_420px] gap-6">
                  <div className="xl:col-span-1 space-y-6">
                    <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/20">
                      <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-secondary)] mb-5">
                        <UserCheck className="w-5 h-5" />
                        بيانات العميل
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <select
                          value={selectedCustomerId}
                          onChange={(e) => setSelectedCustomerId(e.target.value)}
                          className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none"
                        >
                          <option value="">اختر العميل للفاتورة</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>{c.name} - {c.state}</option>
                          ))}
                        </select>

                        {selectedCustomer && (
                          <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-secondary)]">
                            <div className="mb-2">العميل المحدد: <strong className="text-[var(--text-primary)]">{selectedCustomer.name}</strong></div>
                            <div>النوع: <strong>{selectedCustomer.type}</strong></div>
                            <div>الولاية: <strong>{selectedCustomer.state}</strong></div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/10">
                      <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-secondary)] mb-5">
                        <ShoppingCart className="w-5 h-5" />
                        إضافة أصناف الفاتورة
                      </div>

                      <form onSubmit={handleAddToCart} className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                        <div className="lg:col-span-2 space-y-1">
                          <label className="block text-xs text-[var(--text-secondary)]">اختر المنتج</label>
                          <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none"
                          >
                            <option value="">اختر المنتج</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs text-[var(--text-secondary)]">التشغيلة</label>
                          <select
                            value={selectedBatchId}
                            onChange={(e) => {
                              setSelectedBatchId(e.target.value);
                              const selectedBatch = batches.find(b => b.id === e.target.value);
                              if (selectedBatch) setPrice(Math.round(selectedBatch.costPrice * 1.25));
                            }}
                            disabled={fefoBatches.length === 0}
                            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none disabled:opacity-50"
                          >
                            <option value="">اختر التشغيلة</option>
                            {fefoBatches.map((b) => (
                              <option key={b.id} value={b.id}>{b.batchNumber} (المتاح: {b.qty})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs text-[var(--text-secondary)]">الكمية</label>
                          <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => setQty(Number(e.target.value))}
                            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs text-[var(--text-secondary)]">سعر البيع</label>
                          <input
                            type="number"
                            min={0.1}
                            step="any"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none"
                          />
                        </div>

                        <div className="lg:col-span-4 flex justify-end">
                          <button
                            type="submit"
                            disabled={!selectedBatchId}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                            إضافة
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/10">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">عناصر الفاتورة</h4>
                      {cart.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-[var(--border-color)] p-6 text-center text-sm text-[var(--text-secondary)]">
                          لم يضف بعد أي منتج.
                        </div>
                      ) : (
                        <div className="space-y-3 text-sm">
                          {cart.map((item) => (
                            <div key={item.batchId} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--bg-secondary)] p-3">
                              <div className="space-y-1 text-right">
                                <p className="font-medium text-[var(--text-primary)]">{item.productName}</p>
                                <p className="text-[var(--text-secondary)] text-xs">{item.batchNumber} • {item.qty} x {item.price} SDG</p>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.batchId)}
                                className="rounded-2xl bg-rose-500/10 px-3 py-2 text-rose-500 text-xs font-semibold"
                              >حذف</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6 xl:sticky xl:top-6">
                    <div className="glass-card p-7 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/10">
                      <div className="flex items-center justify-between mb-5">
                        <h4 className="text-base font-semibold text-[var(--text-primary)]">الملخص</h4>
                        <span className="text-xs text-[var(--text-secondary)]">{cart.length} صنف</span>
                      </div>
                      <div className="space-y-5 text-sm text-[var(--text-secondary)]">
                        <div className="flex justify-between">
                          <span>إجمالي الفاتورة</span>
                          <strong className="text-[var(--text-primary)] text-base">{cartTotal.toLocaleString('en-US')} SDG</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>المدفوع حالياً</span>
                          <strong className="text-emerald-500 text-base">{paidAmount.toLocaleString('en-US')} SDG</strong>
                        </div>
                        <div className="flex justify-between border-t border-[var(--border-color)] pt-5">
                          <span className="font-semibold">المتبقي</span>
                          <strong className="font-semibold text-rose-500 text-base">{Math.max(0, cartTotal - paidAmount).toLocaleString('en-US')} SDG</strong>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-7 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] space-y-5 shadow-lg shadow-black/10">
                      <div className="space-y-2 text-sm">
                        <label className="block text-[var(--text-secondary)] font-semibold text-base">المبلغ المدفوع</label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value))}
                          className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none"
                        />
                      </div>

                      <button
                        onClick={handleCheckout}
                        disabled={!selectedCustomerId || cart.length === 0}
                        className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        إصدار الفاتورة
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
    </div>
  );
}
