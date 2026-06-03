import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import DatePicker from '../components/DatePicker';
import { useSalesStore } from '../store/useSalesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
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

type TabType = 'sales' | 'inventory' | 'suppliers' | 'customers' | 'shipping' | 'representatives' | 'profits';

export default function Reports() {
  const { settings, fetchSettings } = useSettingsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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
  const [repSearch, setRepSearch] = useState('');

  // Selected Rep for detailed operations report
  const [selectedRep, setSelectedRep] = useState<any>(null);
  const setSelectedInvoiceIdForDetails = useSalesStore((state) => state.setSelectedInvoiceIdForDetails);

  // Sub-tabs inside the representatives view
  const [repSubTab, setRepSubTab] = useState<'performance' | 'operations'>('performance');

  // Searchable representative dropdown states
  const [repDropdownOpen, setRepDropdownOpen] = useState(false);
  const [repFilterSearch, setRepFilterSearch] = useState('');

  // Data states
  const [salesData, setSalesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [supplierData, setSupplierData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [shippingData, setShippingData] = useState<any>(null);
  const [profitsData, setProfitsData] = useState<any>(null);

  // Customer/Supplier statement states
  const [customerStatementData, setCustomerStatementData] = useState<any>(null);
  const [supplierStatementData, setSupplierStatementData] = useState<any>(null);
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<string>('');
  const [selectedSupplierForStatement, setSelectedSupplierForStatement] = useState<string>('');
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementError, setStatementError] = useState<string>('');
  const [loadingStatementId, setLoadingStatementId] = useState<string>('');

  // Pagination states for all report tables
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize, setSalesPageSize] = useState(10);

  const [repSalesPage, setRepSalesPage] = useState(1);
  const [repSalesPageSize, setRepSalesPageSize] = useState(10);

  const [repOpsPage, setRepOpsPage] = useState(1);
  const [repOpsPageSize, setRepOpsPageSize] = useState(10);

  const [invPage, setInvPage] = useState(1);
  const [invPageSize, setInvPageSize] = useState(10);

  const [supPage, setSupPage] = useState(1);
  const [supPageSize, setSupPageSize] = useState(10);

  const [custPage, setCustPage] = useState(1);
  const [custPageSize, setCustPageSize] = useState(10);

  const [shipPage, setShipPage] = useState(1);
  const [shipPageSize, setShipPageSize] = useState(10);

  const [profitProdPage, setProfitProdPage] = useState(1);
  const [profitProdPageSize, setProfitProdPageSize] = useState(10);

  const [profitInvPage, setProfitInvPage] = useState(1);
  const [profitInvPageSize, setProfitInvPageSize] = useState(10);

  const [profitCustPage, setProfitCustPage] = useState(1);
  const [profitCustPageSize, setProfitCustPageSize] = useState(10);

  const [profitCatPage, setProfitCatPage] = useState(1);
  const [profitCatPageSize, setProfitCatPageSize] = useState(10);


  // Profits sub-tab
  const [profitsSubTab, setProfitsSubTab] = useState<'byProduct' | 'byInvoice' | 'byCustomer' | 'byCategory'>('byProduct');

  // Compile all sales across all representatives
  const allSales = !salesData ? [] : (salesData.representativesSalesReport || []).reduce((acc: any[], r: any) => {
    return [...acc, ...(r.sales || []).map((s: any) => ({ ...s, repName: r.name, commissionRate: r.commissionRate }))];
  }, []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
      if (activeTab === 'sales' || activeTab === 'representatives') {
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
      } else if (activeTab === 'profits') {
        const { data } = await apiClient.get('/reports/profits', { params });
        setProfitsData(data);
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

  // Sync selected rep details when report data is reloaded
  useEffect(() => {
    if (activeTab === 'representatives' && salesData && selectedRep) {
      const updatedRep = salesData.representativesSalesReport.find((r: any) => r.id === selectedRep.id);
      if (updatedRep) {
        setSelectedRep(updatedRep);
      }
    }
  }, [salesData, activeTab]);

  // Statements scroll logic not needed anymore


  // Premium RTL Pagination Component
  const renderPagination = (
    currentPage: number,
    pageSize: number,
    totalItems: number,
    onPageChange: (page: number) => void,
    onPageSizeChange: (size: number) => void
  ) => {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (totalItems === 0) return null;

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-[var(--border-color)]/60 text-xs text-[var(--text-secondary)] select-none">
        <div className="flex items-center gap-2">
          <span>عدد السجلات:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1 outline-none text-[var(--text-primary)] cursor-pointer text-xs"
          >
            <option value={10}>10 records</option>
            <option value={20}>20 records</option>
            <option value={50}>50 records</option>
            <option value={100}>100 records</option>
          </select>
          <span className="mr-2">
            عرض {Math.min(totalItems, (currentPage - 1) * pageSize + 1)} - {Math.min(totalItems, currentPage * pageSize)} من {totalItems} سجل
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-2 py-1 rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-color)]/30 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer font-bold"
          >
            السابق
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, idx, arr) => {
              const showEllipsis = idx > 0 && arr[idx - 1] !== p - 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="px-1">...</span>}
                  <button
                    onClick={() => onPageChange(p)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg font-bold transition-all cursor-pointer ${
                      currentPage === p
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10'
                        : 'border border-[var(--border-color)] hover:bg-[var(--border-color)]/30 text-[var(--text-primary)]'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}
          
          <button
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-2 py-1 rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-color)]/30 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer font-bold"
          >
            التالي
          </button>
        </div>
      </div>
    );
  };

  // Open statement in new premium printable window
  const openCustomerStatementWindow = (statementData: any) => {
    const companyName = settings?.name || "المثنى للأدوية";
    const companyPhone = settings?.phone || "غير محدد";
    const companyAddress = settings?.address || "السودان";
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    const rowsHTML = (statementData.entries || []).map((entry: any, idx: number) => {
      const formattedDescription = entry.description.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, (match: string) => `#${match.slice(0, 8)}`);
      return `
        <tr>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${entry.date}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formattedDescription}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #ef4444; font-family: monospace;">${entry.debit > 0 ? entry.debit.toLocaleString() + ' SDG' : '-'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #10b981; font-family: monospace;">${entry.credit > 0 ? entry.credit.toLocaleString() + ' SDG' : '-'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-family: monospace; background-color: #f8fafc;">${entry.balance.toLocaleString()} SDG</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>كشف حساب عميل - ${statementData.customer.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
    * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
    body { background: #fff; color: #1e293b; line-height: 1.5; padding: 0; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
    .company h1 { font-size: 24px; color: #065f46; margin: 0 0 4px 0; font-weight: 800; }
    .company p { font-size: 11px; color: #475569; margin: 0; }
    .title h2 { font-size: 20px; color: #059669; margin: 0; font-weight: 700; text-align: left; }
    .title p { font-size: 11px; color: #64748b; margin-top: 2px; text-align: left; }
    
    .info-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px; background: #f8fafc; font-size: 12px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .info-item { display: flex; gap: 6px; }
    .info-item span { color: #64748b; }
    .info-item strong { color: #0f172a; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background-color: #059669; color: white; padding: 10px 8px; border: 1px solid #059669; font-size: 12px; font-weight: 700; text-align: center; }
    td { font-size: 12px; padding: 10px 8px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    
    .totals-box { margin-top: 20px; border: 2px solid #059669; border-radius: 12px; padding: 16px; background: #ecfdf5; font-size: 13px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
    .final-balance { font-size: 16px; color: #065f46; font-weight: 800; }
    
    .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
    .stamp { border: 2px dashed #cbd5e1; border-radius: 6px; padding: 6px 16px; font-size: 12px; font-weight: 700; color: #059669; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>${companyName}</h1>
      <p>🏢 ${companyAddress} &nbsp;|&nbsp; 📞 هاتف: ${companyPhone}</p>
    </div>
    <div class="title">
      <h2>كشف حساب عميل مفصل</h2>
      <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>
    </div>
  </div>

  <div class="info-box">
    <div class="info-item"><span>اسم العميل:</span> <strong>${statementData.customer.name}</strong></div>
    <div class="info-item"><span>نوع الكيان:</span> <strong>${statementData.customer.type || 'عميل'}</strong></div>
    <div class="info-item"><span>الولاية:</span> <strong>${statementData.customer.state || '-'}</strong></div>
    <div class="info-item"><span>الهاتف:</span> <strong>${statementData.customer.phone || '-'}</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 120px;">التاريخ</th>
        <th>البيان</th>
        <th style="width: 130px;">له (مدين)</th>
        <th style="width: 130px;">عليه (دائن)</th>
        <th style="width: 150px;">الرصيد</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>

  <div class="totals-box">
    <div>إجمالي المدين: <span style="color: #ef4444; font-family: monospace;">${(statementData.summary?.totalDebit || 0).toLocaleString()} SDG</span></div>
    <div>إجمالي الدائن: <span style="color: #10b981; font-family: monospace;">${(statementData.summary?.totalCredit || 0).toLocaleString()} SDG</span></div>
    <div class="final-balance">الرصيد النهائي (المستحق): ${(statementData.summary?.finalBalance || 0).toLocaleString()} SDG</div>
  </div>

  <div class="footer">
    <div>تم توليد كشف الحساب تلقائياً عبر نظام المثنى للأدوية ERP.</div>
    <div class="stamp">توقيع وختم الإدارة</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
        window.onafterprint = function() { window.close(); };
      }, 500);
    };
  </script>
</body>
</html>
    `);
    printWindow.document.close();
  };

  const openSupplierStatementWindow = (statementData: any) => {
    const companyName = settings?.name || "المثنى للأدوية";
    const companyPhone = settings?.phone || "غير محدد";
    const companyAddress = settings?.address || "السودان";
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    const rowsHTML = (statementData.entries || []).map((entry: any, idx: number) => {
      const formattedDescription = entry.description.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, (match: string) => `#${match.slice(0, 8)}`);
      return `
        <tr>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${entry.date}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formattedDescription}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #ef4444; font-family: monospace;">${entry.debit > 0 ? entry.debit.toLocaleString() + ' SDG' : '-'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #10b981; font-family: monospace;">${entry.credit > 0 ? entry.credit.toLocaleString() + ' SDG' : '-'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-family: monospace; background-color: #f8fafc;">${entry.balance.toLocaleString()} SDG</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>كشف حساب مورد - ${statementData.supplier.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
    * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
    body { background: #fff; color: #1e293b; line-height: 1.5; padding: 0; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d97706; padding-bottom: 12px; margin-bottom: 20px; }
    .company h1 { font-size: 24px; color: #b45309; margin: 0 0 4px 0; font-weight: 800; }
    .company p { font-size: 11px; color: #475569; margin: 0; }
    .title h2 { font-size: 20px; color: #d97706; margin: 0; font-weight: 700; text-align: left; }
    .title p { font-size: 11px; color: #64748b; margin-top: 2px; text-align: left; }
    
    .info-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px; background: #f8fafc; font-size: 12px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .info-item { display: flex; gap: 6px; }
    .info-item span { color: #64748b; }
    .info-item strong { color: #0f172a; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background-color: #d97706; color: white; padding: 10px 8px; border: 1px solid #d97706; font-size: 12px; font-weight: 700; text-align: center; }
    td { font-size: 12px; padding: 10px 8px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    
    .totals-box { margin-top: 20px; border: 2px solid #d97706; border-radius: 12px; padding: 16px; background: #fffbeb; font-size: 13px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
    .final-balance { font-size: 16px; color: #b45309; font-weight: 800; }
    
    .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
    .stamp { border: 2px dashed #cbd5e1; border-radius: 6px; padding: 6px 16px; font-size: 12px; font-weight: 700; color: #d97706; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>${companyName}</h1>
      <p>🏢 ${companyAddress} &nbsp;|&nbsp; 📞 هاتف: ${companyPhone}</p>
    </div>
    <div class="title">
      <h2>كشف حساب مورد مفصل</h2>
      <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>
    </div>
  </div>

  <div class="info-box">
    <div class="info-item"><span>اسم المورد:</span> <strong>${statementData.supplier.name}</strong></div>
    <div class="info-item"><span>الشركة:</span> <strong>${statementData.supplier.companyName || '-'}</strong></div>
    <div class="info-item"><span>نوع المورد:</span> <strong>${statementData.supplier.type || 'مورد'}</strong></div>
    <div class="info-item"><span>رقم الهاتف:</span> <strong>${statementData.supplier.phone || '-'}</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 120px;">التاريخ</th>
        <th>البيان</th>
        <th style="width: 130px;">له (مدين)</th>
        <th style="width: 130px;">عليه (دائن)</th>
        <th style="width: 150px;">الرصيد</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>

  <div class="totals-box">
    <div>إجمالي المدين: <span style="color: #ef4444; font-family: monospace;">${(statementData.summary?.totalDebit || 0).toLocaleString()} SDG</span></div>
    <div>إجمالي الدائن: <span style="color: #10b981; font-family: monospace;">${(statementData.summary?.totalCredit || 0).toLocaleString()} SDG</span></div>
    <div class="final-balance">الرصيد النهائي: ${(statementData.summary?.finalBalance || 0).toLocaleString()} SDG</div>
  </div>

  <div class="footer">
    <div>تم توليد كشف الحساب تلقائياً عبر نظام المثنى للأدوية ERP.</div>
    <div class="stamp">توقيع وختم الإدارة</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
        window.onafterprint = function() { window.close(); };
      }, 500);
    };
  </script>
</body>
</html>
    `);
    printWindow.document.close();
  };

  // Reset pages to 1 when search filters change
  useEffect(() => { setSalesPage(1); }, [salesSearch]);
  useEffect(() => { setRepSalesPage(1); }, [repSearch]);
  useEffect(() => { setSupPage(1); }, [supplierSearch]);
  useEffect(() => { setCustPage(1); }, [customerSearch]);
  useEffect(() => { setShipPage(1); }, [shippingSearch]);
  useEffect(() => { setProfitProdPage(1); }, [startDate, endDate, profitsSubTab]);
  useEffect(() => { setProfitInvPage(1); }, [startDate, endDate, profitsSubTab]);
  useEffect(() => { setProfitCustPage(1); }, [startDate, endDate, profitsSubTab]);
  useEffect(() => { setProfitCatPage(1); }, [startDate, endDate, profitsSubTab]);


  // Premium Excel XML Exporter (Supports RTL direction, proper headers and columns format)
  const exportToExcelXML = (dataList: any[], filename: string, headers: string[], rowMapper: (item: any) => string[], title: string, subtitle: string) => {
    const colDefs = headers.map(() => '<Column ss:Width="130" ss:AutoFitWidth="1" />').join('\n');
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n' +
      '<?mso-application progid="Excel.Sheet"?>\n' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n' +
      ' xmlns:o="urn:schemas-microsoft-com:office:office"\n' +
      ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n' +
      ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n' +
      ' xmlns:html="http://www.w3.org/TR/REC-html40">\n' +
      ' <Styles>\n' +
      '  <Style ss:ID="Default" ss:Name="Normal">\n' +
      '   <Alignment ss:Vertical="Bottom"/>\n' +
      '   <Borders/>\n' +
      '   <Font ss:FontName="Calibri" x:CharSet="178" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>\n' +
      '   <Interior/>\n' +
      '   <NumberFormat/>\n' +
      '   <Protection/>\n' +
      '  </Style>\n' +
      '  <Style ss:ID="CompanyHeader">\n' +
      '   <Font ss:FontName="Calibri" ss:Size="18" ss:Color="#059669" ss:Bold="1"/>\n' +
      '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n' +
      '  </Style>\n' +
      '  <Style ss:ID="Title">\n' +
      '   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#1f2937" ss:Bold="1"/>\n' +
      '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n' +
      '  </Style>\n' +
      '  <Style ss:ID="Subtitle">\n' +
      '   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#4b5563" ss:Italic="1"/>\n' +
      '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n' +
      '  </Style>\n' +
      '  <Style ss:ID="Header">\n' +
      '   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>\n' +
      '   <Interior ss:Color="#059669" ss:Pattern="Solid"/>\n' +
      '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n' +
      '  </Style>\n' +
      '  <Style ss:ID="Cell">\n' +
      '   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>\n' +
      '  </Style>\n' +
      ' </Styles>\n' +
      '  <Worksheet ss:Name="Sheet1">\n' +
      '   <Table>\n' +
      colDefs + '\n';

    // Company Name
    const companyName = settings?.name || "المثنى للأدوية";
    const companyAddress = settings?.address || "";
    const companyPhone = settings?.phone || "";
    let contactInfo = "";
    if (companyAddress) contactInfo += "العنوان: " + companyAddress;
    if (companyPhone) contactInfo += (contactInfo ? " | " : "") + "الهاتف: " + companyPhone;

    xml += '   <Row ss:Height="35">\n';
    xml += '    <Cell ss:MergeAcross="' + (headers.length - 1) + '" ss:StyleID="CompanyHeader"><Data ss:Type="String">' + companyName + '</Data></Cell>\n';
    xml += '   </Row>\n';

    if (contactInfo) {
      xml += '   <Row ss:Height="20">\n';
      xml += '    <Cell ss:MergeAcross="' + (headers.length - 1) + '" ss:StyleID="Subtitle"><Data ss:Type="String">' + contactInfo + '</Data></Cell>\n';
      xml += '   </Row>\n';
    }

    // Title
    xml += '   <Row ss:Height="25">\n';
    xml += '    <Cell ss:MergeAcross="' + (headers.length - 1) + '" ss:StyleID="Title"><Data ss:Type="String">' + title + '</Data></Cell>\n';
    xml += '   </Row>\n';

    // Subtitle / Info
    xml += '   <Row ss:Height="20">\n';
    xml += '    <Cell ss:MergeAcross="' + (headers.length - 1) + '" ss:StyleID="Subtitle"><Data ss:Type="String">' + subtitle + '</Data></Cell>\n';
    xml += '   </Row>\n';

    // Empty space
    xml += '   <Row ss:Height="15"></Row>\n';

    // Headers
    xml += '   <Row ss:Height="25">\n';
    headers.forEach(h => {
      xml += '    <Cell ss:StyleID="Header"><Data ss:Type="String">' + h + '</Data></Cell>\n';
    });
    xml += '   </Row>\n';

    // Rows
    dataList.forEach(item => {
      xml += '   <Row ss:Height="20">\n';
      rowMapper(item).forEach(val => {
        // Check if value is numeric for formatting
        const cleanVal = val.replace(/,/g, '').replace(/ SDG/g, '').replace(/%/g, '').trim();
        const isNum = !isNaN(Number(cleanVal)) && cleanVal !== '';
        const type = isNum ? 'Number' : 'String';
        xml += '    <Cell ss:StyleID="Cell"><Data ss:Type="' + type + '">' + cleanVal + '</Data></Cell>\n';
      });
      xml += '   </Row>\n';
    });

    xml += '  </Table>\n' +
      '  <x:WorksheetOptions>\n' +
      '   <x:DisplayRightToLeft/>\n' +
      '  </x:WorksheetOptions>\n' +
      ' </Worksheet>\n' +
      '</Workbook>';

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  // Premium PDF Exporter Utility
  const exportPDFGeneral = (
    dataList: any[],
    title: string,
    headers: string[],
    rowMapper: (item: any) => string[],
    filename: string
  ) => {
    const companyName = settings?.name || "المثنى للأدوية";
    const companyPhone = settings?.phone || "غير محدد";
    const companyAddress = settings?.address || "السودان";
    
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    const rowsHTML = dataList.map((item, idx) => {
      const cols = rowMapper(item);
      return `
        <tr>
          <td style="text-align: center; padding: 6px; border: 1px solid #ddd;">${idx + 1}</td>
          ${cols.map((col, cIdx) => {
            const isFirst = cIdx === 0;
            return `<td style="padding: 6px; border: 1px solid #ddd; text-align: ${isFirst ? 'right' : 'center'}; font-weight: ${isFirst ? 'bold' : 'normal'};">${col}</td>`;
          }).join('')}
        </tr>
      `;
    }).join('');

    const headerHTML = headers.map(h => `<th style="background-color: #059669; color: white; padding: 8px 6px; border: 1px solid #059669; font-size: 12px;">${h}</th>`).join('');

    printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <style>
    @page { 
      size: A4 landscape; 
      margin: 15mm 12mm 15mm 12mm; 
    }
    * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
    body { background: #fff; color: #1e293b; line-height: 1.4; padding: 0; margin: 0; }
    
    table.print-layout {
      width: 100%;
      border-collapse: collapse;
      border: none !important;
    }
    table.print-layout > thead > tr > td,
    table.print-layout > tbody > tr > td,
    table.print-layout > tfoot > tr > td {
      border: none !important;
      padding: 0 !important;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #059669;
      padding-bottom: 12px;
      margin-bottom: 15px;
    }
    .company-details h1 { font-size: 22px; color: #065f46; margin: 0 0 4px 0; font-weight: 800; }
    .company-details p { font-size: 11px; color: #475569; margin: 0; }
    .doc-title { text-align: left; }
    .doc-title h2 { font-size: 18px; color: #059669; margin: 0; font-weight: 700; }
    .doc-title p { font-size: 11px; color: #64748b; margin-top: 2px; }
    
    .meta-bar { 
      background: #f8fafc; 
      border: 1px solid #e2e8f0; 
      border-radius: 8px; 
      padding: 10px 14px; 
      margin-bottom: 15px; 
      font-size: 11px; 
      display: flex; 
      justify-content: space-between; 
    }
    .meta-bar span { color: #64748b; }
    .meta-bar strong { color: #0f172a; }

    table.data-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 20px; 
    }
    table.data-table th { 
      background-color: #059669; 
      color: white; 
      padding: 8px 6px; 
      border: 1px solid #059669; 
      font-size: 12px; 
      font-weight: 700;
      text-align: center;
    }
    table.data-table td { 
      font-size: 11px; 
      border: 1px solid #e2e8f0; 
      padding: 6px;
    }
    table.data-table tr:nth-child(even) { background: #f8fafc; }
    
    .footer-section { 
      border-top: 2px dashed #e2e8f0; 
      padding-top: 10px; 
      display: flex; 
      justify-content: space-between; 
      font-size: 10px; 
      color: #64748b; 
      margin-top: 15px;
    }
    .stamp { 
      border: 2px dashed #cbd5e1; 
      border-radius: 6px; 
      padding: 4px 12px; 
      font-size: 11px; 
      font-weight: 700; 
      color: #059669; 
    }
    
    @media print { 
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
    }
  </style>
</head>
<body>
  <table class="print-layout">
    <thead>
      <tr>
        <td>
          <div class="header-section">
            <div class="company-details">
              <h1>${companyName}</h1>
              <p>🏢 ${companyAddress} &nbsp;|&nbsp; 📞 هاتف: ${companyPhone}</p>
            </div>
            <div class="doc-title">
              <h2>${title}</h2>
              <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>
            </div>
          </div>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="meta-bar">
            <div><span>تقرير مالي موثق لشركة:</span> <strong>${companyName}</strong></div>
            <div><span>عدد السجلات المطبوعة:</span> <strong>${dataList.length} سجل</strong></div>
            <div><span>المسؤول:</span> <strong>${user?.name || "مدير النظام"}</strong></div>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px; background-color: #059669; color: white; border: 1px solid #059669;">#</th>
                ${headerHTML}
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td>
          <div class="footer-section">
            <div>شكراً لتعاملكم مع <strong>${companyName}</strong> - تم توليد المستند تلقائياً عبر نظام ERP.</div>
            <div class="stamp">توقيع وختم الإدارة</div>
          </div>
        </td>
      </tr>
    </tfoot>
  </table>

  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
        window.onafterprint = function() {
          window.close();
        };
      }, 500);
    };
  </script>
</body>
</html>
    `);
    printWindow.document.close();
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


        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 border-b border-[var(--border-color)] print:hidden scrollbar-none flex-nowrap" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {(['sales', 'profits', 'representatives', 'inventory', 'suppliers', 'customers', 'shipping'] as TabType[]).map((tab) => {
            const labels = {
              sales: '📈 تقارير المبيعات والأصناف',
              profits: '💰 تقارير الأرباح',
              representatives: '💼 تقارير وعمولات المناديب',
              inventory: '💊 المخزون الدوائي والصلاحيات',
              suppliers: '🤝 كشوفات الموردين',
              customers: '👥 ديون وحسابات العملاء',
              shipping: '🚚 اللوجستيات والشحن للولايات'
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]'
                }`}
                style={{ flexShrink: 0 }}
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
                {/* Local Date Filters for Sales */}
                <div className="glass-card p-4 rounded-2xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/30 print:hidden animate-fade-in-slide space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">📅 تصفية تقرير المبيعات بنطاق التاريخ:</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      <button 
                        onClick={() => applyPreset('today')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >اليوم</button>
                      <button 
                        onClick={() => applyPreset('week')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >آخر 7 أيام</button>
                      <button 
                        onClick={() => applyPreset('month')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >الشهر الحالي</button>
                      <button 
                        onClick={() => applyPreset('clear')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition-all cursor-pointer"
                      >تصفير التصفية</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-secondary)] font-semibold block">تاريخ البدء</label>
                      <DatePicker 
                        value={startDate} 
                        onChange={setStartDate} 
                        placeholder="اختر تاريخ البداية" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-secondary)] font-semibold block">تاريخ النهاية</label>
                      <DatePicker 
                        value={endDate} 
                        onChange={setEndDate} 
                        placeholder="اختر تاريخ النهاية" 
                      />
                    </div>
                  </div>
                </div>

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-indigo-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">عمولات المناديب المستحقة</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(salesData.summary.totalRepresentativeCommissions || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl"><Users className="w-5 h-5" /></div>
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
                        onClick={() => exportToExcelXML(
                          salesData.itemsSalesReport, 
                          'sales_by_item_report', 
                          ['اسم المنتج', 'الاسم العلمي', 'التصنيف', 'الكمية المباعة', 'الإيرادات', 'أرباح الصنف'],
                          (item) => [item.productName, item.scientificName || '-', item.category || '-', item.qtySold.toString(), item.revenue.toString(), item.profit.toString()],
                          'تقرير مبيعات الأصناف التفصيلي',
                          `إجمالي الإيرادات: ${salesData.summary.totalRevenue.toLocaleString()} SDG | إجمالي الأرباح: ${salesData.summary.totalProfit.toLocaleString()} SDG`
                        )}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير Excel</span>
                      </button>
                      <button 
                        onClick={() => exportPDFGeneral(
                          salesData.itemsSalesReport.filter((item: any) => item.productName.toLowerCase().includes(salesSearch.toLowerCase()) || item.scientificName.toLowerCase().includes(salesSearch.toLowerCase())),
                          'تقرير مبيعات الأصناف التفصيلي',
                          ['اسم المنتج', 'الاسم العلمي', 'التصنيف', 'الكمية المباعة', 'إجمالي الإيرادات', 'صافي الأرباح'],
                          (item) => [item.productName, item.scientificName || '-', item.category || '-', `${item.qtySold} وحدة`, `${item.revenue.toLocaleString()} SDG`, `${item.profit.toLocaleString()} SDG`],
                          'sales_by_item_report'
                        )}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>تصدير PDF</span>
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
                        {(() => {
                          const filtered = salesData.itemsSalesReport.filter((item: any) => item.productName.toLowerCase().includes(salesSearch.toLowerCase()) || item.scientificName.toLowerCase().includes(salesSearch.toLowerCase()));
                          const paginated = filtered.slice((salesPage - 1) * salesPageSize, salesPage * salesPageSize);
                          return paginated.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[var(--border-color)]/20 text-[var(--text-primary)]">
                              <td className="py-3.5 px-4 font-bold">{item.productName}</td>
                              <td className="py-3.5 px-4 text-[var(--text-secondary)] font-mono">{item.scientificName || '-'}</td>
                              <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">{item.category}</span></td>
                              <td className="py-3.5 px-4 font-bold font-mono">{item.qtySold.toLocaleString()} وحدة</td>
                              <td className="py-3.5 px-4 font-mono">{item.revenue.toLocaleString()} SDG</td>
                              <td className="py-3.5 px-4 font-bold font-mono text-emerald-500">{item.profit.toLocaleString()} SDG</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    const filteredCount = salesData.itemsSalesReport.filter((item: any) => item.productName.toLowerCase().includes(salesSearch.toLowerCase()) || item.scientificName.toLowerCase().includes(salesSearch.toLowerCase())).length;
                    return renderPagination(salesPage, salesPageSize, filteredCount, setSalesPage, setSalesPageSize);
                  })()}
                </div>


              </div>
            )}

            {/* 1.5. REPRESENTATIVES TAB CONTENT */}
            {activeTab === 'representatives' && salesData && (
              <div className="space-y-6 animate-fade-in-slide print:hidden">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-emerald-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي مبيعات المناديب</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">
                        {(salesData.representativesSalesReport || []).reduce((sum: number, r: any) => sum + r.totalSales, 0).toLocaleString()} SDG
                      </h3>
                    </div>
                    <div className="p-3 bg-emerald-50/10 text-emerald-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-indigo-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي العمولات المستحقة</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(salesData.summary.totalRepresentativeCommissions || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-indigo-50/10 text-indigo-500 rounded-xl"><Users className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-blue-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">عدد المناديب النشطين</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{salesData.representativesSalesReport?.length || 0} مندوب</h3>
                    </div>
                    <div className="p-3 bg-blue-50/10 text-blue-500 rounded-xl"><Users className="w-5 h-5" /></div>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-amber-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">المندوب الأعلى مبيعات</span>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {salesData.representativesSalesReport?.[0]?.name || 'غير محدد'}
                      </h3>
                      <p className="text-[10px] font-semibold text-[var(--text-secondary)]">
                        بمبيعات: {(salesData.representativesSalesReport?.[0]?.totalSales || 0).toLocaleString()} SDG
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50/10 text-amber-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  </div>
                </div>

                {/* Sub-tabs Navigation */}
                <div className="flex gap-2 border-b border-[var(--border-color)] pb-px">
                  <button
                    onClick={() => setRepSubTab('performance')}
                    className={`pb-2.5 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
                      repSubTab === 'performance'
                        ? 'border-emerald-500 text-emerald-500'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    👥 أداء وعمولات المناديب
                  </button>
                  <button
                    onClick={() => setRepSubTab('operations')}
                    className={`pb-2.5 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
                      repSubTab === 'operations'
                        ? 'border-emerald-500 text-emerald-500'
                        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    📝 سجل فواتير وعمولات العمليات التفصيلي {selectedRep ? `(${selectedRep.name})` : '(كافة المناديب)'}
                  </button>
                </div>

                {/* Local Filters for Representatives */}
                <div className="glass-card p-4 rounded-2xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/30 print:hidden animate-fade-in-slide flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-50">
                  {/* Left Side: Rep Select Dropdown */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">👤 اختيار المندوب:</span>
                    </div>
                    {/* Searchable Dropdown */}
                    <div className="relative z-30">
                      <button
                        type="button"
                        onClick={() => setRepDropdownOpen(!repDropdownOpen)}
                        className="flex items-center justify-between gap-2 bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] font-bold border border-[var(--border-color)] px-4 py-2 rounded-xl outline-none cursor-pointer hover:border-emerald-500 transition-colors w-64 text-right"
                      >
                        <span>{selectedRep ? `👤 ${selectedRep.name}` : '📁 كافة مناديب المبيعات'}</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">▼</span>
                      </button>

                      {repDropdownOpen && (
                        <>
                          {/* Backdrop */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => { setRepDropdownOpen(false); setRepFilterSearch(''); }}
                          />
                          
                          {/* Search dropdown list */}
                          <div className="absolute right-0 mt-1.5 w-64 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 p-2 space-y-2 animate-fade-in-slide">
                            <input
                              type="text"
                              placeholder="ابحث باسم المندوب..."
                              value={repFilterSearch}
                              onChange={(e) => setRepFilterSearch(e.target.value)}
                              className="w-full bg-[var(--bg-primary)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] px-2.5 py-1.5 rounded-lg outline-none placeholder-[var(--text-secondary)]"
                              autoFocus
                            />
                            
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRep(null);
                                  setRepDropdownOpen(false);
                                  setRepFilterSearch('');
                                }}
                                className={`w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  !selectedRep ? 'bg-emerald-500/10 text-emerald-500' : 'text-[var(--text-primary)] hover:bg-[var(--border-color)]/30'
                                }`}
                              >
                                📁 كافة مناديب المبيعات (تقرير شامل)
                              </button>

                              {salesData.representativesSalesReport
                                ?.filter((rep: any) => rep.name.toLowerCase().includes(repFilterSearch.toLowerCase()))
                                .map((rep: any, idx: number) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setSelectedRep(rep);
                                      setRepDropdownOpen(false);
                                      setRepFilterSearch('');
                                      setRepSubTab('operations');
                                    }}
                                    className={`w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      selectedRep?.id === rep.id ? 'bg-emerald-500/10 text-emerald-500' : 'text-[var(--text-primary)] hover:bg-[var(--border-color)]/30'
                                    }`}
                                  >
                                    👤 {rep.name}
                                  </button>
                                ))
                              }
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Compact Date Filters in the Same Row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">📅 التصفية بالتاريخ:</span>
                    </div>
                    
                    {/* Presets */}
                    <div className="flex flex-wrap gap-1">
                      <button 
                        onClick={() => applyPreset('today')} 
                        className="px-2 py-1 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >اليوم</button>
                      <button 
                        onClick={() => applyPreset('week')} 
                        className="px-2 py-1 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >آخر 7 أيام</button>
                      <button 
                        onClick={() => applyPreset('month')} 
                        className="px-2 py-1 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >الشهر</button>
                      <button 
                        onClick={() => applyPreset('clear')} 
                        className="px-2 py-1 rounded-lg text-[10px] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition-all cursor-pointer"
                      >تصفير</button>
                    </div>

                    <div className="w-px h-6 bg-[var(--border-color)] hidden sm:block" />

                    {/* Date Pickers */}
                    <div className="flex items-center gap-1.5">
                      <DatePicker 
                        value={startDate} 
                        onChange={setStartDate} 
                        placeholder="تاريخ البدء" 
                      />
                      <span className="text-[10px] text-[var(--text-secondary)] font-bold">إلى</span>
                      <DatePicker 
                        value={endDate} 
                        onChange={setEndDate} 
                        placeholder="تاريخ النهاية" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Representatives List (Table) - FULL WIDTH */}
                  {repSubTab === 'performance' && (
                    <div className="glass-card p-5 rounded-2xl space-y-4 text-right animate-fade-in-slide">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-[var(--text-primary)]">👥 جدول أداء وعمولات مناديب المبيعات</h3>
                          <p className="text-xs text-[var(--text-secondary)]">اضغط على أي مندوب في الجدول أدناه لتصفية سجل العمليات والفواتير عليه، أو تصفح التقرير الشامل</p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl w-full sm:w-56">
                            <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                            <input 
                              type="text" 
                              placeholder="ابحث باسم المندوب..." 
                              value={repSearch}
                              onChange={(e) => setRepSearch(e.target.value)}
                              className="bg-transparent text-xs outline-none text-[var(--text-primary)] w-full placeholder-[var(--text-secondary)]"
                            />
                          </div>
                          <button 
                            onClick={() => exportToExcelXML(
                              salesData.representativesSalesReport || [], 
                              'representatives_performance_report', 
                              ['اسم المندوب', 'رقم الهاتف', 'نسبة العمولة %', 'عدد الفواتير', 'إجمالي المبيعات', 'المبالغ المحصلة', 'العمولة المستحقة'],
                              (rep) => [rep.name, rep.phone || '-', `${rep.commissionRate}%`, rep.salesCount.toString(), rep.totalSales.toString(), rep.totalPaid.toString(), rep.totalCommission.toString()],
                              'تقرير الأداء العام والعمولات لمناديب المبيعات',
                              `عدد المناديب الإجمالي: ${salesData.representativesSalesReport?.length || 0} | إجمالي المبيعات: ${salesData.representativesSalesReport?.reduce((s: number, r: any) => s + r.totalSales, 0).toLocaleString()} SDG`
                            )}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تصدير القائمة (Excel)</span>
                          </button>
                          <button 
                            onClick={() => exportPDFGeneral(
                              salesData.representativesSalesReport.filter((rep: any) => rep.name.toLowerCase().includes(repSearch.toLowerCase())),
                              'تقرير الأداء العام والعمولات لمناديب المبيعات',
                              ['اسم المندوب', 'رقم الهاتف', 'نسبة العمولة', 'عدد الفواتير', 'إجمالي المبيعات', 'المبالغ المحصّلة', 'العمولة المستحقة'],
                              (rep) => [rep.name, rep.phone || '-', `${rep.commissionRate}%`, `${rep.salesCount} فاتورة`, `${rep.totalSales.toLocaleString()} SDG`, `${rep.totalPaid.toLocaleString()} SDG`, `${rep.totalCommission.toLocaleString()} SDG`],
                              'representatives_performance_report'
                            )}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>تصدير PDF</span>
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                              <th className="py-3 px-4 font-bold">اسم المندوب</th>
                              <th className="py-3 px-4 font-bold">رقم الهاتف</th>
                              <th className="py-3 px-4 font-bold">العمولة %</th>
                              <th className="py-3 px-4 font-bold">عدد فواتير البيع</th>
                              <th className="py-3 px-4 font-bold">إجمالي المبيعات</th>
                              <th className="py-3 px-4 font-bold">المحصل الفعلي</th>
                              <th className="py-3 px-4 font-bold">العمولة المستحقة</th>
                              <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-color)]/40">
                            {(!salesData.representativesSalesReport || salesData.representativesSalesReport.length === 0) ? (
                              <tr>
                                <td colSpan={8} className="py-8 text-center text-[var(--text-secondary)]">لا توجد مبيعات مسجلة باسم أي مندوب حالياً.</td>
                              </tr>
                            ) : (
                              (() => {
                                const filtered = (salesData.representativesSalesReport || []).filter((rep: any) => rep.name.toLowerCase().includes(repSearch.toLowerCase()));
                                const paginated = filtered.slice((repSalesPage - 1) * repSalesPageSize, repSalesPage * repSalesPageSize);
                                return paginated.map((rep: any, idx: number) => (
                                  <tr 
                                    key={idx} 
                                    onClick={() => { setSelectedRep(rep); setRepSubTab('operations'); }}
                                    className={`hover:bg-[var(--border-color)]/20 cursor-pointer text-[var(--text-primary)] transition-all ${
                                      selectedRep?.id === rep.id ? 'bg-emerald-500/10 border-r-4 border-r-emerald-500 font-semibold' : ''
                                    }`}
                                  >
                                    <td className="py-3.5 px-4 font-bold">{rep.name}</td>
                                    <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)]">{rep.phone || '-'}</td>
                                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold">{rep.commissionRate}%</span></td>
                                    <td className="py-3.5 px-4 font-mono">{rep.salesCount.toLocaleString()} عملية</td>
                                    <td className="py-3.5 px-4 font-mono">{rep.totalSales.toLocaleString()} SDG</td>
                                    <td className="py-3.5 px-4 font-mono text-blue-500">{rep.totalPaid.toLocaleString()} SDG</td>
                                    <td className="py-3.5 px-4 font-bold font-mono text-emerald-500">{rep.totalCommission.toLocaleString()} SDG</td>
                                    <td className="py-3.5 px-4 text-center">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedRep(rep); setRepSubTab('operations'); }}
                                        className="px-3 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer animate-pulse-subtle"
                                      >
                                        تصفية فواتيره ({rep.salesCount})
                                      </button>
                                    </td>
                                  </tr>
                                ));
                              })()
                            )}
                          </tbody>
                        </table>
                      </div>
                      {(() => {
                        const filteredCount = (salesData.representativesSalesReport || []).filter((rep: any) => rep.name.toLowerCase().includes(repSearch.toLowerCase())).length;
                        return renderPagination(repSalesPage, repSalesPageSize, filteredCount, setRepSalesPage, setRepSalesPageSize);
                      })()}
                    </div>
                  )}

                  {/* Comprehensive Financial Operations Table - FULL WIDTH */}
                  {repSubTab === 'operations' && (
                    <div className="glass-card p-5 rounded-2xl space-y-5 text-right border border-emerald-500/10 animate-fade-in-slide">
                      {/* Header Details */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)]/60 pb-3">
                        <div>
                          {selectedRep && (
                            <button 
                              onClick={() => setSelectedRep(null)} 
                              className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1 font-bold mb-2 cursor-pointer"
                            >
                              <span>🗂️ إلغاء التصفية (عرض عمليات كافة المناديب)</span>
                            </button>
                          )}
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block">
                            {selectedRep ? 'كشف حساب عمليات المندوب المفصل' : 'التقرير المالي والعمليات الشامل'}
                          </span>
                          <h3 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                            {selectedRep ? `سجل فواتير المندوب: ${selectedRep.name}` : 'سجل فواتير وعمولات كافة مناديب المبيعات'}
                          </h3>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {selectedRep ? `رقم الهاتف: ${selectedRep.phone || '-'}` : `إجمالي الفواتير النشطة: ${allSales.length} فاتورة`}
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                          {/* Summary Pill Panel */}
                          <div className="flex gap-2 text-xs">
                            <div className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
                              <span className="text-[9px] text-[var(--text-secondary)] block">إجمالي مبيعات الفلتر</span>
                              <strong className="font-mono text-[var(--text-primary)]">
                                {selectedRep 
                                  ? selectedRep.totalSales.toLocaleString() 
                                  : allSales.reduce((s: number, sa: any) => s + sa.total, 0).toLocaleString()
                                } SDG
                              </strong>
                            </div>
                            <div className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
                              <span className="text-[9px] text-[var(--text-secondary)] block">إجمالي عمولات الفلتر</span>
                              <strong className="font-mono text-emerald-500">
                                {selectedRep 
                                  ? selectedRep.totalCommission.toLocaleString() 
                                  : salesData.summary.totalRepresentativeCommissions.toLocaleString()
                                } SDG
                              </strong>
                            </div>
                          </div>

                          {/* Export & Print Options */}
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button 
                              onClick={() => {
                                const targetSales = selectedRep ? selectedRep.sales : allSales;
                                const fileName = selectedRep ? `operations_${selectedRep.name}` : 'operations_all_representatives';
                                const sheetTitle = selectedRep ? `كشف حساب عمليات المندوب: ${selectedRep.name}` : 'كشف حساب عمليات كافة مناديب المبيعات';
                                const sheetSubtitle = selectedRep 
                                  ? `رقم المندوب: ${selectedRep.phone || '-'} | عمولته: ${selectedRep.commissionRate}% | المبيعات: ${selectedRep.totalSales.toLocaleString()} SDG | العمولة المستحقة: ${selectedRep.totalCommission.toLocaleString()} SDG`
                                  : `عدد المناديب الإجمالي: ${salesData.representativesSalesReport?.length || 0} | مبيعاتهم الكلية: ${allSales.reduce((s: number, sa: any) => s + sa.total, 0).toLocaleString()} SDG | العمولات المستحقة: ${salesData.summary.totalRepresentativeCommissions.toLocaleString()} SDG`;

                                exportToExcelXML(
                                  targetSales, 
                                  fileName, 
                                  selectedRep 
                                    ? ['رقم الفاتورة', 'تاريخ الفاتورة', 'اسم العميل', 'إجمالي الفاتورة', 'المحصل الفعلي', 'العمولة المحتسبة', 'حالة السداد']
                                    : ['رقم الفاتورة', 'تاريخ الفاتورة', 'المندوب', 'العميل', 'إجمالي الفاتورة', 'المحصل الفعلي', 'عمولة المندوب', 'حالة السداد'],
                                  (s) => selectedRep 
                                    ? [s.id.slice(0, 8), s.createdAt.split('T')[0], s.customerName, s.total.toString(), s.paid.toString(), s.commission.toString(), s.status]
                                    : [s.id.slice(0, 8), s.createdAt.split('T')[0], s.repName || '-', s.customerName, s.total.toString(), s.paid.toString(), s.commission.toString(), s.status],
                                  sheetTitle,
                                  sheetSubtitle
                                );
                              }}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>تصدير كشف الحساب (Excel)</span>
                            </button>
                            <button 
                              onClick={handlePrint}
                              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] font-bold rounded-xl text-xs transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>طباعة كشف الحساب</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Operations Table */}
                      <div className="space-y-2">
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                                <th className="py-2.5 px-3 font-bold">رقم الفاتورة</th>
                                <th className="py-2.5 px-3 font-bold">تاريخ الفاتورة</th>
                                {!selectedRep && <th className="py-2.5 px-3 font-bold">👤 المندوب</th>}
                                <th className="py-2.5 px-3 font-bold">🤝 العميل</th>
                                <th className="py-2.5 px-3 font-bold">إجمالي الفاتورة</th>
                                <th className="py-2.5 px-3 font-bold">المحصل الفعلي</th>
                                <th className="py-2.5 px-3 font-bold">العمولة المحتسبة</th>
                                <th className="py-2.5 px-3 font-bold">الحالة</th>
                                <th className="py-2.5 px-3 font-bold text-center">إجراءات</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                              {(() => {
                                const targetSales = selectedRep ? selectedRep.sales : allSales;
                                const paginated = targetSales.slice((repOpsPage - 1) * repOpsPageSize, repOpsPage * repOpsPageSize);
                                
                                if (paginated.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={selectedRep ? 8 : 9} className="py-12 text-center text-[var(--text-secondary)]">
                                        لا توجد فواتير أو عمليات مسجلة تحت هذا الفلتر حالياً.
                                      </td>
                                    </tr>
                                  );
                                }
                                
                                return paginated.map((sale: any, index: number) => (
                                  <tr key={index} className="hover:bg-[var(--border-color)]/20 transition-colors">
                                    <td className="py-3 px-3 font-mono font-bold text-[var(--text-secondary)]">#{sale.id.slice(0, 8)}</td>
                                    <td className="py-3 px-3 font-mono">{sale.createdAt.split('T')[0]}</td>
                                    {!selectedRep && (
                                      <td className="py-3 px-3 font-bold">
                                        {sale.repName} <span className="text-[10px] text-[var(--text-secondary)] font-normal font-mono">({sale.commissionRate}%)</span>
                                      </td>
                                    )}
                                    <td className="py-3 px-3 font-bold">{sale.customerName}</td>
                                    <td className="py-3 px-3 font-mono">{sale.total.toLocaleString()} SDG</td>
                                    <td className="py-3 px-3 font-mono text-blue-500 font-semibold">{sale.paid.toLocaleString()} SDG</td>
                                    <td className="py-3 px-3 font-mono font-bold text-emerald-500">{sale.commission.toLocaleString()} SDG</td>
                                    <td className="py-3 px-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        sale.status === 'PAID' 
                                          ? 'bg-emerald-500/10 text-emerald-500' 
                                          : sale.status === 'PARTIAL' 
                                          ? 'bg-amber-500/10 text-amber-500'
                                          : 'bg-rose-500/10 text-rose-500'
                                      }`}>{sale.status === 'PAID' ? 'مدفوعة' : sale.status === 'PARTIAL' ? 'جزئية' : 'معلقة'}</span>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                      <button
                                        onClick={() => setSelectedInvoiceIdForDetails(sale.id)}
                                        className="px-2.5 py-1.5 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                      >
                                        عرض الفاتورة 🔗
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              })()}
                            </tbody>
                          </table>
                        </div>
                        {(() => {
                          const targetSales = selectedRep ? selectedRep.sales : allSales;
                          return renderPagination(repOpsPage, repOpsPageSize, targetSales.length, setRepOpsPage, setRepOpsPageSize);
                        })()}
                      </div>
                    </div>
                  )}
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">🔄 سجل حركات المخزون الأخيرة (وارد / صادر)</h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => exportToExcelXML(
                          inventoryData.movements, 
                          'stock_movements_report', 
                          ['اسم المنتج', 'رقم التشغيلة', 'نوع الحركة', 'الكمية', 'سبب التحرك', 'التاريخ'],
                          (m) => [m.productName, m.batchNumber, m.type, m.qty.toString(), m.reason, m.date],
                          'تقرير تتبع وحركات المخزون الدوائي',
                          `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`
                        )}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير Excel</span>
                      </button>
                      <button 
                        onClick={() => exportPDFGeneral(
                          inventoryData.movements,
                          'تقرير تتبع وحركات المخزون الدوائي',
                          ['اسم المنتج', 'رقم التشغيلة', 'نوع الحركة', 'الكمية', 'سبب التحرك', 'التاريخ'],
                          (m) => [m.productName, m.batchNumber, m.type, `${m.qty} عبوة`, m.reason, m.date],
                          'stock_movements_report'
                        )}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>تصدير PDF</span>
                      </button>
                    </div>
                  </div>
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
                        {(() => {
                          const paginated = (inventoryData.movements || []).slice((invPage - 1) * invPageSize, invPage * invPageSize);
                          return paginated.map((movement: any, idx: number) => (
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
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination(invPage, invPageSize, (inventoryData.movements || []).length, setInvPage, setInvPageSize)}
                </div>
              </div>
            )}

            {/* 3. SUPPLIER TAB CONTENT */}
            {activeTab === 'suppliers' && supplierData && (
              <div className="space-y-6 animate-fade-in-slide">
                {/* Local Date Filters for Suppliers */}
                <div className="glass-card p-4 rounded-2xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/30 print:hidden animate-fade-in-slide space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">📅 تصفية كشوفات الموردين بنطاق التاريخ:</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      <button 
                        onClick={() => applyPreset('today')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >اليوم</button>
                      <button 
                        onClick={() => applyPreset('week')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >آخر 7 أيام</button>
                      <button 
                        onClick={() => applyPreset('month')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >الشهر الحالي</button>
                      <button 
                        onClick={() => applyPreset('clear')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition-all cursor-pointer"
                      >تصفير التصفية</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-secondary)] font-semibold block">تاريخ البدء</label>
                      <DatePicker 
                        value={startDate} 
                        onChange={setStartDate} 
                        placeholder="اختر تاريخ البداية" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-secondary)] font-semibold block">تاريخ النهاية</label>
                      <DatePicker 
                        value={endDate} 
                        onChange={setEndDate} 
                        placeholder="اختر تاريخ النهاية" 
                      />
                    </div>
                  </div>
                </div>
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
                        onClick={() => exportToExcelXML(
                          supplierData.suppliers, 
                          'suppliers_report', 
                          ['اسم المورد', 'الشركة', 'النوع', 'الهاتف', 'إجمالي الطلبيات', 'إجمالي المسدد', 'الديون المتبقية', 'عدد الفواتير'],
                          (s) => [s.name, s.companyName || '-', s.type === 'pharma_company' ? 'شركة أدوية' : 'مورد آخر', s.phone, s.totalPurchases.toString(), s.totalPaid.toString(), s.remainingDebt.toString(), s.orderCount.toString()],
                          'تقرير معاملات وكشوفات الموردين المالي',
                          `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`
                        )}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير Excel</span>
                      </button>
                      <button 
                        onClick={() => exportPDFGeneral(
                          supplierData.suppliers.filter((s: any) => s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || (s.companyName || '').toLowerCase().includes(supplierSearch.toLowerCase())),
                          'تقرير معاملات وكشوفات الموردين المالي',
                          ['اسم المورد', 'الشركة', 'النوع', 'الهاتف', 'إجمالي الطلبيات', 'إجمالي المسدد', 'الديون المتبقية', 'عدد الفواتير'],
                          (s) => [s.name, s.companyName || '-', s.type === 'pharma_company' ? 'شركة أدوية' : 'مورد آخر', s.phone, `${s.totalPurchases.toLocaleString()} SDG`, `${s.totalPaid.toLocaleString()} SDG`, `${s.remainingDebt.toLocaleString()} SDG`, `${s.orderCount} فاتورة`],
                          'suppliers_report'
                        )}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>تصدير PDF</span>
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
                          <th className="py-3 px-4 font-bold">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                        {(() => {
                          const filtered = supplierData.suppliers.filter((s: any) => s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || s.companyName.toLowerCase().includes(supplierSearch.toLowerCase()));
                          const paginated = filtered.slice((supPage - 1) * supPageSize, supPage * supPageSize);
                          return paginated.map((s: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[var(--border-color)]/20">
                              <td className="py-3.5 px-4 font-bold">{s.name}</td>
                              <td className="py-3.5 px-4 text-[var(--text-secondary)]">{s.companyName}</td>
                              <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">{s.type}</span></td>
                              <td className="py-3.5 px-4 font-mono">{s.phone}</td>
                              <td className="py-3.5 px-4 font-bold font-mono">{s.orderCount} طلبية</td>
                              <td className="py-3.5 px-4 font-mono">{s.totalPurchases.toLocaleString()} SDG</td>
                              <td className="py-3.5 px-4 font-mono text-teal-500">{s.totalPaid.toLocaleString()} SDG</td>
                              <td className="py-3.5 px-4 font-bold font-mono text-rose-500">{s.remainingDebt.toLocaleString()} SDG</td>
                              <td className="py-3.5 px-4">
                                <button
                                  disabled={loadingStatementId !== ''}
                                  onClick={async () => {
                                    setLoadingStatementId(s.id);
                                    try {
                                      const params: any = {};
                                      if (startDate) params.startDate = startDate;
                                      if (endDate) params.endDate = endDate;
                                      const { data } = await apiClient.get(`/reports/supplier-statement/${s.id}`, { params });
                                      openSupplierStatementWindow(data);
                                    } catch (e) {
                                      console.error(e);
                                      alert('فشل تحميل كشف حساب المورد. يرجى المحاولة مرة أخرى.');
                                    } finally {
                                      setLoadingStatementId('');
                                    }
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>{loadingStatementId === s.id ? 'جاري التحميل...' : 'كشف حساب'}</span>
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    const filteredCount = supplierData.suppliers.filter((s: any) => s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || s.companyName.toLowerCase().includes(supplierSearch.toLowerCase())).length;
                    return renderPagination(supPage, supPageSize, filteredCount, setSupPage, setSupPageSize);
                  })()}
                </div>
              </div>
            )}

            {/* 4. CUSTOMERS TAB CONTENT */}
            {activeTab === 'customers' && customerData && (
              <div className="space-y-6 animate-fade-in-slide">
                {/* Local Date Filters for Customers */}
                <div className="glass-card p-4 rounded-2xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/30 print:hidden animate-fade-in-slide space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">📅 تصفية ديون وحسابات العملاء بنطاق التاريخ:</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      <button 
                        onClick={() => applyPreset('today')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >اليوم</button>
                      <button 
                        onClick={() => applyPreset('week')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >آخر 7 أيام</button>
                      <button 
                        onClick={() => applyPreset('month')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >الشهر الحالي</button>
                      <button 
                        onClick={() => applyPreset('clear')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition-all cursor-pointer"
                      >تصفير التصفية</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-secondary)] font-semibold block">تاريخ البدء</label>
                      <DatePicker 
                        value={startDate} 
                        onChange={setStartDate} 
                        placeholder="اختر تاريخ البداية" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-secondary)] font-semibold block">تاريخ النهاية</label>
                      <DatePicker 
                        value={endDate} 
                        onChange={setEndDate} 
                        placeholder="اختر تاريخ النهاية" 
                      />
                    </div>
                  </div>
                </div>
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
                          onClick={() => exportToExcelXML(
                            customerData.customers, 
                            'customers_credit_report', 
                            ['العميل', 'النوع', 'الولاية', 'الهاتف', 'إجمالي المسحوبات', 'المدفوع', 'المستحق الحالي', 'سقف الائتمان', 'الاستهلاك الائتماني %'],
                            (c) => [c.name, c.type, c.state, c.phone, c.totalSales.toString(), c.totalPaid.toString(), c.remainingDebt.toString(), c.creditLimit.toString(), `${c.creditUsagePercent}%`],
                            'تقرير ديون العملاء وسقوفات الائتمان',
                            `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`
                          )}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تصدير Excel</span>
                        </button>
                        <button 
                          onClick={() => exportPDFGeneral(
                            customerData.customers.filter((c: any) => c.name.toLowerCase().includes(customerSearch.toLowerCase())),
                            'تقرير ديون العملاء وسقوفات الائتمان',
                            ['العميل', 'النوع', 'الولاية', 'الهاتف', 'إجمالي المسحوبات', 'المدفوع', 'المستحق الحالي', 'سقف الائتمان', 'الاستهلاك الائتماني'],
                            (c) => [c.name, c.type, c.state, c.phone, `${c.totalSales.toLocaleString()} SDG`, `${c.totalPaid.toLocaleString()} SDG`, `${c.remainingDebt.toLocaleString()} SDG`, `${c.creditLimit.toLocaleString()} SDG`, `${c.creditUsagePercent}%`],
                            'customers_credit_report'
                          )}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>تصدير PDF</span>
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
                            <th className="py-2.5 px-3 font-bold">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                          {(() => {
                            const filtered = customerData.customers.filter((c: any) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.state.toLowerCase().includes(customerSearch.toLowerCase()));
                            const paginated = filtered.slice((custPage - 1) * custPageSize, custPage * custPageSize);
                            return paginated.map((c: any, idx: number) => (
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
                                <td className="py-3 px-3">
                                  <button
                                    disabled={loadingStatementId !== ''}
                                    onClick={async () => {
                                      setLoadingStatementId(c.id);
                                      try {
                                        const params: any = {};
                                        if (startDate) params.startDate = startDate;
                                        if (endDate) params.endDate = endDate;
                                        const { data } = await apiClient.get(`/reports/customer-statement/${c.id}`, { params });
                                        openCustomerStatementWindow(data);
                                      } catch (e) {
                                        console.error(e);
                                        alert('فشل تحميل كشف حساب العميل. يرجى المحاولة مرة أخرى.');
                                      } finally {
                                        setLoadingStatementId('');
                                      }
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>{loadingStatementId === c.id ? 'جاري التحميل...' : 'كشف حساب'}</span>
                                  </button>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    {(() => {
                      const filteredCount = customerData.customers.filter((c: any) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.state.toLowerCase().includes(customerSearch.toLowerCase())).length;
                      return renderPagination(custPage, custPageSize, filteredCount, setCustPage, setCustPageSize);
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* 5. SHIPPING TAB CONTENT */}
            {activeTab === 'shipping' && shippingData && (
              <div className="space-y-6 animate-fade-in-slide">
                {/* Local Date Filters for Shipping */}
                <div className="glass-card p-4 rounded-2xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/30 print:hidden animate-fade-in-slide space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">📅 تصفية اللوجستيات والشحن بنطاق التاريخ:</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      <button 
                        onClick={() => applyPreset('today')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >اليوم</button>
                      <button 
                        onClick={() => applyPreset('week')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >آخر 7 أيام</button>
                      <button 
                        onClick={() => applyPreset('month')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer"
                      >الشهر الحالي</button>
                      <button 
                        onClick={() => applyPreset('clear')} 
                        className="px-2.5 py-1.5 rounded-lg text-[10px] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition-all cursor-pointer"
                      >تصفير التصفية</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-secondary)] font-semibold block">تاريخ البدء</label>
                      <DatePicker 
                        value={startDate} 
                        onChange={setStartDate} 
                        placeholder="اختر تاريخ البداية" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-secondary)] font-semibold block">تاريخ النهاية</label>
                      <DatePicker 
                        value={endDate} 
                        onChange={setEndDate} 
                        placeholder="اختر تاريخ النهاية" 
                      />
                    </div>
                  </div>
                </div>
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
                          onClick={() => exportToExcelXML(
                            shippingData.orders, 
                            'shipping_logistics_report', 
                            ['رقم الشحنة', 'رقم الفاتورة', 'العميل', 'الولاية', 'المدينة', 'حالة الشحن', 'المندوب / السائق', 'التاريخ'],
                            (o) => [o.id, o.invoiceId, o.customerName, o.state, o.city, o.status, o.driverName || '-', o.date],
                            'تقرير اللوجستيات وحالات شحن الولايات',
                            `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`
                          )}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تصدير Excel</span>
                        </button>
                        <button 
                          onClick={() => exportPDFGeneral(
                            shippingData.orders.filter((o: any) => o.customerName.toLowerCase().includes(shippingSearch.toLowerCase()) || o.driverName.toLowerCase().includes(shippingSearch.toLowerCase()) || o.state.toLowerCase().includes(shippingSearch.toLowerCase())),
                            'تقرير اللوجستيات وحالات شحن الولايات',
                            ['رقم الشحنة', 'رقم الفاتورة', 'العميل', 'الوجهة', 'حالة الشحن', 'المندوب / السائق', 'التاريخ'],
                            (o) => [o.id, o.invoiceId, o.customerName, `${o.state} - ${o.city}`, o.status, o.driverName || '-', o.date],
                            'shipping_logistics_report'
                          )}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer w-full sm:w-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>تصدير PDF</span>
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
                          {(() => {
                            const filtered = shippingData.orders.filter((o: any) => 
                              o.customerName.toLowerCase().includes(shippingSearch.toLowerCase()) || 
                              o.driverName.toLowerCase().includes(shippingSearch.toLowerCase()) || 
                              o.state.toLowerCase().includes(shippingSearch.toLowerCase())
                            );
                            const paginated = filtered.slice((shipPage - 1) * shipPageSize, shipPage * shipPageSize);
                            return paginated.map((o: any, idx: number) => (
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
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    {(() => {
                      const filteredCount = shippingData.orders.filter((o: any) => 
                        o.customerName.toLowerCase().includes(shippingSearch.toLowerCase()) || 
                        o.driverName.toLowerCase().includes(shippingSearch.toLowerCase()) || 
                        o.state.toLowerCase().includes(shippingSearch.toLowerCase())
                      ).length;
                      return renderPagination(shipPage, shipPageSize, filteredCount, setShipPage, setShipPageSize);
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* 6. PROFITS TAB CONTENT */}
            {activeTab === 'profits' && profitsData && (
              <div className="space-y-6 animate-fade-in-slide">
                {/* Date Filters for Profits */}
                <div className="glass-card p-4 rounded-2xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/30 print:hidden animate-fade-in-slide space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">📅 تصفية تقرير الأرباح بنطاق التاريخ:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => applyPreset('today')} className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer">اليوم</button>
                      <button onClick={() => applyPreset('week')} className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer">آخر 7 أيام</button>
                      <button onClick={() => applyPreset('month')} className="px-2.5 py-1.5 rounded-lg text-[10px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold transition-all cursor-pointer">الشهر الحالي</button>
                      <button onClick={() => applyPreset('clear')} className="px-2.5 py-1.5 rounded-lg text-[10px] bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white font-bold transition-all cursor-pointer">تصفير التصفية</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-secondary)] font-semibold block">تاريخ البدء</label>
                      <DatePicker value={startDate} onChange={setStartDate} placeholder="اختر تاريخ البداية" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-secondary)] font-semibold block">تاريخ النهاية</label>
                      <DatePicker value={endDate} onChange={setEndDate} placeholder="اختر تاريخ النهاية" />
                    </div>
                  </div>
                </div>

                {/* Profits Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-emerald-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي الإيرادات</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(profitsData.summary.totalRevenue || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  </div>
                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-blue-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">إجمالي التكلفة</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{(profitsData.summary.totalCost || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                  </div>
                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-teal-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">صافي الأرباح</span>
                      <h3 className="text-xl font-bold font-mono text-emerald-500">{(profitsData.summary.totalProfit || 0).toLocaleString()} SDG</h3>
                    </div>
                    <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  </div>
                  <div className="glass-card p-5 rounded-2xl border-r-4 border-r-amber-500 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">هامش الربح %</span>
                      <h3 className="text-xl font-bold font-mono text-[var(--text-primary)]">{profitsData.summary.margin || 0}%</h3>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><BarChart3 className="w-5 h-5" /></div>
                  </div>
                </div>

                {/* Profits Sub-tabs */}
                <div className="flex gap-2 border-b border-[var(--border-color)] pb-px">
                  {([
                    { key: 'byProduct', label: '📦 الأرباح حسب الصنف' },
                    { key: 'byInvoice', label: '🧾 الأرباح حسب الفاتورة' },
                    { key: 'byCustomer', label: '👤 الأرباح حسب العميل' },
                    { key: 'byCategory', label: '🏷️ الأرباح حسب التصنيف' },
                  ] as { key: typeof profitsSubTab; label: string }[]).map((st) => (
                    <button
                      key={st.key}
                      onClick={() => setProfitsSubTab(st.key)}
                      className={`pb-2.5 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
                        profitsSubTab === st.key
                          ? 'border-emerald-500 text-emerald-500'
                          : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Profits by Product */}
                {profitsSubTab === 'byProduct' && (
                  <div className="glass-card p-5 rounded-2xl space-y-4 text-right animate-fade-in-slide">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-[var(--text-primary)]">📦 تقرير الأرباح حسب الصنف الدوائي</h3>
                        <p className="text-xs text-[var(--text-secondary)]">تحليل الإيرادات والتكلفة والأرباح لكل صنف دوائي</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => exportToExcelXML(
                            profitsData.profitsByProduct, 'profits_by_product',
                            ['اسم الصنف', 'الكمية', 'الإيرادات', 'التكلفة', 'صافي الربح'],
                            (item: any) => [item.productName, item.qty.toString(), item.revenue.toString(), item.cost.toString(), item.profit.toString()],
                            'تقرير الأرباح حسب الصنف', `صافي الأرباح الكلي: ${profitsData.summary.totalProfit.toLocaleString()} SDG`
                          )}
                          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                        ><Download className="w-3.5 h-3.5" /><span>تصدير Excel</span></button>
                        <button 
                          onClick={() => exportPDFGeneral(
                            profitsData.profitsByProduct, 'تقرير الأرباح حسب الصنف',
                            ['اسم الصنف', 'الكمية المباعة', 'الإيرادات', 'التكلفة', 'صافي الربح'],
                            (item: any) => [item.productName, `${item.qty} وحدة`, `${item.revenue.toLocaleString()} SDG`, `${item.cost.toLocaleString()} SDG`, `${item.profit.toLocaleString()} SDG`],
                            'profits_by_product'
                          )}
                          className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                        ><Printer className="w-3.5 h-3.5" /><span>تصدير PDF</span></button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                            <th className="py-3 px-4 font-bold">#</th>
                            <th className="py-3 px-4 font-bold">اسم الصنف</th>
                            <th className="py-3 px-4 font-bold">الكمية المباعة</th>
                            <th className="py-3 px-4 font-bold">إجمالي الإيرادات</th>
                            <th className="py-3 px-4 font-bold">إجمالي التكلفة</th>
                            <th className="py-3 px-4 font-bold">صافي الربح</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                          {(() => {
                            const data = profitsData.profitsByProduct || [];
                            const paginated = data.slice((profitProdPage - 1) * profitProdPageSize, profitProdPage * profitProdPageSize);
                            return paginated.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[var(--border-color)]/20">
                                <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">{(profitProdPage - 1) * profitProdPageSize + idx + 1}</td>
                                <td className="py-3 px-4 font-bold">{item.productName}</td>
                                <td className="py-3 px-4 font-mono">{item.qty.toLocaleString()} وحدة</td>
                                <td className="py-3 px-4 font-mono">{item.revenue.toLocaleString()} SDG</td>
                                <td className="py-3 px-4 font-mono text-rose-500">{item.cost.toLocaleString()} SDG</td>
                                <td className="py-3 px-4 font-bold font-mono text-emerald-500">{item.profit.toLocaleString()} SDG</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination(profitProdPage, profitProdPageSize, (profitsData.profitsByProduct || []).length, setProfitProdPage, setProfitProdPageSize)}
                  </div>
                )}

                {/* Profits by Invoice */}
                {profitsSubTab === 'byInvoice' && (
                  <div className="glass-card p-5 rounded-2xl space-y-4 text-right animate-fade-in-slide">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-[var(--text-primary)]">🧾 تقرير الأرباح حسب رقم الفاتورة</h3>
                        <p className="text-xs text-[var(--text-secondary)]">عرض الأرباح المحققة من كل فاتورة</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => exportToExcelXML(
                            profitsData.profitsByInvoice, 'profits_by_invoice',
                            ['رقم الفاتورة', 'التاريخ', 'العميل', 'الإيرادات', 'التكلفة', 'صافي الربح'],
                            (item: any) => [item.invoiceId, item.date, item.customerName, item.revenue.toString(), item.cost.toString(), item.profit.toString()],
                            'تقرير الأرباح حسب الفاتورة', `صافي الأرباح الكلي: ${profitsData.summary.totalProfit.toLocaleString()} SDG`
                          )}
                          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                        ><Download className="w-3.5 h-3.5" /><span>تصدير Excel</span></button>
                        <button 
                          onClick={() => exportPDFGeneral(
                            profitsData.profitsByInvoice, 'تقرير الأرباح حسب الفاتورة',
                            ['رقم الفاتورة', 'التاريخ', 'العميل', 'الإيرادات', 'التكلفة', 'صافي الربح'],
                            (item: any) => [item.invoiceId, item.date, item.customerName, `${item.revenue.toLocaleString()} SDG`, `${item.cost.toLocaleString()} SDG`, `${item.profit.toLocaleString()} SDG`],
                            'profits_by_invoice'
                          )}
                          className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                        ><Printer className="w-3.5 h-3.5" /><span>تصدير PDF</span></button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                            <th className="py-3 px-4 font-bold">#</th>
                            <th className="py-3 px-4 font-bold">رقم الفاتورة</th>
                            <th className="py-3 px-4 font-bold">التاريخ</th>
                            <th className="py-3 px-4 font-bold">العميل</th>
                            <th className="py-3 px-4 font-bold">الإيرادات</th>
                            <th className="py-3 px-4 font-bold">التكلفة</th>
                            <th className="py-3 px-4 font-bold">صافي الربح</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                          {(() => {
                            const data = profitsData.profitsByInvoice || [];
                            const paginated = data.slice((profitInvPage - 1) * profitInvPageSize, profitInvPage * profitInvPageSize);
                            return paginated.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[var(--border-color)]/20">
                                <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">{(profitInvPage - 1) * profitInvPageSize + idx + 1}</td>
                                <td className="py-3 px-4 font-mono font-bold text-indigo-500">{item.invoiceId}</td>
                                <td className="py-3 px-4 font-mono">{item.date}</td>
                                <td className="py-3 px-4 font-bold">{item.customerName}</td>
                                <td className="py-3 px-4 font-mono">{item.revenue.toLocaleString()} SDG</td>
                                <td className="py-3 px-4 font-mono text-rose-500">{item.cost.toLocaleString()} SDG</td>
                                <td className="py-3 px-4 font-bold font-mono text-emerald-500">{item.profit.toLocaleString()} SDG</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination(profitInvPage, profitInvPageSize, (profitsData.profitsByInvoice || []).length, setProfitInvPage, setProfitInvPageSize)}
                  </div>
                )}

                {/* Profits by Customer */}
                {profitsSubTab === 'byCustomer' && (
                  <div className="glass-card p-5 rounded-2xl space-y-4 text-right animate-fade-in-slide">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-[var(--text-primary)]">👤 تقرير الأرباح حسب العميل</h3>
                        <p className="text-xs text-[var(--text-secondary)]">تحليل الأرباح المحققة من كل عميل</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => exportToExcelXML(
                            profitsData.profitsByCustomer, 'profits_by_customer',
                            ['اسم العميل', 'الإيرادات', 'التكلفة', 'صافي الربح'],
                            (item: any) => [item.customerName, item.revenue.toString(), item.cost.toString(), item.profit.toString()],
                            'تقرير الأرباح حسب العميل', `صافي الأرباح الكلي: ${profitsData.summary.totalProfit.toLocaleString()} SDG`
                          )}
                          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                        ><Download className="w-3.5 h-3.5" /><span>تصدير Excel</span></button>
                        <button 
                          onClick={() => exportPDFGeneral(
                            profitsData.profitsByCustomer, 'تقرير الأرباح حسب العميل',
                            ['اسم العميل', 'الإيرادات', 'التكلفة', 'صافي الربح'],
                            (item: any) => [item.customerName, `${item.revenue.toLocaleString()} SDG`, `${item.cost.toLocaleString()} SDG`, `${item.profit.toLocaleString()} SDG`],
                            'profits_by_customer'
                          )}
                          className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                        ><Printer className="w-3.5 h-3.5" /><span>تصدير PDF</span></button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                            <th className="py-3 px-4 font-bold">#</th>
                            <th className="py-3 px-4 font-bold">اسم العميل</th>
                            <th className="py-3 px-4 font-bold">إجمالي الإيرادات</th>
                            <th className="py-3 px-4 font-bold">إجمالي التكلفة</th>
                            <th className="py-3 px-4 font-bold">صافي الربح</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                          {(() => {
                            const data = profitsData.profitsByCustomer || [];
                            const paginated = data.slice((profitCustPage - 1) * profitCustPageSize, profitCustPage * profitCustPageSize);
                            return paginated.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[var(--border-color)]/20">
                                <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">{(profitCustPage - 1) * profitCustPageSize + idx + 1}</td>
                                <td className="py-3 px-4 font-bold">{item.customerName}</td>
                                <td className="py-3 px-4 font-mono">{item.revenue.toLocaleString()} SDG</td>
                                <td className="py-3 px-4 font-mono text-rose-500">{item.cost.toLocaleString()} SDG</td>
                                <td className="py-3 px-4 font-bold font-mono text-emerald-500">{item.profit.toLocaleString()} SDG</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination(profitCustPage, profitCustPageSize, (profitsData.profitsByCustomer || []).length, setProfitCustPage, setProfitCustPageSize)}
                  </div>
                )}

                {/* Profits by Category */}
                {profitsSubTab === 'byCategory' && (
                  <div className="glass-card p-5 rounded-2xl space-y-4 text-right animate-fade-in-slide">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-[var(--text-primary)]">🏷️ تقرير الأرباح حسب التصنيف</h3>
                        <p className="text-xs text-[var(--text-secondary)]">تحليل الأرباح المحققة لكل تصنيف دوائي</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => exportToExcelXML(
                            profitsData.profitsByCategory, 'profits_by_category',
                            ['التصنيف', 'الكمية', 'الإيرادات', 'التكلفة', 'صافي الربح'],
                            (item: any) => [item.category, item.qty.toString(), item.revenue.toString(), item.cost.toString(), item.profit.toString()],
                            'تقرير الأرباح حسب التصنيف', `صافي الأرباح الكلي: ${profitsData.summary.totalProfit.toLocaleString()} SDG`
                          )}
                          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                        ><Download className="w-3.5 h-3.5" /><span>تصدير Excel</span></button>
                        <button 
                          onClick={() => exportPDFGeneral(
                            profitsData.profitsByCategory, 'تقرير الأرباح حسب التصنيف',
                            ['التصنيف', 'الكمية', 'الإيرادات', 'التكلفة', 'صافي الربح'],
                            (item: any) => [item.category, `${item.qty} وحدة`, `${item.revenue.toLocaleString()} SDG`, `${item.cost.toLocaleString()} SDG`, `${item.profit.toLocaleString()} SDG`],
                            'profits_by_category'
                          )}
                          className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                        ><Printer className="w-3.5 h-3.5" /><span>تصدير PDF</span></button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                            <th className="py-3 px-4 font-bold">#</th>
                            <th className="py-3 px-4 font-bold">التصنيف</th>
                            <th className="py-3 px-4 font-bold">الكمية المباعة</th>
                            <th className="py-3 px-4 font-bold">الإيرادات</th>
                            <th className="py-3 px-4 font-bold">التكلفة</th>
                            <th className="py-3 px-4 font-bold">صافي الربح</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                          {(() => {
                            const data = profitsData.profitsByCategory || [];
                            const paginated = data.slice((profitCatPage - 1) * profitCatPageSize, profitCatPage * profitCatPageSize);
                            return paginated.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[var(--border-color)]/20">
                                <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">{(profitCatPage - 1) * profitCatPageSize + idx + 1}</td>
                                <td className="py-3 px-4 font-bold"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">{item.category}</span></td>
                                <td className="py-3 px-4 font-mono">{item.qty.toLocaleString()} وحدة</td>
                                <td className="py-3 px-4 font-mono">{item.revenue.toLocaleString()} SDG</td>
                                <td className="py-3 px-4 font-mono text-rose-500">{item.cost.toLocaleString()} SDG</td>
                                <td className="py-3 px-4 font-bold font-mono text-emerald-500">{item.profit.toLocaleString()} SDG</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination(profitCatPage, profitCatPageSize, (profitsData.profitsByCategory || []).length, setProfitCatPage, setProfitCatPageSize)}
                  </div>
                )}
              </div>
            )}
            
          </div>
        )}
      </div>

      {/* Printable Rep Statement Layout */}
      {activeTab === 'representatives' && salesData && (
        <div className="hidden print:block print-section w-full text-right p-8 space-y-6" dir="rtl">
          <style>{`
            @media print {
              /* Hide all components of the application layout */
              aside, nav, header, .sidebar, .navbar, button, .print\\:hidden, #root > *:not(.print-section) {
                display: none !important;
              }
              /* Show ONLY the print section */
              body, html, #root {
                background: white !important;
                color: black !important;
                overflow: visible !important;
                height: auto !important;
              }
              .print-section {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                direction: rtl !important;
                text-align: right !important;
              }
              .print-section * {
                visibility: visible !important;
              }
            }
          `}</style>
          
          {/* Letterhead */}
          <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-emerald-700">المثنى للأدوية</h1>
              <p className="text-xs text-gray-500">قسم الحسابات والعمولات والمناديب</p>
            </div>
            <div className="text-left text-xs text-gray-500">
              <p>التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
              <p>كشف مالي رسمي للمبيعات والعمولات</p>
            </div>
          </div>

          {/* Rep Summary Card */}
          <div className="border border-emerald-200 bg-emerald-50/10 p-5 rounded-xl space-y-3">
            <h2 className="text-lg font-bold text-emerald-800">
              {selectedRep ? `كشف حساب عمليات المندوب: ${selectedRep.name}` : 'كشف حساب عمليات كافة مناديب المبيعات'}
            </h2>
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-700">
              {selectedRep ? (
                <>
                  <div><strong>رقم الهاتف:</strong> {selectedRep.phone || '-'}</div>
                  <div><strong>نسبة العمولة:</strong> {selectedRep.commissionRate}%</div>
                  <div><strong>إجمالي العمليات:</strong> {selectedRep.salesCount} عملية</div>
                  <div><strong>إجمالي المبيعات:</strong> {selectedRep.totalSales.toLocaleString()} SDG</div>
                  <div><strong>المحصل الفعلي:</strong> {selectedRep.totalPaid.toLocaleString()} SDG</div>
                  <div><strong>إجمالي العمولة المستحقة:</strong> {selectedRep.totalCommission.toLocaleString()} SDG</div>
                </>
              ) : (
                <>
                  <div><strong>عدد المناديب:</strong> {salesData.representativesSalesReport?.length || 0} مندوب</div>
                  <div><strong>إجمالي العمليات:</strong> {allSales.length} عملية</div>
                  <div><strong>نوع التقرير:</strong> شامل لكافة مناديب المبيعات</div>
                  <div><strong>إجمالي المبيعات الكلية:</strong> {allSales.reduce((sum: number, s: any) => sum + s.total, 0).toLocaleString()} SDG</div>
                  <div><strong>المحصل الفعلي:</strong> {allSales.reduce((sum: number, s: any) => sum + s.paid, 0).toLocaleString()} SDG</div>
                  <div><strong>إجمالي العمولات المستحقة:</strong> {salesData.summary.totalRepresentativeCommissions.toLocaleString()} SDG</div>
                </>
              )}
            </div>
          </div>

          {/* Invoices Table */}
          <table className="w-full text-right border-collapse border border-gray-300 text-xs">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="border border-gray-300 py-2.5 px-3">رقم الفاتورة</th>
                <th className="border border-gray-300 py-2.5 px-3">تاريخ الفاتورة</th>
                <th className="border border-gray-300 py-2.5 px-3">المندوب</th>
                <th className="border border-gray-300 py-2.5 px-3">اسم العميل</th>
                <th className="border border-gray-300 py-2.5 px-3">إجمالي المبيعات</th>
                <th className="border border-gray-300 py-2.5 px-3">المحصل الفعلي</th>
                <th className="border border-gray-300 py-2.5 px-3">العمولة المحتسبة</th>
                <th className="border border-gray-300 py-2.5 px-3">حالة السداد</th>
              </tr>
            </thead>
            <tbody>
              {(selectedRep ? selectedRep.sales : allSales).map((sale: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50 text-gray-800">
                  <td className="border border-gray-300 py-2 px-3 font-mono">#{sale.id.slice(0, 8)}</td>
                  <td className="border border-gray-300 py-2 px-3 font-mono">{sale.createdAt.split('T')[0]}</td>
                  <td className="border border-gray-300 py-2 px-3 font-bold">{sale.repName || selectedRep?.name || '-'}</td>
                  <td className="border border-gray-300 py-2 px-3 font-bold">{sale.customerName}</td>
                  <td className="border border-gray-300 py-2 px-3 font-mono">{sale.total.toLocaleString()} SDG</td>
                  <td className="border border-gray-300 py-2 px-3 font-mono">{sale.paid.toLocaleString()} SDG</td>
                  <td className="border border-gray-300 py-2 px-3 font-mono font-bold text-emerald-700">{sale.commission.toLocaleString()} SDG</td>
                  <td className="border border-gray-300 py-2 px-3">
                    {sale.status === 'PAID' ? 'تم الدفع بالكامل' : sale.status === 'PARTIAL' ? 'دفع جزئي' : 'قيد الانتظار'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signatures */}
          <div className="flex justify-between items-center pt-16 text-xs">
            <div className="text-center space-y-4">
              <p>توقيع المندوب المالي / المحاسب</p>
              <p className="border-t border-gray-400 w-40 pt-1 mx-auto"></p>
            </div>
            <div className="text-center space-y-4">
              <p>الختم الرسمي والتوقيع</p>
              <p className="border-t border-gray-400 w-40 pt-1 mx-auto"></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
