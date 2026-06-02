import React, { useState } from 'react';
import { useSalesStore, Customer } from '../store/useSalesStore';
import { useActivityStore } from '../store/useActivityStore';
import { useRepresentativesStore, Representative } from '../store/useRepresentativesStore';
import { 
  Users, 
  MapPin, 
  Truck, 
  Plus, 
  Search, 
  ShieldCheck,
  TrendingDown,
  Briefcase,
  Edit3,
  Trash2,
  UserCheck,
  Phone,
  Percent,
  ToggleLeft,
  ToggleRight,
  UserCog
} from 'lucide-react';

type TabType = 'customers' | 'shipping' | 'representatives';

export default function Customers() {
  const { customers, addCustomer, updateCustomer } = useSalesStore();
  const { representatives, addRepresentative, updateRepresentative, deleteRepresentative } = useRepresentativesStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  
  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [showAddRepModal, setShowAddRepModal] = useState(false);
  const [showEditRepModal, setShowEditRepModal] = useState(false);
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);

  // Customer Form inputs
  const [custForm, setCustForm] = useState({
    name: '',
    type: 'Pharmacy',
    state: 'الخرطوم',
    phone: '',
    creditLimit: 500000,
    representativeId: ''
  });

  // Representative Form inputs
  const [repForm, setRepForm] = useState({
    name: '',
    phone: '',
    commissionRate: 3.0
  });

  const [deliveryOrders] = useState([
    { id: 'DO-102', customerName: 'صيدلية الشفاء', state: 'الخرطوم', city: 'أمدرمان', status: 'DELIVERED', driverName: 'محمد أحمد', date: '2026-05-28' },
    { id: 'DO-103', customerName: 'مستشفى ود مدني التعليمي', state: 'الجزيرة', city: 'ود مدني', status: 'SHIPPED', driverName: 'أحمد صديق', date: '2026-05-29' },
    { id: 'DO-104', customerName: 'صيدلية الميناء العسكرية', state: 'البحر الأحمر', city: 'بورتسودان', status: 'PENDING', driverName: 'بكري صالح', date: '2026-05-30' },
  ]);

  // Sudan states list
  const sudanStates = [
    'الخرطوم',
    'الجزيرة',
    'البحر الأحمر',
    'نهر النيل',
    'شمال كردفان',
    'الشمالية',
    'كسلا',
    'القضارف',
    'النيل الأبيض'
  ];

  // Actions for Customers
  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name || !custForm.phone) return;

    try {
      const created = await addCustomer({
        name: custForm.name,
        type: custForm.type,
        state: custForm.state,
        phone: custForm.phone,
        creditLimit: Number(custForm.creditLimit),
        representativeId: custForm.representativeId || undefined
      });

      const repName = representatives.find(r => r.id === custForm.representativeId)?.name;

      useActivityStore.getState().logActivity(
        'إضافة عميل جديد',
        `تم تسجيل العميل ${custForm.name} (ولاية ${custForm.state}) بسقف ائتمان ${custForm.creditLimit.toLocaleString()} SDG` + 
        (repName ? ` ومندوبه الافتراضي هو ${repName}` : '')
      );

      setCustForm({ name: '', type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000, representativeId: '' });
      setShowAddCustomerModal(false);
    } catch (err) {
      console.error(err);
      alert('فشل في إضافة العميل');
    }
  };

  const handleEditCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustForm({
      name: customer.name,
      type: customer.type,
      state: customer.state,
      phone: customer.phone,
      creditLimit: customer.creditLimit,
      representativeId: customer.representativeId || ''
    });
    setShowEditCustomerModal(true);
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !custForm.name || !custForm.phone) return;

    try {
      await updateCustomer(selectedCustomer.id, {
        name: custForm.name,
        type: custForm.type,
        state: custForm.state,
        phone: custForm.phone,
        creditLimit: Number(custForm.creditLimit),
        representativeId: custForm.representativeId || ''
      });

      useActivityStore.getState().logActivity(
        'تعديل عميل',
        `تم تعديل بيانات العميل ${custForm.name} بنجاح`
      );

      setCustForm({ name: '', type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000, representativeId: '' });
      setShowEditCustomerModal(false);
      setSelectedCustomer(null);
    } catch (err) {
      console.error(err);
      alert('فشل في تعديل بيانات العميل');
    }
  };

  // Actions for Representatives
  const handleAddRepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repForm.name || !repForm.phone) return;

    try {
      await addRepresentative({
        name: repForm.name,
        phone: repForm.phone,
        commissionRate: Number(repForm.commissionRate)
      });

      useActivityStore.getState().logActivity(
        'إضافة مندوب جديد',
        `تم تسجيل المندوب ${repForm.name} بنسبة عمولة ${repForm.commissionRate}%`
      );

      setRepForm({ name: '', phone: '', commissionRate: 3.0 });
      setShowAddRepModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'فشل في إضافة المندوب');
    }
  };

  const handleEditRepClick = (rep: Representative) => {
    setSelectedRep(rep);
    setRepForm({
      name: rep.name,
      phone: rep.phone,
      commissionRate: rep.commissionRate
    });
    setShowEditRepModal(true);
  };

  const handleEditRepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep || !repForm.name || !repForm.phone) return;

    try {
      await updateRepresentative(selectedRep.id, {
        name: repForm.name,
        phone: repForm.phone,
        commissionRate: Number(repForm.commissionRate)
      });

      useActivityStore.getState().logActivity(
        'تعديل بيانات مندوب',
        `تم تعديل بيانات المندوب ${repForm.name} بنجاح`
      );

      setRepForm({ name: '', phone: '', commissionRate: 3.0 });
      setShowEditRepModal(false);
      setSelectedRep(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'فشل في تعديل المندوب');
    }
  };

  const handleToggleRepActive = async (rep: Representative) => {
    try {
      await updateRepresentative(rep.id, { isActive: !rep.isActive });
      useActivityStore.getState().logActivity(
        'تغيير حالة مندوب',
        `تم ${!rep.isActive ? 'تنشيط' : 'تعطيل'} حساب المندوب ${rep.name}`
      );
    } catch (err) {
      console.error(err);
      alert('فشل في تعديل حالة المندوب');
    }
  };

  const handleDeleteRep = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المندوب "${name}"؟ إذا كان لديه مبيعات سابقة فسيتم تعطيل حسابه فقط بدلاً من حذفه بالكامل.`)) return;
    try {
      await deleteRepresentative(id);
      useActivityStore.getState().logActivity(
        'حذف/تعطيل مندوب',
        `تم حذف أو إيقاف المندوب ${name}`
      );
    } catch (err) {
      console.error(err);
      alert('فشل في حذف المندوب');
    }
  };

  // Filter lists
  const filteredCustomers = customers.filter(c => {
    const matchesState = selectedState ? c.state === selectedState : true;
    const matchesSearch = search ? (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.state.includes(search)
    ) : true;
    return matchesState && matchesSearch;
  });

  const filteredReps = representatives.filter(r => {
    return search ? (
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search)
    ) : true;
  });

  // Active representatives list for selects
  const activeRepresentatives = representatives.filter(r => r.isActive);

  return (
    <div className="space-y-6 pb-20 lg:pb-0 text-right" dir="rtl">
      <div className="space-y-6 animate-fade-in-slide">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">إدارة الشركاء والمناديب</h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">إدارة بيانات العملاء المعتمدين، خطوط الشحن للولايات، ومناديب المبيعات والعمولات</p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {activeTab === 'customers' && (
              <button 
                onClick={() => {
                  setCustForm({ name: '', type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000, representativeId: '' });
                  setShowAddCustomerModal(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer touch-target"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عميل جديد</span>
              </button>
            )}

            {activeTab === 'representatives' && (
              <button 
                onClick={() => {
                  setRepForm({ name: '', phone: '', commissionRate: 3.0 });
                  setShowAddRepModal(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer touch-target"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مندوب جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 border-b border-[var(--border-color)] scrollbar-none flex-nowrap" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => { setActiveTab('customers'); setSearch(''); }}
            className={`shrink-0 flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'customers' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]'
            }`}
            style={{ flexShrink: 0 }}
          >
            👥 سجل العملاء والصيدليات
          </button>
          
          <button
            onClick={() => { setActiveTab('representatives'); setSearch(''); }}
            className={`shrink-0 flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'representatives' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]'
            }`}
            style={{ flexShrink: 0 }}
          >
            💼 مناديب المبيعات والعمولات
          </button>

          <button
            onClick={() => { setActiveTab('shipping'); setSearch(''); }}
            className={`shrink-0 flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'shipping' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]'
            }`}
            style={{ flexShrink: 0 }}
          >
            🚚 شحن وتوزيع الولايات
          </button>
        </div>

        {/* Global Filter Bar */}
        <div className="glass-card flex flex-col md:flex-row items-center gap-4 px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-3 w-full md:border-l md:border-[var(--border-color)] md:pl-4">
            <Search className="w-5 h-5 text-[var(--text-secondary)]" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'representatives' ? "ابحث باسم المندوب أو رقم الهاتف..." : "ابحث بالاسم، الولاية، أو رقم الهاتف..."}
              className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-right"
              dir="rtl"
            />
          </div>
          
          {activeTab === 'customers' && (
            <div className="w-full md:w-64 text-right">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)] cursor-pointer pr-2"
                dir="rtl"
              >
                <option value="" className="bg-[var(--bg-secondary)]">كل الولايات السودانية</option>
                {sudanStates.map((s, idx) => (
                  <option key={idx} value={s} className="bg-[var(--bg-secondary)]">ولاية {s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: CUSTOMERS VIEW */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-display flex items-center gap-2 text-[var(--text-primary)]">
              <Users className="w-5 h-5 text-emerald-500" />
              <span>سجل العملاء المعتمدين</span>
            </h2>

            {filteredCustomers.length === 0 ? (
              <div className="glass-card text-center py-12 rounded-2xl text-[var(--text-secondary)] text-sm">
                لم يتم العثور على أي عملاء مسجلين.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((c) => (
                  <div key={c.id} className="glass-card p-5 rounded-2xl flex flex-col justify-between border border-[var(--glass-border)] hover:border-emerald-500/30 hover:shadow-lg transition-all relative group">
                    
                    <button 
                      onClick={() => handleEditCustomerClick(c)}
                      className="absolute left-4 top-4 p-2 bg-[var(--border-color)]/20 hover:bg-emerald-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-[var(--text-secondary)]"
                      title="تعديل العميل"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <div className="space-y-3">
                      <div className="flex justify-between items-start pl-8">
                        <div>
                          <h3 className="text-base font-bold text-[var(--text-primary)]">{c.name}</h3>
                          <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-secondary)]">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            <span>ولاية {c.state}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                          {c.type === 'Pharmacy' ? 'صيدلية' : c.type === 'Hospital' ? 'مستشفى' : 'موزع'}
                        </span>
                      </div>

                      {/* Default rep indicator */}
                      <div className="bg-[var(--border-color)]/10 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                          <span>المندوب الافتراضي:</span>
                        </span>
                        {c.representative ? (
                          <strong className="text-emerald-600 font-bold">{c.representative.name} ({c.representative.commissionRate}%)</strong>
                        ) : (
                          <span className="text-[var(--text-secondary)] font-medium">بيع مباشر بدون عمولة</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[var(--border-color)]/60 grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
                      <div>الهاتف: <strong className="text-[var(--text-primary)] font-mono block mt-0.5">{c.phone}</strong></div>
                      <div>سقف الائتمان: <strong className="text-emerald-600 font-mono block mt-0.5">{c.creditLimit.toLocaleString()} SDG</strong></div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REPRESENTATIVES VIEW */}
        {activeTab === 'representatives' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-display flex items-center gap-2 text-[var(--text-primary)]">
              <UserCog className="w-5 h-5 text-emerald-500" />
              <span>إدارة مناديب المبيعات والعمولات</span>
            </h2>

            {filteredReps.length === 0 ? (
              <div className="glass-card text-center py-12 rounded-2xl text-[var(--text-secondary)] text-sm">
                لم يتم العثور على أي مناديب مبيعات مسجلين.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReps.map((r) => (
                  <div key={r.id} className={`glass-card p-5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-lg relative group ${
                    r.isActive ? 'border-emerald-500/25' : 'border-rose-500/10 opacity-70'
                  }`}>
                    
                    {/* Header Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-bold text-[var(--text-primary)]">{r.name}</h3>
                          <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {r.isActive ? 'نشط ومصرح له' : 'معطل وموقوف'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-xl">
                          <Percent className="w-3.5 h-3.5" />
                          <strong className="text-sm font-black font-mono">{r.commissionRate}%</strong>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>رقم الاتصال:</span>
                        <strong className="text-[var(--text-primary)] font-mono">{r.phone}</strong>
                      </div>
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="pt-4 mt-4 border-t border-[var(--border-color)]/70 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleRepActive(r)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          r.isActive 
                            ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white' 
                            : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {r.isActive ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            <span>تعطيل</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            <span>تنشيط</span>
                          </>
                        )}
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditRepClick(r)}
                          className="p-2 bg-[var(--border-color)]/30 hover:bg-emerald-500 hover:text-white rounded-lg text-[var(--text-secondary)] transition-all cursor-pointer"
                          title="تعديل المندوب"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteRep(r.id, r.name)}
                          className="p-2 bg-[var(--border-color)]/30 hover:bg-rose-500 hover:text-white rounded-lg text-rose-500 transition-all cursor-pointer"
                          title="حذف المندوب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SHIPPING VIEW */}
        {activeTab === 'shipping' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-display flex items-center gap-2 text-[var(--text-primary)]">
              <Truck className="w-5 h-5 text-teal-500" />
              <span>أوامر شحن الولايات</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliveryOrders.map((d) => (
                <div key={d.id} className="glass-card p-4 rounded-2xl border border-[var(--glass-border)] space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-mono text-[var(--text-secondary)]">{d.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.status === 'DELIVERED' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : d.status === 'SHIPPED' 
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {d.status === 'DELIVERED' ? 'تم التسليم' : d.status === 'SHIPPED' ? 'في الطريق' : 'جاري التحضير'}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-[var(--text-primary)]">{d.customerName}</div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
                    <div>الوجهة: <strong>{d.state} - {d.city}</strong></div>
                    <div>السائق: <strong>{d.driverName}</strong></div>
                    <div className="col-span-2 text-[10px] text-[var(--text-secondary)] mt-1">تاريخ الإرسال: {d.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ==========================================
          ADD/EDIT CUSTOMER MODALS
          ========================================== */}
      {(showAddCustomerModal || showEditCustomerModal) && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-customer max-w-md" dir="rtl">
            <div className="modal-glow-back" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {showAddCustomerModal ? 'إضافة عميل معتمد جديد' : 'تعديل بيانات العميل'}
            </h3>
            
            <form onSubmit={showAddCustomerModal ? handleAddCustomerSubmit : handleEditCustomerSubmit} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">اسم الجهة (الصيدلية / المستشفى / الموزع)</label>
                <input 
                  type="text" 
                  required
                  value={custForm.name}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  placeholder="اسم الصيدلية أو المستودع المعتمد"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">نوع العميل</label>
                  <select 
                    value={custForm.type}
                    onChange={(e) => setCustForm({ ...custForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  >
                    <option value="Pharmacy">صيدلية (Pharmacy)</option>
                    <option value="Hospital">مستشفى (Hospital)</option>
                    <option value="Distributor">موزع جملة (Distributor)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">الولاية الجغرافية</label>
                  <select 
                    value={custForm.state}
                    onChange={(e) => setCustForm({ ...custForm, state: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  >
                    {sudanStates.map((s, idx) => (
                      <option key={idx} value={s}>ولاية {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">رقم الهاتف</label>
                  <input 
                    type="text" 
                    required
                    value={custForm.phone}
                    onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                    placeholder="رقم الهاتف الفريد"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">سقف الائتمان (SDG)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={custForm.creditLimit}
                    onChange={(e) => setCustForm({ ...custForm, creditLimit: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              {/* Default representative selection */}
              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                  <span>المندوب الافتراضي للعميل (تلقائي للفواتير)</span>
                </label>
                <select 
                  value={custForm.representativeId}
                  onChange={(e) => setCustForm({ ...custForm, representativeId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                >
                  <option value="">بيع مباشر (مسؤول شركة - بدون عمولة)</option>
                  {activeRepresentatives.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (عمولة {r.commissionRate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-start gap-2.5 pt-3">
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                >
                  {showAddCustomerModal ? 'تسجيل العميل' : 'حفظ التعديلات'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setShowEditCustomerModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="px-5 py-2.5 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-bold cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          ADD/EDIT REPRESENTATIVE MODALS
          ========================================== */}
      {(showAddRepModal || showEditRepModal) && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-customer max-w-md" dir="rtl">
            <div className="modal-glow-back" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {showAddRepModal ? 'إضافة مندوب مبيعات جديد' : 'تعديل بيانات المندوب'}
            </h3>
            
            <form onSubmit={showAddRepModal ? handleAddRepSubmit : handleEditRepSubmit} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">اسم المندوب ثلاثي</label>
                <input 
                  type="text" 
                  required
                  value={repForm.name}
                  onChange={(e) => setRepForm({ ...repForm, name: e.target.value })}
                  placeholder="الاسم الكامل للمندوب"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">رقم الهاتف</label>
                  <input 
                    type="text" 
                    required
                    value={repForm.phone}
                    onChange={(e) => setRepForm({ ...repForm, phone: e.target.value })}
                    placeholder="رقم الجوال الخاص بالمندوب"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">نسبة العمولة (%)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    max={100}
                    step={0.1}
                    value={repForm.commissionRate}
                    onChange={(e) => setRepForm({ ...repForm, commissionRate: Number(e.target.value) })}
                    placeholder="نسبة العمولة من التحصيل"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-start gap-2.5 pt-3">
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                >
                  {showAddRepModal ? 'تسجيل المندوب' : 'حفظ التعديلات'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddRepModal(false);
                    setShowEditRepModal(false);
                    setSelectedRep(null);
                  }}
                  className="px-5 py-2.5 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-bold cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
