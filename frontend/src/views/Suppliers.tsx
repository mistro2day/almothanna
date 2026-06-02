import React, { useState, useMemo } from 'react';
import { useSupplierStore, Supplier, PurchaseOrder, PurchaseOrderItem, SupplierPayment } from '../store/useSupplierStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useActivityStore } from '../store/useActivityStore';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  X,
  ShoppingBag,
  Banknote,
  ChevronLeft,
  Hash,
  Calendar,
  ClipboardList,
  BadgeCheck,
  AlertCircle
} from 'lucide-react';

// Payment terms display map
const paymentTermsMap: Record<string, string> = {
  CASH_ON_DELIVERY: 'الدفع عند الاستلام',
  NET_7: 'آجل 7 أيام',
  NET_15: 'آجل 15 يوم',
  NET_30: 'آجل 30 يوم',
  NET_60: 'آجل 60 يوم',
  NET_90: 'آجل 90 يوم',
};

// Supplier type display map
const supplierTypeMap: Record<string, string> = {
  pharma_company: 'شركة أدوية',
  wholesaler: 'موزع جملة',
  manufacturer: 'مصنع',
};

// Payment method display map
const paymentMethodMap: Record<string, string> = {
  CASH: 'نقدي',
  BANK_TRANSFER: 'تحويل بنكي',
  CHECK: 'شيك',
  MOBILE_MONEY: 'دفع إلكتروني',
};

// Purchase status display
const purchaseStatusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'مسودة', color: 'text-gray-400 bg-gray-500/10' },
  CONFIRMED: { label: 'مؤكد', color: 'text-blue-500 bg-blue-500/10' },
  RECEIVED: { label: 'مستلم', color: 'text-emerald-500 bg-emerald-500/10' },
  PARTIAL: { label: 'جزئي', color: 'text-amber-500 bg-amber-500/10' },
  CANCELLED: { label: 'ملغي', color: 'text-rose-500 bg-rose-500/10' },
};

export default function Suppliers() {
  const {
    suppliers,
    purchaseOrders,
    payments,
    addSupplier,
    addPurchaseOrder,
    addPayment,
    getSupplierTotalPurchases,
    getSupplierTotalPayments,
    getSupplierBalance,
    getTotalOutstanding,
  } = useSupplierStore();

  const { products } = useInventoryStore();

  // UI states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailView, setShowDetailView] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'purchases' | 'payments'>('info');

  // Add supplier form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    companyName: '',
    type: 'pharma_company',
    phone: '',
    email: '',
    country: 'السودان',
    city: '',
    address: '',
    commercialReg: '',
    contactPerson: '',
    contactPhone: '',
    creditLimit: 0,
    paymentTerms: 'CASH_ON_DELIVERY',
    currency: 'SDG',
    notes: '',
  });

  // Purchase order form
  const [newPO, setNewPO] = useState({
    items: [{ productId: '', productName: '', qty: 1, unitCost: 0 }] as { productId: string; productName: string; qty: number; unitCost: number }[],
    notes: '',
  });

  const [activePOItemSearchIdx, setActivePOItemSearchIdx] = useState<number | null>(null);
  const [poItemSearchText, setPoItemSearchText] = useState('');

  // Payment form
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    paymentMethod: 'CASH' as SupplierPayment['paymentMethod'],
    reference: '',
    notes: '',
  });

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesType = filterType ? s.type === filterType : true;
      const matchesSearch = search
        ? s.name.includes(search) ||
          s.phone.includes(search) ||
          (s.companyName && s.companyName.includes(search)) ||
          (s.city && s.city.includes(search))
        : true;
      return matchesType && matchesSearch;
    });
  }, [suppliers, search, filterType]);

  // KPIs
  const totalPurchasesAll = purchaseOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);
  const totalPaymentsAll = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = getTotalOutstanding();

  // Current detail supplier
  const detailSupplier = showDetailView ? suppliers.find((s) => s.id === showDetailView) : null;
  const detailPurchases = showDetailView
    ? purchaseOrders.filter((o) => o.supplierId === showDetailView)
    : [];
  const detailPayments = showDetailView
    ? payments.filter((p) => p.supplierId === showDetailView)
    : [];

  // Handlers
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.phone) return;

    try {
      await addSupplier({
        name: newSupplier.name,
        companyName: newSupplier.companyName || undefined,
        type: newSupplier.type,
        phone: newSupplier.phone,
        email: newSupplier.email || undefined,
        country: newSupplier.country,
        city: newSupplier.city || undefined,
        address: newSupplier.address || undefined,
        commercialReg: newSupplier.commercialReg || undefined,
        contactPerson: newSupplier.contactPerson || undefined,
        contactPhone: newSupplier.contactPhone || undefined,
        creditLimit: Number(newSupplier.creditLimit),
        paymentTerms: newSupplier.paymentTerms,
        currency: newSupplier.currency,
        notes: newSupplier.notes || undefined,
        isActive: true,
      });
      useActivityStore.getState().logActivity(
        'إضافة مورد جديد',
        `تم تسجيل المورد ${newSupplier.name} (شركة: ${newSupplier.companyName || '---'}) بنجاح`
      );
      setNewSupplier({
        name: '', companyName: '', type: 'pharma_company', phone: '', email: '',
        country: 'السودان', city: '', address: '', commercialReg: '',
        contactPerson: '', contactPhone: '', creditLimit: 0,
        paymentTerms: 'CASH_ON_DELIVERY', currency: 'SDG', notes: '',
      });
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      alert('فشل في إضافة المورد');
    }
  };

  const handleAddPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDetailView || newPO.items.length === 0) return;

    const validItems = newPO.items.filter((i) => i.productId && i.qty > 0 && i.unitCost > 0);
    if (validItems.length === 0) return;

    const total = validItems.reduce((sum, i) => sum + i.qty * i.unitCost, 0);

    try {
      await addPurchaseOrder({
        supplierId: showDetailView,
        total,
        paid: 0,
        status: 'CONFIRMED',
        items: validItems.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          unitCost: i.unitCost,
        })),
        notes: newPO.notes || undefined,
      });
      useActivityStore.getState().logActivity(
        'أمر شراء جديد',
        `تم إنشاء أمر شراء جديد للمورد ${detailSupplier?.name || ''} بقيمة إجمالية ${total.toLocaleString()} SDG بعدد ${validItems.length} أصناف`
      );
      setNewPO({ items: [{ productId: '', productName: '', qty: 1, unitCost: 0 }], notes: '' });
      setShowPurchaseModal(false);
    } catch (err) {
      console.error(err);
      alert('فشل في إنشاء أمر الشراء');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDetailView || newPayment.amount <= 0) return;

    try {
      await addPayment({
        supplierId: showDetailView,
        amount: Number(newPayment.amount),
        paymentMethod: newPayment.paymentMethod,
        reference: newPayment.reference || undefined,
        notes: newPayment.notes || undefined,
      });
      useActivityStore.getState().logActivity(
        'سداد لمورد',
        `تم سداد دفعة مالية بقيمة ${newPayment.amount.toLocaleString()} SDG للمورد ${detailSupplier?.name || ''} عبر ${paymentMethodMap[newPayment.paymentMethod] || newPayment.paymentMethod}`
      );
      setNewPayment({ amount: 0, paymentMethod: 'CASH', reference: '', notes: '' });
      setShowPaymentModal(false);
    } catch (err) {
      console.error(err);
      alert('فشل في تسجيل الدفعة');
    }
  };

  const addPOItem = () => {
    setNewPO({
      ...newPO,
      items: [...newPO.items, { productId: '', productName: '', qty: 1, unitCost: 0 }],
    });
  };

  const removePOItem = (idx: number) => {
    setNewPO({
      ...newPO,
      items: newPO.items.filter((_, i) => i !== idx),
    });
  };

  const updatePOItem = (idx: number, field: string, value: any) => {
    const items = [...newPO.items];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      items[idx] = { ...items[idx], productId: value, productName: prod?.name || '' };
    } else {
      items[idx] = { ...items[idx], [field]: value };
    }
    setNewPO({ ...newPO, items });
  };

  // ===================== DETAIL VIEW =====================
  if (showDetailView && detailSupplier) {
    const supplierPurchases = getSupplierTotalPurchases(detailSupplier.id);
    const supplierPaymentsTotal = getSupplierTotalPayments(detailSupplier.id);
    const supplierBalance = getSupplierBalance(detailSupplier.id);

    return (
      <div className="space-y-6">
        <div className="space-y-6 animate-fade-in-slide">
        {/* Back Button & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowDetailView(null); setDetailTab('info'); }}
              className="p-2 rounded-xl bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">{detailSupplier.name}</h1>
              <p className="text-[var(--text-secondary)] text-sm mt-0.5">
                {supplierTypeMap[detailSupplier.type] || detailSupplier.type}
                {detailSupplier.companyName && ` • ${detailSupplier.companyName}`}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>أمر شراء جديد</span>
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
            >
              <Banknote className="w-4 h-4" />
              <span>تسجيل دفعة</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" dir="rtl">
          <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي المشتريات</span>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl"><TrendingUp className="w-4 h-4" /></div>
            </div>
            <div className="mt-3">
              <span className="text-xl font-bold text-[var(--text-primary)]">{supplierPurchases.toLocaleString('en-US')}</span>
              <span className="text-xs text-[var(--text-secondary)] mr-1">{detailSupplier.currency}</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي المدفوعات</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl"><Banknote className="w-4 h-4" /></div>
            </div>
            <div className="mt-3">
              <span className="text-xl font-bold text-emerald-500">{supplierPaymentsTotal.toLocaleString('en-US')}</span>
              <span className="text-xs text-[var(--text-secondary)] mr-1">{detailSupplier.currency}</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-rose-500/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">الرصيد المستحق</span>
              <div className={`p-2 rounded-xl ${supplierBalance > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className={`text-xl font-bold ${supplierBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {supplierBalance.toLocaleString('en-US')}
              </span>
              <span className="text-xs text-[var(--text-secondary)] mr-1">{detailSupplier.currency}</span>
            </div>
          </div>
        </div>

        {/* Detail Tabs */}
        <div className="glass-card rounded-2xl overflow-hidden" dir="rtl">
          <div className="flex border-b border-[var(--border-color)]">
            {([
              { id: 'info', label: 'بيانات المورد', icon: Building2 },
              { id: 'purchases', label: `أوامر الشراء (${detailPurchases.length})`, icon: ClipboardList },
              { id: 'payments', label: `سجل المدفوعات (${detailPayments.length})`, icon: CreditCard },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                    detailTab === tab.id
                      ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* Info Tab */}
            {detailTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    البيانات الأساسية
                  </h3>
                  <div className="space-y-3 text-[var(--text-secondary)]">
                    <div className="flex justify-between"><span>اسم المورد:</span><strong className="text-[var(--text-primary)]">{detailSupplier.name}</strong></div>
                    {detailSupplier.companyName && <div className="flex justify-between"><span>اسم الشركة:</span><strong className="text-[var(--text-primary)]">{detailSupplier.companyName}</strong></div>}
                    <div className="flex justify-between"><span>النوع:</span><strong className="text-[var(--text-primary)]">{supplierTypeMap[detailSupplier.type]}</strong></div>
                    <div className="flex justify-between"><span>الهاتف:</span><strong className="text-[var(--text-primary)] font-mono">{detailSupplier.phone}</strong></div>
                    {detailSupplier.email && <div className="flex justify-between"><span>البريد:</span><strong className="text-[var(--text-primary)]">{detailSupplier.email}</strong></div>}
                    <div className="flex justify-between"><span>الموقع:</span><strong className="text-[var(--text-primary)]">{detailSupplier.country}{detailSupplier.city ? ` - ${detailSupplier.city}` : ''}</strong></div>
                    {detailSupplier.address && <div className="flex justify-between"><span>العنوان:</span><strong className="text-[var(--text-primary)]">{detailSupplier.address}</strong></div>}
                    {detailSupplier.commercialReg && <div className="flex justify-between"><span>السجل التجاري:</span><strong className="text-[var(--text-primary)] font-mono">{detailSupplier.commercialReg}</strong></div>}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    البيانات المالية
                  </h3>
                  <div className="space-y-3 text-[var(--text-secondary)]">
                    <div className="flex justify-between"><span>سقف الائتمان:</span><strong className="text-emerald-500 font-mono">{detailSupplier.creditLimit.toLocaleString('en-US')} {detailSupplier.currency}</strong></div>
                    <div className="flex justify-between"><span>شروط الدفع:</span><strong className="text-[var(--text-primary)]">{paymentTermsMap[detailSupplier.paymentTerms]}</strong></div>
                    <div className="flex justify-between"><span>عملة التعامل:</span><strong className="text-[var(--text-primary)]">{detailSupplier.currency}</strong></div>
                    {detailSupplier.contactPerson && (
                      <>
                        <div className="flex justify-between"><span>شخص التواصل:</span><strong className="text-[var(--text-primary)]">{detailSupplier.contactPerson}</strong></div>
                        {detailSupplier.contactPhone && <div className="flex justify-between"><span>رقم التواصل:</span><strong className="text-[var(--text-primary)] font-mono">{detailSupplier.contactPhone}</strong></div>}
                      </>
                    )}
                    {detailSupplier.notes && <div className="flex justify-between"><span>ملاحظات:</span><strong className="text-[var(--text-primary)]">{detailSupplier.notes}</strong></div>}
                    <div className="flex justify-between"><span>تاريخ التسجيل:</span><strong className="text-[var(--text-primary)] font-mono">{new Date(detailSupplier.createdAt).toLocaleDateString('en-US')}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* Purchases Tab */}
            {detailTab === 'purchases' && (
              <div className="space-y-4">
                {detailPurchases.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-secondary)] text-sm">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    لا توجد أوامر شراء مسجلة لهذا المورد بعد.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                          <th className="pb-3 pr-2">رقم الأمر</th>
                          <th className="pb-3 text-center">التاريخ</th>
                          <th className="pb-3 text-center">الأصناف</th>
                          <th className="pb-3 text-center">الإجمالي</th>
                          <th className="pb-3 text-center">المدفوع</th>
                          <th className="pb-3 pl-2 text-left">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {detailPurchases.map((po) => (
                          <tr key={po.id} className="hover:bg-[var(--border-color)]/30 transition-colors">
                            <td className="py-3 pr-2 font-mono font-bold text-[var(--text-primary)]">{po.orderNumber}</td>
                            <td className="py-3 text-center font-mono text-[var(--text-secondary)]">{new Date(po.createdAt).toLocaleDateString('en-US')}</td>
                            <td className="py-3 text-center text-[var(--text-primary)]">{po.items.length} صنف</td>
                            <td className="py-3 text-center font-mono font-bold text-[var(--text-primary)]">{po.total.toLocaleString('en-US')}</td>
                            <td className="py-3 text-center font-mono text-emerald-500">{po.paid.toLocaleString('en-US')}</td>
                            <td className="py-3 pl-2 text-left">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${purchaseStatusMap[po.status]?.color}`}>
                                {purchaseStatusMap[po.status]?.label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {detailTab === 'payments' && (
              <div className="space-y-4">
                {detailPayments.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-secondary)] text-sm">
                    <Banknote className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    لا توجد مدفوعات مسجلة لهذا المورد بعد.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                          <th className="pb-3 pr-2">التاريخ</th>
                          <th className="pb-3 text-center">المبلغ</th>
                          <th className="pb-3 text-center">طريقة الدفع</th>
                          <th className="pb-3 text-center">المرجع</th>
                          <th className="pb-3 pl-2 text-left">ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {detailPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-[var(--border-color)]/30 transition-colors">
                            <td className="py-3 pr-2 font-mono text-[var(--text-secondary)]">{new Date(p.paidAt).toLocaleDateString('en-US')}</td>
                            <td className="py-3 text-center font-mono font-bold text-emerald-500">{p.amount.toLocaleString('en-US')} {detailSupplier.currency}</td>
                            <td className="py-3 text-center text-[var(--text-primary)]">{paymentMethodMap[p.paymentMethod]}</td>
                            <td className="py-3 text-center font-mono text-[var(--text-secondary)]">{p.reference || '-'}</td>
                            <td className="py-3 pl-2 text-left text-[var(--text-secondary)] text-xs">{p.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== Purchase Order Modal ========== */}
        {showPurchaseModal && (
          <div className="modal-overlay">
            <div className="modal-content-card max-w-2xl" dir="rtl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">أمر شراء جديد - {detailSupplier.name}</h3>
                <button onClick={() => setShowPurchaseModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--border-color)] text-[var(--text-secondary)] cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleAddPO} className="space-y-4 text-sm">
                {/* Items */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-[var(--text-primary)]">أصناف الشراء</label>
                    <button type="button" onClick={addPOItem} className="text-xs text-emerald-500 hover:text-emerald-400 font-bold cursor-pointer flex items-center gap-1">
                      <Plus className="w-3 h-3" /> إضافة صنف
                    </button>
                  </div>

                  {newPO.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                      <div className="col-span-5 space-y-1 relative">
                        <label className="block text-[10px] text-[var(--text-secondary)]">المنتج</label>
                        <input
                          type="text"
                          placeholder="ابحث عن المنتج..."
                          value={activePOItemSearchIdx === idx ? poItemSearchText : (item.productName || '')}
                          onFocus={() => {
                            setActivePOItemSearchIdx(idx);
                            setPoItemSearchText(item.productName || '');
                          }}
                          onChange={(e) => {
                            setPoItemSearchText(e.target.value);
                          }}
                          onBlur={() => {
                            // Slight delay to allow clicking suggestions before hiding
                            setTimeout(() => {
                              setActivePOItemSearchIdx(null);
                            }, 200);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none text-xs"
                        />
                        {activePOItemSearchIdx === idx && (
                          <div className="absolute z-50 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-[var(--border-color)]">
                            {products
                              .filter(p => p.name.toLowerCase().includes(poItemSearchText.toLowerCase()) || (p.scientificName && p.scientificName.toLowerCase().includes(poItemSearchText.toLowerCase())))
                              .map((p) => (
                                <div
                                  key={p.id}
                                  onMouseDown={() => {
                                    updatePOItem(idx, 'productId', p.id);
                                    setActivePOItemSearchIdx(null);
                                  }}
                                  className="p-2.5 hover:bg-[var(--border-color)]/30 cursor-pointer text-right transition-colors"
                                >
                                  <span className="font-bold text-xs text-[var(--text-primary)]">{p.name}</span>
                                  {p.scientificName && (
                                    <span className="block text-[10px] text-[var(--text-secondary)] italic mt-0.5">{p.scientificName}</span>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="block text-[10px] text-[var(--text-secondary)]">الكمية</label>
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updatePOItem(idx, 'qty', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none text-xs"
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="block text-[10px] text-[var(--text-secondary)]">سعر الوحدة</label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={item.unitCost}
                          onChange={(e) => updatePOItem(idx, 'unitCost', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none text-xs"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {newPO.items.length > 1 && (
                          <button type="button" onClick={() => removePOItem(idx)} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-sm font-bold text-[var(--text-primary)]">الإجمالي:</span>
                    <span className="text-lg font-bold text-emerald-500 font-mono">
                      {newPO.items.reduce((sum, i) => sum + i.qty * i.unitCost, 0).toLocaleString('en-US')} {detailSupplier.currency}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">ملاحظات</label>
                  <textarea
                    value={newPO.notes}
                    onChange={(e) => setNewPO({ ...newPO, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none resize-none"
                    placeholder="ملاحظات إضافية..."
                  />
                </div>

                <div className="flex justify-start gap-3 pt-2">
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium cursor-pointer text-sm">تأكيد أمر الشراء</button>
                  <button type="button" onClick={() => setShowPurchaseModal(false)} className="px-5 py-2.5 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-medium cursor-pointer text-sm">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========== Payment Modal ========== */}
        {showPaymentModal && (
          <div className="modal-overlay">
            <div className="modal-content-card max-w-md" dir="rtl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">تسجيل دفعة - {detailSupplier.name}</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--border-color)] text-[var(--text-secondary)] cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              {supplierBalance > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>الرصيد المستحق حالياً: <strong className="font-mono">{supplierBalance.toLocaleString('en-US')} {detailSupplier.currency}</strong></span>
                </div>
              )}

              <form onSubmit={handleAddPayment} className="space-y-3 text-sm">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">المبلغ ({detailSupplier.currency})</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={newPayment.amount || ''}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                    placeholder="أدخل المبلغ"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">طريقة الدفع</label>
                  <select
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value as SupplierPayment['paymentMethod'] })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  >
                    <option value="CASH">نقدي</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CHECK">شيك</option>
                    <option value="MOBILE_MONEY">دفع إلكتروني</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">رقم المرجع (اختياري)</label>
                  <input
                    type="text"
                    value={newPayment.reference}
                    onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                    placeholder="رقم الحوالة أو الشيك"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">ملاحظات (اختياري)</label>
                  <textarea
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                    rows={2}
                    placeholder="ملاحظات..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none resize-none"
                  />
                </div>

                <div className="flex justify-start gap-3 pt-2">
                  <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium cursor-pointer">تسجيل الدفعة</button>
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="px-5 py-2.5 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-medium cursor-pointer">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===================== MAIN LIST VIEW =====================
  return (
    <div className="space-y-6 pb-20 lg:pb-0" dir="rtl">
      <div className="space-y-6 animate-fade-in-slide">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">إدارة الموردين</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">تتبع شركات الأدوية والموزعين والمصانع مع البيانات المالية</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer touch-target w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مورد جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" dir="rtl">
        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">عدد الموردين</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl"><Building2 className="w-5 h-5" /></div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold tracking-tight">{suppliers.length}</span>
            <span className="text-[var(--text-secondary)] text-xs block mt-1">مورد مسجل في النظام</span>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">إجمالي المشتريات</span>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold tracking-tight">{totalPurchasesAll.toLocaleString('en-US')}</span>
            <span className="text-[var(--text-secondary)] text-xs block mt-1">SDG من جميع الموردين</span>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">المدفوعات الكلية</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl"><Banknote className="w-5 h-5" /></div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-500">{totalPaymentsAll.toLocaleString('en-US')}</span>
            <span className="text-[var(--text-secondary)] text-xs block mt-1">SDG تم سدادها</span>
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">المستحقات المتبقية</span>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl"><TrendingDown className="w-5 h-5" /></div>
          </div>
          <div className="mt-4">
            <span className={`text-2xl md:text-3xl font-bold tracking-tight ${totalOutstanding > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {totalOutstanding.toLocaleString('en-US')}
            </span>
            <span className="text-[var(--text-secondary)] text-xs block mt-1">SDG مستحقة للموردين</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card flex flex-col md:flex-row items-center gap-4 px-4 py-3 rounded-2xl" dir="rtl">
        <div className="flex items-center gap-3 w-full md:border-l md:border-[var(--border-color)] md:pl-4">
          <Search className="w-5 h-5 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، رقم الهاتف، أو المدينة..."
            className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-right"
          />
        </div>

        <div className="w-full md:w-64 text-right">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)] cursor-pointer pr-2"
          >
            <option value="" className="bg-[var(--bg-secondary)]">كل أنواع الموردين</option>
            <option value="pharma_company" className="bg-[var(--bg-secondary)]">شركات أدوية</option>
            <option value="wholesaler" className="bg-[var(--bg-secondary)]">موزعين جملة</option>
            <option value="manufacturer" className="bg-[var(--bg-secondary)]">مصانع</option>
          </select>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="text-right" dir="rtl">
        <h2 className="text-lg font-bold font-display flex items-center gap-2 text-[var(--text-primary)] mb-4">
          <Building2 className="w-5 h-5 text-emerald-500" />
          <span>سجل الموردين ({filteredSuppliers.length})</span>
        </h2>

        {filteredSuppliers.length === 0 ? (
          <div className="glass-card text-center py-16 rounded-2xl text-[var(--text-secondary)]">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">لا يوجد موردين مسجلين {search || filterType ? 'بهذه المعايير' : 'بعد'}.</p>
            <p className="text-xs mt-1 opacity-70">اضغط "إضافة مورد جديد" للبدء</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((s) => {
              const balance = getSupplierBalance(s.id);
              const totalPurchases = getSupplierTotalPurchases(s.id);
              return (
                <div key={s.id} className="glass-card p-5 rounded-2xl space-y-4 border border-[var(--glass-border)] hover:border-emerald-500/20 transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-[var(--text-primary)] truncate">{s.name}</h3>
                      {s.companyName && <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{s.companyName}</p>}
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-[var(--text-secondary)]">
                        <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        <span>{s.country}{s.city ? ` - ${s.city}` : ''}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 flex-shrink-0">
                      {supplierTypeMap[s.type] || s.type}
                    </span>
                  </div>

                  {/* Financial Summary */}
                  <div className="pt-3 border-t border-[var(--border-color)] grid grid-cols-2 gap-3 text-xs text-[var(--text-secondary)]">
                    <div>
                      <span className="block mb-0.5">المشتريات</span>
                      <strong className="text-[var(--text-primary)] font-mono text-sm">{totalPurchases.toLocaleString('en-US')}</strong>
                      <span className="text-[10px] mr-0.5">{s.currency}</span>
                    </div>
                    <div>
                      <span className="block mb-0.5">المستحق</span>
                      <strong className={`font-mono text-sm ${balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {balance.toLocaleString('en-US')}
                      </strong>
                      <span className="text-[10px] mr-0.5">{s.currency}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <Phone className="w-3 h-3" />
                      <span className="font-mono">{s.phone}</span>
                    </div>
                    <button
                      onClick={() => { setShowDetailView(s.id); setDetailTab('info'); }}
                      className="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-400 font-semibold cursor-pointer group-hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>التفاصيل</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* ========== Add Supplier Modal ========== */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-supplier max-w-2xl" dir="rtl">
            <div className="modal-glow-back" />
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">تسجيل مورد جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--border-color)] text-[var(--text-secondary)] cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4 text-sm">
              {/* Basic Info Section */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">البيانات الأساسية</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">اسم المورد *</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    placeholder="اسم المورد أو الوكيل"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">اسم الشركة</label>
                  <input
                    type="text"
                    value={newSupplier.companyName}
                    onChange={(e) => setNewSupplier({ ...newSupplier, companyName: e.target.value })}
                    placeholder="اسم الشركة الرسمي"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">نوع المورد</label>
                  <select
                    value={newSupplier.type}
                    onChange={(e) => setNewSupplier({ ...newSupplier, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  >
                    <option value="pharma_company">شركة أدوية</option>
                    <option value="wholesaler">موزع جملة</option>
                    <option value="manufacturer">مصنع</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">رقم الهاتف *</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="رقم الموبايل"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">الدولة</label>
                  <input
                    type="text"
                    value={newSupplier.country}
                    onChange={(e) => setNewSupplier({ ...newSupplier, country: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">المدينة</label>
                  <input
                    type="text"
                    value={newSupplier.city}
                    onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                    placeholder="المدينة"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">السجل التجاري</label>
                  <input
                    type="text"
                    value={newSupplier.commercialReg}
                    onChange={(e) => setNewSupplier({ ...newSupplier, commercialReg: e.target.value })}
                    placeholder="رقم السجل"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">العنوان التفصيلي</label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  placeholder="العنوان الكامل"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                />
              </div>

              {/* Contact Person */}
              <div className="space-y-1 pt-2">
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">شخص التواصل</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">الاسم</label>
                  <input
                    type="text"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    placeholder="اسم المندوب"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">الرقم</label>
                  <input
                    type="text"
                    value={newSupplier.contactPhone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPhone: e.target.value })}
                    placeholder="رقم المندوب"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              {/* Financial Section */}
              <div className="space-y-1 pt-2">
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">البيانات المالية</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">سقف الائتمان</label>
                  <input
                    type="number"
                    min={0}
                    value={newSupplier.creditLimit}
                    onChange={(e) => setNewSupplier({ ...newSupplier, creditLimit: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">شروط الدفع</label>
                  <select
                    value={newSupplier.paymentTerms}
                    onChange={(e) => setNewSupplier({ ...newSupplier, paymentTerms: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  >
                    <option value="CASH_ON_DELIVERY">الدفع عند الاستلام</option>
                    <option value="NET_7">آجل 7 أيام</option>
                    <option value="NET_15">آجل 15 يوم</option>
                    <option value="NET_30">آجل 30 يوم</option>
                    <option value="NET_60">آجل 60 يوم</option>
                    <option value="NET_90">آجل 90 يوم</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">العملة</label>
                  <select
                    value={newSupplier.currency}
                    onChange={(e) => setNewSupplier({ ...newSupplier, currency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  >
                    <option value="SDG">جنيه سوداني (SDG)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">ملاحظات</label>
                <textarea
                  value={newSupplier.notes}
                  onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                  rows={2}
                  placeholder="ملاحظات إضافية عن المورد..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none resize-none"
                />
              </div>

              <div className="flex justify-start gap-3 pt-3">
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium cursor-pointer">تسجيل المورد</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-medium cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
