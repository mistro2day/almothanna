import React from 'react';
import { useInventoryStore } from '../store/useInventoryStore';
import { useSalesStore } from '../store/useSalesStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Users, 
  MapPin, 
  CloudLightning,
  RefreshCw,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function Dashboard() {
  const { products, batches, getNearExpiryBatches } = useInventoryStore();
  const { customers, offlineSalesQueue } = useSalesStore();
  const { isOffline } = useAuthStore();

  // Load cache initially if empty (handled at app root, but safe here too)
  const nearExpiry = getNearExpiryBatches(6); // Expiring in next 6 months

  // Calculate KPIs
  const totalStockItems = batches.reduce((sum, b) => sum + b.qty, 0);
  const totalInventoryValue = batches.reduce((sum, b) => sum + (b.qty * b.costPrice), 0);
  
  // Dummy/Hydrated Sales data for visual premium chart
  const salesData = [
    { name: 'يناير', sales: 1200000, profit: 340000 },
    { name: 'فبراير', sales: 1900000, profit: 510000 },
    { name: 'مارس', sales: 1500000, profit: 420000 },
    { name: 'أبريل', sales: 2400000, profit: 720000 },
    { name: 'مايو', sales: 3100000, profit: 950000 },
  ];

  // Sudan states distribution representation
  const stateDistribution = [
    { name: 'الخرطوم', value: 45, color: '#10b981' },
    { name: 'الجزيرة', value: 25, color: '#14b8a6' },
    { name: 'البحر الأحمر', value: 15, color: '#06b6d4' },
    { name: 'نهر النيل', value: 10, color: '#3b82f6' },
    { name: 'شمال كردفان', value: 5, color: '#6366f1' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-slide">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">لوحة التحكم</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm md:text-base">نظرة عامة على المبيعات، المخزون، وتوزيع الولايات في السودان</p>
        </div>
        
        {/* Offline Warning banner if offline */}
        {isOffline && (
          <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/15 border border-amber-500/20 rounded-xl text-amber-500 text-sm animate-pulse">
            <CloudLightning className="w-5 h-5" />
            <span>يعمل النظام حالياً **دون اتصال بالإنترنت** (سيتم حفظ العمليات محلياً ومزامنتها تلقائياً عند عودة الخدمة)</span>
          </div>
        )}

        {offlineSalesQueue.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>يوجد **{offlineSalesQueue.length}** فاتورة معلقة في قائمة الانتظار للمزامنة</span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Sales */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">إجمالي المبيعات (SDG)</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold tracking-tight">10.1M</span>
            <span className="text-emerald-500 text-xs font-semibold block mt-1">+12% من الشهر الماضي</span>
          </div>
        </div>

        {/* KPI 2: Inventory Value */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">قيمة المخزون الحالية</span>
            <div className="p-2 bg-teal-500/10 text-teal-500 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold tracking-tight">
              {totalInventoryValue.toLocaleString('en-US')} <span className="text-xs font-normal">ج.س</span>
            </span>
            <span className="text-[var(--text-secondary)] text-xs block mt-1">إجمالي القطع بالمستودع: {totalStockItems}</span>
          </div>
        </div>

        {/* KPI 3: Near Expiry Alerts */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">تنبيهات الصلاحية (FEFO)</span>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-rose-500">{nearExpiry.length}</span>
            <span className="text-[var(--text-secondary)] text-xs block mt-1">أدوية تنتهي صلاحيتها خلال 6 أشهر</span>
          </div>
        </div>

        {/* KPI 4: Customers */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">العملاء النشطين</span>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold tracking-tight">{customers.length}</span>
            <span className="text-[var(--text-secondary)] text-xs block mt-1">موزعين، مستشفيات وصيدليات</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Chart (Area Chart) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">أداء المبيعات والأرباح الحقيقية</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="الأرباح" stroke="#14b8a6" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State wise distribution chart */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">نسبة التوزيع الجغرافي</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateDistribution} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey="value" name="النسبة %" radius={[0, 4, 4, 0]}>
                  {stateDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {stateDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Expiry Alerts (FEFO table) */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">أدوية قريبة الانتهاء (تتبع FEFO)</h2>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-500">حرج</span>
        </div>

        {nearExpiry.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-secondary)]">
            لا توجد أدوية منتهية أو قريبة الانتهاء في المخازن حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                  <th className="pb-3 pr-2">المنتج</th>
                  <th className="pb-3 text-center">رقم التشغيلة (Batch)</th>
                  <th className="pb-3 text-center">الكمية المتبقية</th>
                  <th className="pb-3 text-center">تاريخ الانتهاء</th>
                  <th className="pb-3 pl-2 text-left">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {nearExpiry.map((b) => {
                  const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  const isSevere = daysLeft < 90;

                  return (
                    <tr key={b.id} className="hover:bg-[var(--border-color)]/30 transition-colors">
                      <td className="py-3 pr-2 font-medium text-[var(--text-primary)]">{b.productName}</td>
                      <td className="py-3 text-center font-mono text-[var(--text-secondary)]">{b.batchNumber}</td>
                      <td className="py-3 text-center font-semibold text-[var(--text-primary)]">{b.qty}</td>
                      <td className="py-3 text-center font-mono text-[var(--text-secondary)]">{new Date(b.expiryDate).toLocaleDateString('en-US')}</td>
                      <td className="py-3 pl-2 text-left">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isSevere 
                            ? 'bg-rose-500/15 text-rose-500 animate-pulse' 
                            : 'bg-amber-500/15 text-amber-500'
                        }`}>
                          {daysLeft < 0 ? 'منتهي الصلاحية' : `متبقي ${daysLeft} يوم`}
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
  );
}
