import React, { useState } from 'react';
import { useSalesStore, Customer } from '../store/useSalesStore';
import { 
  Users, 
  MapPin, 
  Truck, 
  Plus, 
  Search, 
  ShieldCheck,
  TrendingDown
} from 'lucide-react';

export default function Customers() {
  const { customers, setCustomers } = useSalesStore();
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form inputs
  const [newCust, setNewCust] = useState({
    name: '',
    type: 'Pharmacy',
    state: 'الخرطوم',
    phone: '',
    creditLimit: 500000
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

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name || !newCust.phone) return;

    const customer: Customer = {
      id: crypto.randomUUID(),
      name: newCust.name,
      type: newCust.type,
      state: newCust.state,
      phone: newCust.phone,
      creditLimit: Number(newCust.creditLimit)
    };

    setCustomers([customer, ...customers]);
    setNewCust({ name: '', type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000 });
    setShowAddModal(false);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesState = selectedState ? c.state === selectedState : true;
    const matchesSearch = search ? (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.state.includes(search)
    ) : true;
    return matchesState && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in-slide">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">العملاء والتوزيع</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm md:text-base">إدارة حسابات الصيدليات والموزعين وخطوط الشحن للولايات</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Search Input & State Filter */}
      <div className="glass-card flex flex-col md:flex-row items-center gap-4 px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-3 w-full md:border-l md:border-[var(--border-color)] md:pl-4">
          <Search className="w-5 h-5 text-[var(--text-secondary)]" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، الولاية، أو رقم الهاتف..."
            className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-right"
            dir="rtl"
          />
        </div>
        
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
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customers Directory (2 Columns) */}
        <div className="lg:col-span-2 space-y-4 text-right" dir="rtl">
          <h2 className="text-lg font-bold font-display flex items-center gap-2 text-[var(--text-primary)]">
            <Users className="w-5 h-5 text-emerald-500" />
            <span>سجل العملاء المعتمدين</span>
          </h2>

          {filteredCustomers.length === 0 ? (
            <div className="glass-card text-center py-12 rounded-2xl text-[var(--text-secondary)] text-sm">
              لم يتم العثور على أي عملاء مسجلين.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCustomers.map((c) => (
                <div key={c.id} className="glass-card p-5 rounded-2xl space-y-4 border border-[var(--glass-border)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">{c.name}</h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-secondary)]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>ولاية {c.state}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                      {c.type === 'Pharmacy' ? 'صيدلية' : c.type === 'Hospital' ? 'مستشفى' : 'موزع'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-color)] grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
                    <div>الهاتف: <strong className="text-[var(--text-primary)] font-mono">{c.phone}</strong></div>
                    <div>سقف الائتمان: <strong className="text-emerald-500 font-mono">{c.creditLimit.toLocaleString('en-US')} SDG</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribution Lines (1 Column) */}
        <div className="space-y-4 text-right" dir="rtl">
          <h2 className="text-lg font-bold font-display flex items-center gap-2 text-[var(--text-primary)]">
            <Truck className="w-5 h-5 text-teal-500" />
            <span>أوامر شحن الولايات</span>
          </h2>

          <div className="space-y-3">
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
                  <div className="col-span-2 text-[10px] text-[var(--text-secondary)]">تاريخ الإرسال: {d.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl space-y-4 border border-[var(--glass-border)] animate-fade-in-slide text-right" dir="rtl">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">إضافة عميل معتمد جديد</h3>
            
            <form onSubmit={handleAddCustomer} className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">اسم الجهة (الصيدلية / المستشفى)</label>
                <input 
                  type="text" 
                  required
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  placeholder="اسم الصيدلية أو الموزع"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">نوع العميل</label>
                  <select 
                    value={newCust.type}
                    onChange={(e) => setNewCust({ ...newCust, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  >
                    <option value="Pharmacy">صيدلية (Pharmacy)</option>
                    <option value="Hospital">مستشفى (Hospital)</option>
                    <option value="Distributor">موزع الجملة (Distributor)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">الولاية الجغرافية</label>
                  <select 
                    value={newCust.state}
                    onChange={(e) => setNewCust({ ...newCust, state: e.target.value })}
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
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    placeholder="رقم الموبايل"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">سقف الائتمان (SDG)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={newCust.creditLimit}
                    onChange={(e) => setNewCust({ ...newCust, creditLimit: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-start gap-3 pt-3">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium cursor-pointer"
                >
                  إضافة العميل
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-medium cursor-pointer"
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
