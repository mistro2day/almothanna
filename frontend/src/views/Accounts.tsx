import React, { useState, useEffect } from 'react';
import { useExpensesStore, Expense, ExpenseCategory, FinancialSummary } from '../store/useExpensesStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import DatePicker from '../components/DatePicker';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Layers, 
  Plus, 
  Search, 
  Trash2, 
  Calendar,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  X,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight
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

export default function Accounts() {
  const { 
    expenses, 
    categories, 
    loading: storeLoading, 
    fetchExpenses, 
    fetchCategories, 
    addExpense, 
    deleteExpense, 
    addCategory, 
    deleteCategory, 
    fetchFinancialSummary 
  } = useExpensesStore();
  
  const { user } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'profit-loss'>('dashboard');
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Summaries
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form States
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    date: '',
    categoryId: ''
  });
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchSettings();
  }, [fetchCategories, fetchSettings]);

  useEffect(() => {
    const loadData = async () => {
      setLoadingSummary(true);
      try {
        const data = await fetchFinancialSummary(startDate, endDate);
        setSummary(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSummary(false);
      }
    };
    loadData();
    fetchExpenses({ startDate, endDate, categoryId: selectedCategoryId });
  }, [fetchFinancialSummary, fetchExpenses, startDate, endDate, selectedCategoryId]);

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.categoryId) return;

    try {
      await addExpense({
        amount: Number(newExpense.amount),
        description: newExpense.description || undefined,
        date: newExpense.date || undefined,
        categoryId: newExpense.categoryId,
        userId: user?.id
      });
      // Refresh summary
      const updatedSummary = await fetchFinancialSummary(startDate, endDate);
      setSummary(updatedSummary);
      
      setNewExpense({ amount: '', description: '', date: '', categoryId: '' });
      setShowExpenseModal(false);
    } catch (err) {
      console.error(err);
      alert('فشل تسجيل المصروف');
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName('');
      alert('تم إضافة الفئة بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل إضافة الفئة، قد تكون موجودة بالفعل');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    try {
      await deleteExpense(id);
      const updatedSummary = await fetchFinancialSummary(startDate, endDate);
      setSummary(updatedSummary);
    } catch (err) {
      console.error(err);
      alert('فشل حذف المصروف');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف المصاريف المرتبطة بها تلقائياً.')) return;
    try {
      await deleteCategory(id);
    } catch (err) {
      console.error(err);
      alert('فشل حذف الفئة');
    }
  };

  // Preset Dates helper
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

  // Filtered expenses list based on search query
  const filteredExpenses = expenses.filter(e => 
    (e.description || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
    (e.category?.name || '').toLowerCase().includes(expenseSearch.toLowerCase())
  );

  // Chart Data preparation
  const chartData = [
    { name: 'المبيعات', 'المتوقع': summary?.totalSales || 0, 'الفعلي/المدفوع': summary?.totalSalesPaid || 0, fill: '#059669' },
    { name: 'المشتريات', 'المتوقع': summary?.totalPurchases || 0, 'الفعلي/المدفوع': summary?.totalPurchasesPaid || 0, fill: '#3b82f6' },
    { name: 'المصاريف', 'الفعلي/المدفوع': summary?.totalExpenses || 0, fill: '#f43f5e' },
  ];

  // Pie chart by Category
  const expenseByCategory = categories.map(cat => {
    const total = expenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, value: total };
  }).filter(item => item.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#f43f5e', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899'];

  // Excel Export
  const handleExportExcel = () => {
    const companyName = settings?.name || "المثنى للأدوية";
    const companyAddress = settings?.address || "";
    const companyPhone = settings?.phone || "";
    let contactInfo = "";
    if (companyAddress) contactInfo += "العنوان: " + companyAddress;
    if (companyPhone) contactInfo += (contactInfo ? " | " : "") + "الهاتف: " + companyPhone;

    const headers = ['رقم السجل', 'تاريخ الصرف', 'القيمة (SDG)', 'الفئة', 'الوصف والتفاصيل', 'المسجل'];
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
      '  <Worksheet ss:Name="كشف المصاريف">\n' +
      '   <Table>\n' +
      colDefs + '\n';

    xml += '   <Row ss:Height="35">\n';
    xml += '    <Cell ss:MergeAcross="' + (headers.length - 1) + '" ss:StyleID="CompanyHeader"><Data ss:Type="String">' + companyName + '</Data></Cell>\n';
    xml += '   </Row>\n';

    if (contactInfo) {
      xml += '   <Row ss:Height="20">\n';
      xml += '    <Cell ss:MergeAcross="' + (headers.length - 1) + '" ss:StyleID="Subtitle"><Data ss:Type="String">' + contactInfo + '</Data></Cell>\n';
      xml += '   </Row>\n';
    }

    xml += '   <Row ss:Height="25">\n';
    xml += '    <Cell ss:MergeAcross="' + (headers.length - 1) + '" ss:StyleID="Title"><Data ss:Type="String">كشف المصاريف والمنصرفات المحاسبية تفصيلياً</Data></Cell>\n';
    xml += '   </Row>\n';

    xml += '   <Row ss:Height="20">\n';
    xml += '    <Cell ss:MergeAcross="' + (headers.length - 1) + '" ss:StyleID="Subtitle"><Data ss:Type="String">الفترة: ' + (startDate || 'منذ البداية') + ' إلى ' + (endDate || 'اليوم') + '</Data></Cell>\n';
    xml += '   </Row>\n';

    xml += '   <Row ss:Height="15"></Row>\n';

    // Headers
    xml += '   <Row ss:Height="25">\n';
    headers.forEach(h => {
      xml += '    <Cell ss:StyleID="Header"><Data ss:Type="String">' + h + '</Data></Cell>\n';
    });
    xml += '   </Row>\n';

    // Rows
    filteredExpenses.forEach((exp, idx) => {
      xml += '   <Row ss:Height="20">\n';
      xml += '    <Cell ss:StyleID="Cell"><Data ss:Type="String">' + (idx + 1) + '</Data></Cell>\n';
      xml += '    <Cell ss:StyleID="Cell"><Data ss:Type="String">' + new Date(exp.date).toLocaleDateString('ar-SA') + '</Data></Cell>\n';
      xml += '    <Cell ss:StyleID="Cell"><Data ss:Type="Number">' + exp.amount + '</Data></Cell>\n';
      xml += '    <Cell ss:StyleID="Cell"><Data ss:Type="String">' + (exp.category?.name || 'عام') + '</Data></Cell>\n';
      xml += '    <Cell ss:StyleID="Cell"><Data ss:Type="String">' + (exp.description || '---') + '</Data></Cell>\n';
      xml += '    <Cell ss:StyleID="Cell"><Data ss:Type="String">' + (exp.user?.name || '---') + '</Data></Cell>\n';
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
    link.setAttribute('download', `كشف_المصاريف_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const handleExportPDF = () => {
    const companyName = settings?.name || "المثنى للأدوية";
    const companyPhone = settings?.phone || "غير محدد";
    const companyAddress = settings?.address || "السودان";
    
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    const rowsHTML = filteredExpenses.map((exp, idx) => `
      <tr>
        <td style="text-align: center; padding: 6px; border: 1px solid #ddd;">${idx + 1}</td>
        <td style="text-align: center; padding: 6px; border: 1px solid #ddd; font-family: monospace;">${new Date(exp.date).toLocaleDateString('ar-SA')}</td>
        <td style="text-align: center; padding: 6px; border: 1px solid #ddd; font-weight: bold; color: #b91c1c;">${exp.amount.toLocaleString()} SDG</td>
        <td style="text-align: center; padding: 6px; border: 1px solid #ddd; font-weight: bold;">${exp.category?.name || 'عام'}</td>
        <td style="text-align: right; padding: 6px; border: 1px solid #ddd;">${exp.description || '---'}</td>
        <td style="text-align: center; padding: 6px; border: 1px solid #ddd; color: #64748b;">${exp.user?.name || '---'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تقرير المصاريف والمنصرفات</title>
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
      padding: 8px 6px;
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
              <h2>تقرير المصاريف والمنصرفات</h2>
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
            <div><span>عدد المصاريف المسجلة:</span> <strong>${filteredExpenses.length} سجل مصروفات</strong></div>
            <div><span>المسؤول:</span> <strong>${user?.name || "مدير النظام"}</strong></div>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 40px; background-color: #059669; color: white; border: 1px solid #059669;">#</th>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">التاريخ</th>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">القيمة (SDG)</th>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">الفئة</th>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">التفاصيل والبيان</th>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">المسجل</th>
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
            <div>شكراً لتعاملكم مع <strong>${companyName}</strong> - تم توليد المستند تلقائياً عبر وحدة الحسابات.</div>
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

  return (
    <div className="space-y-6 pb-20 lg:pb-0" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">إدارة الحسابات والمصاريف</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">تتبع التدفقات المالية والنقدية، الأرباح، وتسجيل المصاريف اليومية</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl text-sm hover:bg-[var(--border-color)] transition-colors cursor-pointer w-full sm:w-auto"
          >
            <Layers className="w-4 h-4" />
            <span>فئات المصاريف</span>
          </button>
          <button 
            onClick={() => {
              setNewExpense({ amount: '', description: '', date: new Date().toISOString().split('T')[0], categoryId: categories[0]?.id || '' });
              setShowExpenseModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-teal-500/10 cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مصروف جديد</span>
          </button>
        </div>
      </div>

      {/* Quick Filters Glassmorphic Card */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button 
            onClick={() => applyPreset('today')}
            className="px-3 py-1.5 bg-[var(--border-color)]/30 hover:bg-[var(--border-color)]/60 text-[var(--text-primary)] rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            اليوم
          </button>
          <button 
            onClick={() => applyPreset('week')}
            className="px-3 py-1.5 bg-[var(--border-color)]/30 hover:bg-[var(--border-color)]/60 text-[var(--text-primary)] rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            آخر أسبوع
          </button>
          <button 
            onClick={() => applyPreset('month')}
            className="px-3 py-1.5 bg-[var(--border-color)]/30 hover:bg-[var(--border-color)]/60 text-[var(--text-primary)] rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            هذا الشهر
          </button>
          <button 
            onClick={() => applyPreset('clear')}
            className="px-3 py-1.5 bg-[var(--border-color)]/30 hover:bg-[var(--border-color)]/60 text-[var(--text-secondary)] rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            تصفير الفلتر
          </button>

          <div className="h-6 w-[1px] bg-[var(--border-color)] mx-2 hidden sm:block" />

          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <DatePicker 
              value={startDate} 
              onChange={setStartDate} 
              placeholder="من تاريخ" 
              className="px-3 py-1.5 rounded-lg text-xs" 
            />
            <span className="text-[var(--text-secondary)] text-xs">إلى</span>
            <DatePicker 
              value={endDate} 
              onChange={setEndDate} 
              placeholder="إلى تاريخ" 
              className="px-3 py-1.5 rounded-lg text-xs" 
            />
          </div>
        </div>

        {/* Action Tabs switcher */}
        <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] w-full lg:w-auto mt-4 lg:mt-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>لوحة الأداء الحسابي</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>دفتر المصاريف ({filteredExpenses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profit-loss')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profit-loss'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>الأرباح والخسائر</span>
          </button>
        </div>
      </div>

      {/* Main Tab Rendering */}
      {storeLoading || loadingSummary ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--text-secondary)] text-sm">جاري معالجة البيانات واسترداد الحسابات...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Financial Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in-slide">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Sales Income Card */}
                <div className="glass-card p-5 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-transparent flex justify-between items-center relative overflow-hidden">
                  <div className="space-y-2">
                    <span className="text-xs text-[var(--text-secondary)] font-bold">إجمالي المبيعات (الداخل)</span>
                    <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {(summary?.totalSales || 0).toLocaleString()} <span className="text-xs">SDG</span>
                    </h2>
                    <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span>المدفوع نقداً: <strong>{(summary?.totalSalesPaid || 0).toLocaleString()} SDG</strong></span>
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </div>

                {/* 2. Murchases Outcomes Card */}
                <div className="glass-card p-5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent flex justify-between items-center relative overflow-hidden">
                  <div className="space-y-2">
                    <span className="text-xs text-[var(--text-secondary)] font-bold">فواتير الشراء (المستودع)</span>
                    <h2 className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                      {(summary?.totalPurchases || 0).toLocaleString()} <span className="text-xs">SDG</span>
                    </h2>
                    <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-blue-500" />
                      <span>المسدد للموردين: <strong>{(summary?.totalPurchasesPaid || 0).toLocaleString()} SDG</strong></span>
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                    <ArrowDownRight className="w-6 h-6" />
                  </div>
                </div>

                {/* 3. Expenses Card */}
                <div className="glass-card p-5 rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent flex justify-between items-center relative overflow-hidden">
                  <div className="space-y-2">
                    <span className="text-xs text-[var(--text-secondary)] font-bold">المصاريف اليومية (الخارج)</span>
                    <h2 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                      {(summary?.totalExpenses || 0).toLocaleString()} <span className="text-xs">SDG</span>
                    </h2>
                    <p className="text-[10px] text-[var(--text-secondary)]">نثريات، وقود، إيجار ومصاريف تشغيل</p>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                </div>

                {/* 4. Net Profit Card */}
                <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent flex justify-between items-center relative overflow-hidden">
                  <div className="space-y-2">
                    <span className="text-xs text-[var(--text-secondary)] font-bold">صافي الأرباح المحققة (الفعلي)</span>
                    <h2 className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
                      {(summary?.netProfitActual || 0).toLocaleString()} <span className="text-xs">SDG</span>
                    </h2>
                    <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-teal-500" />
                      <span>الأرباح المتوقعة بالكامل: <strong>{(summary?.netProfitExpected || 0).toLocaleString()} SDG</strong></span>
                    </p>
                  </div>
                  <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-500/20">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Graphical Analysis Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Profit & Loss chart (Bar) */}
                <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] lg:col-span-2 space-y-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">مقارنة التدفقات المالية (المبيعات مقابل المنصرفات)</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                        <YAxis stroke="var(--text-secondary)" fontSize={10} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="المتوقع" fill="#059669" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="الفعلي/المدفوع" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Expenses by Category (Pie Chart) */}
                <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] space-y-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">توزيع المصاريف حسب الفئات</h3>
                  <div className="h-[240px] flex items-center justify-center">
                    {expenseByCategory.length === 0 ? (
                      <div className="text-center text-xs text-[var(--text-secondary)] space-y-2">
                        <AlertCircle className="w-8 h-8 text-[var(--text-secondary)] mx-auto opacity-40" />
                        <p>لا توجد مصاريف مسجلة لعرضها في الرسم البياني.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {expenseByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value.toLocaleString()} SDG`} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  {/* Legend representation */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] justify-center">
                    {expenseByCategory.map((item, idx) => (
                      <span key={item.name} className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-[var(--text-primary)]">{item.name} ({item.value.toLocaleString()} SDG)</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Expenses Log & categories */}
          {activeTab === 'expenses' && (
            <div className="space-y-6 animate-fade-in-slide">
              {/* Search & Actions Bar */}
              <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col md:flex-row gap-3 w-full md:flex-1">
                  {/* Search Description */}
                  <div className="flex items-center gap-2.5 px-3 py-2 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] flex-1">
                    <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                    <input 
                      type="text"
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      placeholder="ابحث بوصف المصروف، فئة المصاريف..."
                      className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)]"
                    />
                  </div>

                  {/* Filter Category */}
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="px-3 py-2 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    <option value="">كل فئات المصاريف</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Excel & PDF Exporters */}
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>تصدير Excel</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>تصدير PDF</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="glass-card overflow-hidden border border-[var(--glass-border)] rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="bg-emerald-700 text-white dark:bg-emerald-950/70 dark:text-emerald-200 font-bold border-b border-emerald-600/20">
                        <th className="py-4 px-4 pr-6 text-center rounded-tr-2xl" style={{ width: '60px' }}>#</th>
                        <th className="py-4 px-4 text-center" style={{ width: '120px' }}>تاريخ الصرف</th>
                        <th className="py-4 px-4 text-center">الفئة</th>
                        <th className="py-4 px-4 text-right">البيان والوصف</th>
                        <th className="py-4 px-4 text-center" style={{ width: '150px' }}>القيمة (SDG)</th>
                        <th className="py-4 px-4 text-center">المسجل</th>
                        <th className="py-4 px-4 pl-6 text-center rounded-tl-2xl" style={{ width: '80px' }}>حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-[var(--text-secondary)]">
                            لا توجد أي مصاريف مسجلة مطابقة للخيارات المحددة.
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((exp, idx) => (
                          <tr key={exp.id} className="hover:bg-[var(--border-color)]/30 transition-colors">
                            <td className="py-4 px-4 pr-6 text-center font-mono text-[var(--text-secondary)]">{idx + 1}</td>
                            <td className="py-4 px-4 text-center font-mono text-[var(--text-secondary)]">
                              {new Date(exp.date).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 dark:text-rose-400">
                                {exp.category?.name || 'عام'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right font-medium text-[var(--text-primary)]">{exp.description || '---'}</td>
                            <td className="py-4 px-4 text-center font-mono font-bold text-rose-600 dark:text-rose-400">
                              {exp.amount.toLocaleString()} SDG
                            </td>
                            <td className="py-4 px-4 text-center text-xs text-[var(--text-secondary)]">{exp.user?.name || '---'}</td>
                            <td className="py-4 px-4 pl-6 text-center">
                              <button 
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Profit & Loss Statement (P&L) */}
          {activeTab === 'profit-loss' && (
            <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)] animate-fade-in-slide max-w-4xl mx-auto space-y-6">
              {/* Report Header block */}
              <div className="border-b border-emerald-500/30 pb-6 flex justify-between items-start">
                <div className="text-right space-y-1">
                  <h2 className="text-2xl font-black text-teal-600 dark:text-teal-400">{settings?.name || "المثنى للأدوية"}</h2>
                  <p className="text-xs text-[var(--text-secondary)]">{settings?.address || "السودان"}</p>
                  {settings?.phone && <p className="text-xs text-[var(--text-secondary)]">هاتف: {settings.phone}</p>}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-teal-700 dark:text-teal-400">كشف الأرباح والخسائر المالي</h3>
                  <p className="text-[10px] text-[var(--text-secondary)]">الفترة: {startDate || 'الكل'} إلى {endDate || 'اليوم'}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">تاريخ الإنشاء: {new Date().toLocaleDateString('ar-SA')}</p>
                </div>
              </div>

              {/* Income Section */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-emerald-600 border-b border-emerald-500/10 pb-1.5">أولاً: الإيرادات والمبيعات (Incomes)</h4>
                <div className="space-y-2 text-sm pr-4">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">إجمالي قيمة فواتير المبيعات (الافتراضي):</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{(summary?.totalSales || 0).toLocaleString()} SDG</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold bg-emerald-500/5 px-3 py-2 rounded-xl border border-emerald-500/10">
                    <span>إجمالي الإيرادات النقدية الفعلية (المقبوضة):</span>
                    <span className="font-mono">{(summary?.totalSalesPaid || 0).toLocaleString()} SDG</span>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] pr-2">
                    <span>المبيعات الآجلة (الديون والذمم):</span>
                    <span className="font-mono">{(summary?.totalSalesUnpaid || 0).toLocaleString()} SDG</span>
                  </div>
                </div>
              </div>

              {/* Outcomes Section */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-rose-500 border-b border-rose-500/10 pb-1.5">ثانياً: التكاليف والمنصرفات (Expenses & Costs)</h4>
                <div className="space-y-2 text-sm pr-4">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">إجمالي قيمة فواتير المشتريات (المسجلة):</span>
                    <span className="font-mono text-[var(--text-primary)]">{(summary?.totalPurchases || 0).toLocaleString()} SDG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">المسدد نقداً للموردين:</span>
                    <span className="font-mono text-rose-500 font-bold">{(summary?.totalPurchasesPaid || 0).toLocaleString()} SDG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">إجمالي المصاريف والمنصرفات التشغيلية:</span>
                    <span className="font-mono text-rose-500 font-bold">{(summary?.totalExpenses || 0).toLocaleString()} SDG</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-bold bg-rose-500/5 px-3 py-2 rounded-xl border border-rose-500/10">
                    <span>إجمالي المنصرفات الفعلية (المسددة + المصاريف):</span>
                    <span className="font-mono">{((summary?.totalPurchasesPaid || 0) + (summary?.totalExpenses || 0)).toLocaleString()} SDG</span>
                  </div>
                </div>
              </div>

              {/* Profit summary box */}
              <div className="pt-4 border-t border-dashed border-[var(--border-color)]">
                <div className="bg-teal-600 text-white rounded-2xl p-5 space-y-4 shadow-lg shadow-teal-600/10">
                  <h4 className="text-base font-bold">ثالثاً: خلاصة صافي الأرباح (Net Profit Report)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-white/20 text-sm">
                    <div className="space-y-1">
                      <span className="text-white/80 block text-xs">صافي الأرباح الفعلية المحققة (السيولة النقدية):</span>
                      <h3 className="text-2xl font-black font-mono">
                        {(summary?.netProfitActual || 0).toLocaleString()} SDG
                      </h3>
                      <p className="text-[10px] text-teal-100">تم احتسابها كـ: المقبوضات - (المدفوع للموردين + المصاريف)</p>
                    </div>
                    <div className="space-y-1 sm:pr-6">
                      <span className="text-white/80 block text-xs">صافي الأرباح المتوقعة الكلية:</span>
                      <h3 className="text-2xl font-black font-mono">
                        {(summary?.netProfitExpected || 0).toLocaleString()} SDG
                      </h3>
                      <p className="text-[10px] text-teal-100">تم احتسابها كـ: إجمالي قيمة المبيعات - (إجمالي المشتريات + المصاريف)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature print block */}
              <div className="flex justify-between items-center pt-8 text-xs text-[var(--text-secondary)]">
                <div>ختم المؤسسة الرسمي</div>
                <div className="text-center font-bold text-teal-600">نظام المثنى ERP الحسابي الموثق</div>
                <div>توقيع المدير المالي</div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-sm transition-colors hover:bg-teal-700 shadow-md cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>طباعة الكشف الرسمي</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: Add Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-md rounded-3xl border border-[var(--glass-border)] shadow-2xl p-6 relative overflow-hidden animate-zoom-in space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h3 className="text-lg font-black text-[var(--text-primary)]">تسجيل مصروف جديد</h3>
              <button 
                onClick={() => setShowExpenseModal(false)}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] block">قيمة المصروف (SDG) *</label>
                <input 
                  type="number"
                  step="any"
                  required
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="مثال: 50000"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] block">فئة المصاريف *</label>
                <select
                  required
                  value={newExpense.categoryId}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none cursor-pointer"
                >
                  <option value="" disabled>اختر الفئة</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] block">تاريخ الصرف</label>
                <DatePicker
                  value={newExpense.date}
                  onChange={(val) => setNewExpense(prev => ({ ...prev, date: val }))}
                  placeholder="تاريخ الصرف"
                  className="w-full px-4 py-2.5 rounded-xl"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] block">وصف وتفاصيل المصروف</label>
                <textarea
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="اكتب بياناً تفصيلياً (مثال: صيانة مولد الكهرباء)"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none resize-none"
                />
              </div>

              {/* Submit buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 bg-[var(--border-color)] hover:bg-[var(--border-color)]/80 text-[var(--text-secondary)] rounded-xl text-sm transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!newExpense.amount || !newExpense.categoryId}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  تسجيل المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Manage Categories */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-lg rounded-3xl border border-[var(--glass-border)] shadow-2xl p-6 relative overflow-hidden animate-zoom-in space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h3 className="text-lg font-black text-[var(--text-primary)]">إدارة فئات المصاريف</h3>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategorySubmit} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] block">اسم الفئة الجديدة</label>
                <input 
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="مثال: وقود، إيجار مستودع..."
                  className="w-full px-4 py-2 border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm rounded-xl outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-teal-600 text-white font-bold text-sm rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer h-[38px]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة</span>
              </button>
            </form>

            {/* Categories List */}
            <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto border border-[var(--border-color)] rounded-2xl p-3 bg-[var(--bg-secondary)]/30">
              <h4 className="text-xs font-bold text-[var(--text-secondary)] border-b pb-1">الفئات المسجلة ({categories.length})</h4>
              {categories.length === 0 ? (
                <p className="text-center text-xs text-[var(--text-secondary)] py-6">لا توجد أي فئات مسجلة حالياً.</p>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-teal-500/30 transition-all">
                    <span className="text-sm font-bold text-[var(--text-primary)]">{cat.name}</span>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
