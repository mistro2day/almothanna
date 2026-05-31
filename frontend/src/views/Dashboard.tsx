import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '../store/useInventoryStore';
import { useSalesStore } from '../store/useSalesStore';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/apiClient';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Users, 
  CloudLightning,
  RefreshCw,
  Clock,
  Pill,
  BarChart2
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
  Cell,
  LabelList
} from 'recharts';

// ─────────────────────────────────────────────────────────
// Helper: format large numbers on the Y-axis
// ─────────────────────────────────────────────────────────
const formatYAxis = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)    return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
};

// ─────────────────────────────────────────────────────────
// Helper: format currency for tooltips
// ─────────────────────────────────────────────────────────
const formatCurrency = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M ج.س`;
  if (value >= 1_000)    return `${(value / 1_000).toFixed(1)}K ج.س`;
  return `${value.toLocaleString('en-US')} ج.س`;
};

interface DashboardStats {
  salesChart: { name: string; sales: number; profit: number }[];
  topProducts: { name: string; qty: number; revenue: number; color: string }[];
  totalRevenue: number;
  totalProfit: number;
}

// ─────────────────────────────────────────────────────────
// Custom Tooltip for Area Chart
// ─────────────────────────────────────────────────────────
const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-xl border border-[var(--glass-border)] text-right text-xs space-y-1.5" dir="rtl">
        <p className="font-bold text-[var(--text-primary)] mb-2 text-sm">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="font-semibold" style={{ color: p.color }}>{formatCurrency(p.value)}</span>
            <span className="text-[var(--text-secondary)]">{p.name}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────────────────
// Custom Tooltip for Bar Chart
// ─────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="glass-card p-3 rounded-xl border border-[var(--glass-border)] text-right text-xs space-y-1.5" dir="rtl">
        <p className="font-bold text-[var(--text-primary)] text-sm">{d.name}</p>
        <div className="flex justify-between gap-4">
          <span className="font-semibold text-emerald-400">{d.qty.toLocaleString('en-US')} وحدة</span>
          <span className="text-[var(--text-secondary)]">الكمية</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-semibold text-teal-400">{formatCurrency(d.revenue)}</span>
          <span className="text-[var(--text-secondary)]">الإيرادات</span>
        </div>
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────────────────
// Custom Label inside bar – truncate long names
// ─────────────────────────────────────────────────────────
const BarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (width < 40) return null;
  const truncated = value.length > 14 ? value.slice(0, 12) + '…' : value;
  return (
    <text
      x={x + 8}
      y={y + height / 2 + 1}
      fill="#fff"
      fontSize={10}
      fontWeight={600}
      dominantBaseline="middle"
      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
    >
      {truncated}
    </text>
  );
};

export default function Dashboard() {
  const { products, batches, getNearExpiryBatches } = useInventoryStore();
  const { customers, offlineSalesQueue } = useSalesStore();
  const { isOffline } = useAuthStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Near-expiry batches from inventory store
  const nearExpiry = getNearExpiryBatches(6);

  // Calculate inventory KPIs from local store
  const totalStockItems     = batches.reduce((sum, b) => sum + b.qty, 0);
  const totalInventoryValue = batches.reduce((sum, b) => sum + b.qty * b.costPrice, 0);

  // ── Fetch dashboard stats from backend ──────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingStats(true);
    apiClient
      .get<DashboardStats>('/sales/dashboard-stats')
      .then(({ data }) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        console.warn('dashboard stats fetch failed', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Fallback if no DB data yet (empty or offline) ───────
  const salesChartData =
    stats && stats.salesChart.length > 0
      ? stats.salesChart
      : [
          { name: 'يناير', sales: 0, profit: 0 },
          { name: 'فبراير', sales: 0, profit: 0 },
        ];

  const topProductsData =
    stats && stats.topProducts.length > 0
      ? stats.topProducts
      : [];

  const totalRevenue = stats?.totalRevenue ?? 0;

  return (
    <div className="space-y-6 animate-fade-in-slide pb-20 lg:pb-0" dir="rtl">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">لوحة التحكم</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">نظرة عامة على المبيعات، المخزون، وتوزيع الولايات في السودان</p>
        </div>
        {isOffline && (
          <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/15 border border-amber-500/20 rounded-xl text-amber-500 text-sm animate-pulse">
            <CloudLightning className="w-5 h-5" />
            <span>يعمل النظام حالياً دون اتصال بالإنترنت</span>
          </div>
        )}
        {offlineSalesQueue.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>يوجد {offlineSalesQueue.length} فاتورة معلقة في قائمة الانتظار</span>
          </div>
        )}
      </div>

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Revenue */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">إجمالي المبيعات (SDG)</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {loadingStats ? (
              <div className="h-8 w-24 bg-[var(--border-color)]/40 rounded-lg animate-pulse" />
            ) : (
              <span className="text-2xl md:text-3xl font-bold tracking-tight">
                {formatYAxis(totalRevenue)}
              </span>
            )}
            <span className="text-emerald-500 text-xs font-semibold block mt-1">من قاعدة البيانات الحقيقية</span>
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
              {formatYAxis(totalInventoryValue)} <span className="text-xs font-normal">ج.س</span>
            </span>
            <span className="text-[var(--text-secondary)] text-xs block mt-1">إجمالي القطع بالمستودع: {totalStockItems.toLocaleString('en-US')}</span>
          </div>
        </div>

        {/* KPI 3: Near Expiry */}
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

      {/* ── Charts Section ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─ Sales Performance Area Chart ─────────────────── */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">أداء المبيعات والأرباح الحقيقية</h2>
            {loadingStats && (
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {salesChartData.every(d => d.sales === 0) ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-[var(--text-secondary)] text-sm gap-3">
              <BarChart2 className="w-12 h-12 opacity-20" />
              <span>لا توجد مبيعات مسجلة بعد لعرض الرسم البياني</span>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

                  <XAxis
                    dataKey="name"
                    stroke="var(--text-secondary)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={6}
                  />

                  {/* ✅ Formatted Y-axis: 1.2M, 800K, etc. */}
                  <YAxis
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatYAxis}
                    width={52}
                  />

                  <Tooltip content={<CustomAreaTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="المبيعات"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="الأرباح"
                    stroke="#14b8a6"
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />المبيعات
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-teal-400 inline-block rounded" />الأرباح الصافية
            </span>
          </div>
        </div>

        {/* ─ Top Products Horizontal Bar Chart ────────────── */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-400" />
            <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">الأدوية الأكثر توزيعاً</h2>
          </div>

          {loadingStats ? (
            <div className="space-y-3 pt-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-7 rounded-lg bg-[var(--border-color)]/30 animate-pulse" style={{ width: `${90 - i * 12}%` }} />
              ))}
            </div>
          ) : topProductsData.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-[var(--text-secondary)] text-sm gap-3">
              <Pill className="w-10 h-10 opacity-20" />
              <span>لا توجد مبيعات مسجلة بعد</span>
            </div>
          ) : (
            <>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsData}
                    layout="vertical"
                    margin={{ top: 2, right: 8, left: 0, bottom: 2 }}
                    barCategoryGap="18%"
                  >
                    {/* Hidden X axis – we only need relative bar sizes */}
                    <XAxis type="number" hide domain={[0, 'dataMax']} />

                    {/* Hidden Y axis – labels drawn via LabelList inside bar */}
                    <YAxis dataKey="name" type="category" hide width={0} />

                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

                    <Bar dataKey="qty" name="الكمية" radius={[0, 6, 6, 0]} maxBarSize={30}>
                      {topProductsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      {/* ✅ Product name label INSIDE the bar */}
                      <LabelList content={<BarLabel />} dataKey="name" position="insideLeft" />
                      {/* ✅ Quantity label at end of bar */}
                      <LabelList
                        dataKey="qty"
                        position="right"
                        style={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }}
                        formatter={(v: number) => v.toLocaleString('en-US')}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Color legend */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1">
                {topProductsData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] truncate">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── FEFO Expiry Alerts Table ─────────────────────── */}
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
                      <td className="py-3 text-center font-semibold text-[var(--text-primary)]">{b.qty.toLocaleString('en-US')}</td>
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
