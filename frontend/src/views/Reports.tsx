import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import DatePicker from '../components/DatePicker';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Building2, 
  Truck, 
  Calendar, 
  Download, 
  Printer, 
  Search,
  AlertCircle,
  Clock,
  DollarSign,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

type TabType = 'sales' | 'inventory' | 'suppliers' | 'customers' | 'shipping';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search queries for tables
  const [salesSearch, setSalesSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [shippingSearch, setShippingSearch] = useState('');

  // Data states
  const [salesData, setSalesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [supplierData, setSupplierData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [shippingData, setShippingData] = useState<any>(null);

  // Quick Date presets
  const applyPreset = (preset: 'today' | 'week' | 'month' | 'clear') => {
    const today = new Date();
    if (preset === 'today') {
      const yyyyMmDd = today.toISOString().split('T')[0];
      setStartDate(yyyyMmDd);
      setEndDate(yyyyMmDd);
    } else if (preset === 'week') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const fetchTabReports = async () => {
    setLoading(true);
    setError('');
    const params = {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    };

    try {
      if (activeTab === 'sales') {
        const { data } = await apiClient.get('/reports/sales', { params });
        setSalesData(data);
      } else if (activeTab === 'inventory') {
        const { data } = await apiClient.get('/reports/inventory');
        setInventoryData(data);
      } else if (activeTab === 'suppliers') {
        const { data } = await apiClient.get('/reports/suppliers', { params });
        setSupplierData(data);
      } else if (activeTab === 'customers') {
        const { data } = await apiClient.get('/reports/customers', { params });
        setCustomerData(data);
      } else if (activeTab === 'shipping') {
        const { data } = await apiClient.get('/reports/shipping', { params });
        setShippingData(data);
      }
    } catch (err: any) {
      console.error(err);
      setError('فشل جلب البيانات من الخادم، يرجى التأكد من اتصال الشبكة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabReports();
  }, [activeTab, startDate, endDate]);

  // Export to CSV Function
  const exportToCSV = (dataList: any[], filename: string, headers: string[], rowMapper: (item: any) => string[]) => {
    const csvContent = [
      headers.join(','),
      ...dataList.map(item => rowMapper(item).map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable layout trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 text-right print:p-0" dir="rtl">
      <div className="space-y-6 animate-fade-in-slide print:space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">التقارير الذكية ولوحة التحليلات</h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">تحليل مبيعات الأصناف، المخزون، الموردين، الشحن وديون العملاء</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] font-semibold rounded-xl text-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة التقرير</span>
            </button>
          </div>
        </div>

        {/* Global Filters Section */}
        <div className="glass-card p-5 rounded-2xl space-y-4 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-[var(--text-primary)]">تصفية بنطاق التاريخ:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => applyPreset('today')} 
                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-semibold transition-all cursor-pointer"
              >اليوم</button>
              <button 
                onClick={() => applyPreset('week')} 
                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-semibold transition-all cursor-pointer"
              >آخر 7 أيام</button>
              <button 
                onClick={() => applyPreset('month')} 
                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-semibold transition-all cursor-pointer"
              >الشهر الحالي</button>
              <button 
                onClick={() => applyPreset('clear')} 
                className="px-3 py-1.5 rounded-lg text-xs bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-semibold transition-all cursor-pointer"
              >تصفير التصفية</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-secondary)] font-semibold block">تاريخ البدء</label>
              <DatePicker 
                value={startDate} 
                onChange={setStartDate} 
                placeholder="اختر تاريخ البداية" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-secondary)] font-semibold block">تاريخ النهاية</label>
              <DatePicker 
                value={endDate} 
                onChange={setEndDate} 
                placeholder="اختر تاريخ النهاية" 
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-[var(--border-color)] print:hidden">
          {(['sales', 'inventory', 'suppliers', 'customers', 'shipping'] as TabType[]).map((tab) => {
            const labels = {
              sales: '📈 تقارير المبيعات والأصناف',
              inventory: '💊 المخزون الدوائي والصلاحيات',
              suppliers: '🤝 كشوفات الموردين',
              customers: '👥 ديون وحسابات العملاء',
              shipping: '🚚 اللوجستيات والشحن للولايات'
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Error State */}
        {error && (
          <div className="glass-card border-rose-500/30 p-4 rounded-2xl flex items-center gap-3 text-rose-500 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">جاري توليد التقارير وتجميع البيانات الإحصائية...</p>
          </div>
        )}

        {/* Tabs Contents */}
        {!loading && (
          <div className="space-y-6">
            
            {/* 1. SALES TAB CONTENT */}
            {activeTab === 'sales' && salesData && (
              <div className="space-y-6 animate-fade-in-slide">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-emerald-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي المبيعات الإيرادات</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(salesData.summary.totalRevenue || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-teal-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">الأرباح الصافية المحققة</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(salesData.summary.totalProfit || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-blue-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">المحصل النقدي</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(salesData.summary.totalPaid || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-amber-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">المتبقي (ديون مستحقة)</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(salesData.summary.totalUnpaid || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Clock className="w-5 h-5" /></div>
                  </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Monthly Sales Trend Chart */}
                  <div className="glass-card p-5 rounded-2xl lg:col-span-2 space-y-4">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">📈 منحنى مبيعات وأرباح الشركة</h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesData.monthlyTrends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                          <YAxis stroke="var(--text-secondary)" fontSize={11} />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2.5} />
                          <Area type="monotone" dataKey="profit" name="الأرباح" stroke="#14b8a6" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Status distribution Pie chart */}
                  <div className="glass-card p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">📊 توزيع الفواتير حسب حالة الدفع</h3>
                    <div className="h-60 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={salesData.statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {salesData.statusDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-around text-xs font-semibold text-[var(--text-secondary)]">
                      {salesData.statusDistribution.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span>{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sales by Item Table (تقارير المبيعات حسب الصنف) */}
                <div className="glass-card p-5 rounded-2xl space-y-4 text-right">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[var(--text-primary)]">📦 تقارير المبيعات التفصيلية حسب الأصناف والأدوية</h3>
                      <p className="text-xs text-[var(--text-secondary)]">تتبع الكميات المباعة، الإيرادات وصافي الأرباح لكل صنف دوائي</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl w-full sm:w-64">
                        <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                        <input 
                          type="text" 
                          placeholder="ابحث باسم الدواء..." 
                          value={salesSearch}
                          onChange={(e) => setSalesSearch(e.target.value)}
                          className="bg-transparent text-xs outline-none text-[var(--text-primary)] w-full placeholder-[var(--text-secondary)]"
                        />
                      </div>
                      <button 
                        onClick={() => exportToCSV(
                          salesData.itemsSalesReport, 
                          'sales_by_item_report', 
                          ['اسم المنتج', 'الاسم العلمي', 'التصنيف', 'الكمية المباعة', 'الإيرادات', 'أرباح الصنف'],
                          (item) => [item.productName, item.scientificName, item.category, item.qtySold.toString(), item.revenue.toString(), item.profit.toString()]
                        )}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير Excel</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                          <th className="py-3 px-4 font-bold">اسم المنتج / الصنف</th>
                          <th className="py-3 px-4 font-bold">الاسم العلمي</th>
                          <th className="py-3 px-4 font-bold">التصنيف</th>
                          <th className="py-3 px-4 font-bold">الكمية المباعة</th>
                          <th className="py-3 px-4 font-bold">إجمالي الإيرادات</th>
                          <th className="py-3 px-4 font-bold">صافي الأرباح</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]/40 text-xs">
                        {salesData.itemsSalesReport
                          .filter((item: any) => item.productName.toLowerCase().includes(salesSearch.toLowerCase()) || item.scientificName.toLowerCase().includes(salesSearch.toLowerCase()))
                          .map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[var(--border-color)]/20 text-[var(--text-primary)]">
                              <td className="py-3.5 px-4 font-bold">{item.productName}</td>
                              <td className="py-3.5 px-4 text-[var(--text-secondary)] font-mono">{item.scientificName || '-'}</td>
                              <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">{item.category}</span></td>
                              <td className="py-3.5 px-4 font-bold font-mono">{item.qtySold.toLocaleString()} وحدة</td>
                              <td className="py-3.5 px-4 font-mono">{item.revenue.toLocaleString()} SDG</td>
                              <td className="py-3.5 px-4 font-bold font-mono text-emerald-500">{item.profit.toLocaleString()} SDG</td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. INVENTORY TAB CONTENT */}
            {activeTab === 'inventory' && inventoryData && (
              <div className="space-y-6 animate-fade-in-slide">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-emerald-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">القيمة الكلية للمخزون (سعر التكلفة)</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(inventoryData.summary.totalStockValueCost || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-teal-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي القطع في المستودع</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(inventoryData.summary.totalItemsInStock || 0).toLocaleString()} عبوة</h3>
                    </div>
                    <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl"><Package className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-amber-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">منتجات قاربت صلاحيتها للانتهاء</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{inventoryData.summary.nearExpiryCount} تشغيلة</h3>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Clock className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-rose-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">منتجات منتهية الصلاحية تماماً</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{inventoryData.summary.expiredCount} تشغيلة</h3>
                    </div>
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Category Distribution Chart */}
                  <div className="glass-card p-5 rounded-2xl space-y-4">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">📊 توزيع قيمة المخزون حسب الفئات الدوائية</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={inventoryData.categoryDistribution}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={10} />
                          <YAxis stroke="var(--text-secondary)" fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="value" name="القيمة المالية بسعر التكلفة" fill="#10b981" radius={[4, 4, 0, 0]}>
                            {inventoryData.categoryDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Near Expiry Batches List */}
                  <div className="glass-card p-5 rounded-2xl lg:col-span-2 space-y-4 text-right">
                    <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
                      <h3 className="text-base font-bold text-amber-500">⚠️ التشغيلات القريبة من انتهاء الصلاحية (خلال 3 أشهر)</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">{inventoryData.nearExpiryBatches.length} إنذار</span>
                    </div>

                    <div className="overflow-y-auto max-h-60 space-y-2.5">
                      {inventoryData.nearExpiryBatches.length === 0 ? (
                        <div className="text-center py-8 text-xs text-[var(--text-secondary)]">لا توجد تشغيلات مهددة بالانتهاء القريب حالياً.</div>
                      ) : (
                        inventoryData.nearExpiryBatches.map((batch: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-[var(--border-color)]/20 text-xs">
                            <div>
                              <strong className="text-[var(--text-primary)]">{batch.productName}</strong>
                              <div className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">رقم التشغيلة: {batch.batchNumber} | كمية المخزون: {batch.qty} عبوة</div>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold font-mono">ينتهي في: {batch.expiryDate}</span>
                              <span className="block text-[10px] text-amber-500/80 font-bold mt-1">متبقي {batch.daysRemaining} يوم</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Movements */}
                <div className="glass-card p-5 rounded-2xl space-y-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">🔄 سجل حركات المخزون الأخيرة (وارد / صادر)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                          <th className="py-2.5 px-4 font-bold">اسم المنتج</th>
                          <th className="py-2.5 px-4 font-bold">رقم التشغيلة</th>
                          <th className="py-2.5 px-4 font-bold">نوع الحركة</th>
                          <th className="py-2.5 px-4 font-bold">الكمية</th>
                          <th className="py-2.5 px-4 font-bold">سبب التحرك</th>
                          <th className="py-2.5 px-4 font-bold">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                        {inventoryData.movements.map((movement: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[var(--border-color)]/20">
                            <td className="py-3 px-4 font-semibold">{movement.productName}</td>
                            <td className="py-3 px-4 font-mono">{movement.batchNumber}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                movement.typeCode === 'IN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                              }`}>{movement.type}</span>
                            </td>
                            <td className="py-3 px-4 font-bold font-mono">{movement.qty} عبوة</td>
                            <td className="py-3 px-4 text-[var(--text-secondary)]">{movement.reason}</td>
                            <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">{movement.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SUPPLIER TAB CONTENT */}
            {activeTab === 'suppliers' && supplierData && (
              <div className="space-y-6 animate-fade-in-slide">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-emerald-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي المشتريات والطلبيات</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(supplierData.summary.grandTotalPurchases || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-teal-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي المدفوعات المسددة للموردين</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(supplierData.summary.grandTotalPaid || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-rose-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">الديون المستحقة للموردين</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(supplierData.summary.grandTotalDebt || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><TrendingDown className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-blue-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">شركات الموردين المعتمدة</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{supplierData.summary.supplierCount} مورد</h3>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Building2 className="w-5 h-5" /></div>
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl space-y-4 text-right">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[var(--text-primary)]">🤝 كشف حساب الموردين والشركات المصنعة</h3>
                      <p className="text-xs text-[var(--text-secondary)]">مراقبة المشتريات، المبالغ المسددة، والمديونيات القائمة للموردين</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl w-full sm:w-64">
                        <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                        <input 
                          type="text" 
                          placeholder="ابحث باسم الشركة أو المورد..." 
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          className="bg-transparent text-xs outline-none text-[var(--text-primary)] w-full placeholder-[var(--text-secondary)]"
                        />
                      </div>
                      <button 
                        onClick={() => exportToCSV(
                          supplierData.suppliers, 
                          'suppliers_report', 
                          ['اسم المورد', 'الشركة', 'النوع', 'الهاتف', 'إجمالي الطلبيات', 'إجمالي المسدد', 'الديون المتبقية', 'عدد الفواتير'],
                          (s) => [s.name, s.companyName, s.type, s.phone, s.totalPurchases.toString(), s.totalPaid.toString(), s.remainingDebt.toString(), s.orderCount.toString()]
                        )}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير Excel</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                          <th className="py-3 px-4 font-bold">اسم المورد</th>
                          <th className="py-3 px-4 font-bold">الشركة</th>
                          <th className="py-3 px-4 font-bold">نوع المورد</th>
                          <th className="py-3 px-4 font-bold">رقم الهاتف</th>
                          <th className="py-3 px-4 font-bold">عدد الطلبيات</th>
                          <th className="py-3 px-4 font-bold">إجمالي المشتريات</th>
                          <th className="py-3 px-4 font-bold">إجمالي المسدد</th>
                          <th className="py-3 px-4 font-bold">الديون القائمة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                        {supplierData.suppliers
                          .filter((s: any) => s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || s.companyName.toLowerCase().includes(supplierSearch.toLowerCase()))
                          .map((s: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[var(--border-color)]/20">
                              <td className="py-3.5 px-4 font-bold">{s.name}</td>
                              <td className="py-3.5 px-4 text-[var(--text-secondary)]">{s.companyName}</td>
                              <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">{s.type}</span></td>
                              <td className="py-3.5 px-4 font-mono">{s.phone}</td>
                              <td className="py-3.5 px-4 font-bold font-mono">{s.orderCount} طلبية</td>
                              <td className="py-3.5 px-4 font-mono">{s.totalPurchases.toLocaleString()} SDG</td>
                              <td className="py-3.5 px-4 font-mono text-teal-500">{s.totalPaid.toLocaleString()} SDG</td>
                              <td className="py-3.5 px-4 font-bold font-mono text-rose-500">{s.remainingDebt.toLocaleString()} SDG</td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. CUSTOMERS TAB CONTENT */}
            {activeTab === 'customers' && customerData && (
              <div className="space-y-6 animate-fade-in-slide">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-emerald-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي مسحوبات ومبيعات العملاء</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(customerData.summary.grandTotalSales || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-teal-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي المبالغ المحصلة</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(customerData.summary.grandTotalPaid || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-amber-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">ديون العملاء المعلقة</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(customerData.summary.grandTotalDebt || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Clock className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-blue-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">العملاء النشطين المسجلين</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{customerData.summary.customerCount} عميل</h3>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Users className="w-5 h-5" /></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sales by State Bar chart */}
                  <div className="glass-card p-5 rounded-2xl space-y-4">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">📊 الولايات الأكثر سحباً للأدوية (مبيعات الولايات)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={customerData.stateSales}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} />
                          <YAxis stroke="var(--text-secondary)" fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="sales" name="المبيعات الإجمالية" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                            {customerData.stateSales.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Customer Directory Table */}
                  <div className="glass-card p-5 rounded-2xl lg:col-span-2 space-y-4 text-right">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <h3 className="text-base font-bold text-[var(--text-primary)]">👥 ديون العملاء وتجاوزات الحدود الائتمانية</h3>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl w-full sm:w-48">
                          <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                          <input 
                            type="text" 
                            placeholder="ابحث باسم العميل..." 
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="bg-transparent text-xs outline-none text-[var(--text-primary)] w-full placeholder-[var(--text-secondary)]"
                          />
                        </div>
                        <button 
                          onClick={() => exportToCSV(
                            customerData.customers, 
                            'customers_credit_report', 
                            ['العميل', 'النوع', 'الولاية', 'الهاتف', 'إجمالي المسحوبات', 'المدفوع', 'المستحق الحالي', 'سقف الائتمان', 'الاستهلاك الائتماني %'],
                            (c) => [c.name, c.type, c.state, c.phone, c.totalSales.toString(), c.totalPaid.toString(), c.remainingDebt.toString(), c.creditLimit.toString(), `${c.creditUsagePercent}%`]
                          )}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تصدير Excel</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                            <th className="py-2.5 px-3 font-bold">اسم العميل</th>
                            <th className="py-2.5 px-3 font-bold">الولاية</th>
                            <th className="py-2.5 px-3 font-bold">نوع الكيان</th>
                            <th className="py-2.5 px-3 font-bold">المديونية الحالية</th>
                            <th className="py-2.5 px-3 font-bold">سقف الائتمان</th>
                            <th className="py-2.5 px-3 font-bold">نسبة استهلاك السقف</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                          {customerData.customers
                            .filter((c: any) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.state.toLowerCase().includes(customerSearch.toLowerCase()))
                            .map((c: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[var(--border-color)]/20">
                                <td className="py-3 px-3 font-bold">{c.name}</td>
                                <td className="py-3 px-3">{c.state}</td>
                                <td className="py-3 px-3">{c.type}</td>
                                <td className="py-3 px-3 font-bold font-mono text-rose-500">{c.remainingDebt.toLocaleString()} SDG</td>
                                <td className="py-3 px-3 font-mono">{c.creditLimit.toLocaleString()} SDG</td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-full bg-[var(--border-color)] rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${c.creditUsagePercent >= 100 ? 'bg-rose-500' : c.creditUsagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                        style={{ width: `${Math.min(100, c.creditUsagePercent)}%` }} 
                                      />
                                    </div>
                                    <span className="font-bold font-mono text-[10px] w-8">{c.creditUsagePercent}%</span>
                                  </div>
                                </td>
                              </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SHIPPING TAB CONTENT */}
            {activeTab === 'shipping' && shippingData && (
              <div className="space-y-6 animate-fade-in-slide">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-blue-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي الشحنات وأوامر النقل</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{shippingData.summary.totalOrders} شحنة</h3>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Truck className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-emerald-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">شحنات تم تسليمها للعميل</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{shippingData.summary.deliveredCount} شحنة</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-amber-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">شحنات جاري تحضيرها / نقلها</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{shippingData.summary.pendingCount + shippingData.summary.shippedCount} شحنة</h3>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Clock className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-rose-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">شحنات ملغاة / فاشلة</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{shippingData.summary.cancelledCount} شحنة</h3>
                    </div>
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Status distribution chart */}
                  <div className="glass-card p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">📊 توزيع الشحنات حسب الحالة اللوجستية</h3>
                    <div className="h-60 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={shippingData.statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {shippingData.statusDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-around text-xs font-semibold text-[var(--text-secondary)]">
                      {shippingData.statusDistribution.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span>{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Destination states distribution */}
                  <div className="glass-card p-5 rounded-2xl space-y-4">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">📍 توزيع الشحنات جغرافياً حسب ولايات السودان</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={shippingData.stateDistribution}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="state" stroke="var(--text-secondary)" fontSize={10} />
                          <YAxis stroke="var(--text-secondary)" fontSize={10} />
                          <Tooltip />
                          <Bar dataKey="count" name="عدد الشحنات" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                            {shippingData.stateDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Logistics operations list */}
                  <div className="glass-card p-5 rounded-2xl space-y-4 text-right lg:col-span-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <h3 className="text-base font-bold text-[var(--text-primary)]">📦 سجل طلبيات وتفاصيل الشحن والمندوبين</h3>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl w-full sm:w-64">
                          <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                          <input 
                            type="text" 
                            placeholder="ابحث باسم العميل أو السائق أو الولاية..." 
                            value={shippingSearch}
                            onChange={(e) => setShippingSearch(e.target.value)}
                            className="bg-transparent text-xs outline-none text-[var(--text-primary)] w-full placeholder-[var(--text-secondary)]"
                          />
                        </div>
                        <button 
                          onClick={() => exportToCSV(
                            shippingData.orders, 
                            'shipping_logistics_report', 
                            ['رقم الشحنة', 'رقم الفاتورة', 'العميل', 'الولاية', 'المدينة', 'حالة الشحن', 'المندوب / السائق', 'التاريخ'],
                            (o) => [o.id, o.invoiceId, o.customerName, o.state, o.city, o.status, o.driverName, o.date]
                          )}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تصدير Excel</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                            <th className="py-2.5 px-3 font-bold">رقم الشحنة</th>
                            <th className="py-2.5 px-3 font-bold">رقم الفاتورة</th>
                            <th className="py-2.5 px-3 font-bold">العميل المستلم</th>
                            <th className="py-2.5 px-3 font-bold">الوجهة (الولاية والمدينة)</th>
                            <th className="py-2.5 px-3 font-bold">حالة الشحن</th>
                            <th className="py-2.5 px-3 font-bold">المندوب / السائق</th>
                            <th className="py-2.5 px-3 font-bold">تاريخ الإرسال</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                          {shippingData.orders
                            .filter((o: any) => o.customerName.toLowerCase().includes(shippingSearch.toLowerCase()) || o.driverName.toLowerCase().includes(shippingSearch.toLowerCase()) || o.state.toLowerCase().includes(shippingSearch.toLowerCase()))
                            .map((o: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[var(--border-color)]/20">
                                <td className="py-3 px-3 font-mono font-bold text-[var(--text-secondary)]">{o.id}</td>
                                <td className="py-3 px-3 font-mono font-bold">{o.invoiceId}</td>
                                <td className="py-3 px-3 font-bold">{o.customerName}</td>
                                <td className="py-3 px-3">{o.state} - {o.city}</td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    o.statusCode === 'DELIVERED' 
                                      ? 'bg-emerald-500/10 text-emerald-500' 
                                      : o.statusCode === 'SHIPPED' 
                                      ? 'bg-blue-500/10 text-blue-500'
                                      : o.statusCode === 'PENDING'
                                      ? 'bg-amber-500/10 text-amber-500'
                                      : 'bg-rose-500/10 text-rose-500'
                                  }`}>{o.status}</span>
                                </td>
                                <td className="py-3 px-3 font-bold">{o.driverName}</td>
                                <td className="py-3 px-3 font-mono text-[var(--text-secondary)]">{o.date}</td>
                              </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
