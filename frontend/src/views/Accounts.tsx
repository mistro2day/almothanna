import React, { useState, useEffect } from 'react';
import { useExpensesStore, Expense, ExpenseCategory, FinancialSummary, Revenue, RevenueCategory, FundTransaction, FundSummary } from '../store/useExpensesStore';
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
  ArrowDownRight,
  Settings,
  CreditCard,
  Briefcase,
  Printer
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Bar,
  Area
} from 'recharts';

export default function Accounts() {
  const { 
    expenses, 
    categories, 
    revenues,
    revenueCategories,
    fundTransactions,
    fundSummary,
    loading: storeLoading, 
    fetchExpenses, 
    fetchCategories, 
    addExpense, 
    deleteExpense, 
    addCategory, 
    deleteCategory,
    fetchRevenues,
    fetchRevenueCategories,
    addRevenue,
    deleteRevenue,
    addRevenueCategory,
    deleteRevenueCategory,
    fetchFundLedger,
    fetchFundSummary,
    addManualFundTransaction,
    deleteManualFundTransaction,
    fetchFinancialSummary 
  } = useExpensesStore();
  
  const { user } = useAuthStore();
  const { settings, fetchSettings, updateSettings } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'safe' | 'expenses' | 'revenues' | 'profit-loss'>('dashboard');
  const [revenueSubTab, setRevenueSubTab] = useState<'sales-collections' | 'other-revenues'>('sales-collections');
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Search & Specific Filters
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  const [revenueSearch, setRevenueSearch] = useState('');
  const [selectedRevenueCategoryId, setSelectedRevenueCategoryId] = useState('');

  const [safeSearch, setSafeSearch] = useState('');
  const [selectedSafeMethod, setSelectedSafeMethod] = useState('');
  const [selectedSafeSource, setSelectedSafeSource] = useState('');

  // Summaries
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showRevenueCategoryModal, setShowRevenueCategoryModal] = useState(false);
  const [showSafeModal, setShowSafeModal] = useState(false);

  // Pagination States
  const [safePage, setSafePage] = useState(1);
  const [safePageSize, setSafePageSize] = useState(10);

  const [expensePage, setExpensePage] = useState(1);
  const [expensePageSize, setExpensePageSize] = useState(10);

  const [collectionsPage, setCollectionsPage] = useState(1);
  const [collectionsPageSize, setCollectionsPageSize] = useState(10);

  const [otherRevenuesPage, setOtherRevenuesPage] = useState(1);
  const [otherRevenuesPageSize, setOtherRevenuesPageSize] = useState(10);

  useEffect(() => { setSafePage(1); }, [safeSearch, selectedSafeMethod, selectedSafeSource]);
  useEffect(() => { setExpensePage(1); }, [expenseSearch, selectedCategoryId]);
  useEffect(() => { setCollectionsPage(1); }, [revenueSearch]);
  useEffect(() => { setOtherRevenuesPage(1); }, [revenueSearch, selectedRevenueCategoryId]);

  // Form States
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    date: '',
    categoryId: '',
    documentNumber: '',
    paymentMethod: 'CASH'
  });

  const [newRevenue, setNewRevenue] = useState({
    amount: '',
    description: '',
    date: '',
    categoryId: '',
    documentNumber: '',
    paymentMethod: 'CASH'
  });

  const [newSafeTx, setNewSafeTx] = useState({
    amount: '',
    type: 'INFLOW' as 'INFLOW' | 'OUTFLOW',
    paymentMethod: 'CASH',
    reference: '',
    documentNumber: '',
    description: '',
    date: ''
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newRevenueCategoryName, setNewRevenueCategoryName] = useState('');

  // Load Initial Configuration
  useEffect(() => {
    fetchCategories();
    fetchRevenueCategories();
    fetchSettings();
  }, [fetchCategories, fetchRevenueCategories, fetchSettings]);

  // Load Tab-specific Data
  useEffect(() => {
    const loadData = async () => {
      setLoadingSummary(true);
      try {
        const summaryData = await fetchFinancialSummary(startDate, endDate);
        setSummary(summaryData);
        await fetchFundSummary(startDate, endDate);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSummary(false);
      }
    };
    loadData();

    if (activeTab === 'expenses') {
      fetchExpenses({ startDate, endDate, categoryId: selectedCategoryId });
    } else if (activeTab === 'revenues') {
      fetchRevenues({ startDate, endDate, categoryId: selectedRevenueCategoryId });
      fetchFundLedger({ startDate, endDate });
    } else if (activeTab === 'safe') {
      fetchFundLedger({ 
        startDate, 
        endDate, 
        paymentMethod: selectedSafeMethod || undefined,
        source: selectedSafeSource || undefined
      });
    }
  }, [activeTab, fetchFinancialSummary, fetchExpenses, fetchRevenues, fetchFundLedger, fetchFundSummary, startDate, endDate, selectedCategoryId, selectedRevenueCategoryId, selectedSafeMethod, selectedSafeSource]);

  // Submit Expense
  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.categoryId) return;

    try {
      await addExpense({
        amount: Number(newExpense.amount),
        description: newExpense.description || undefined,
        date: newExpense.date || undefined,
        categoryId: newExpense.categoryId,
        userId: user?.id,
        documentNumber: newExpense.documentNumber || undefined,
        paymentMethod: newExpense.paymentMethod
      });
      
      const updatedSummary = await fetchFinancialSummary(startDate, endDate);
      setSummary(updatedSummary);
      await fetchFundSummary(startDate, endDate);
      
      setNewExpense({ amount: '', description: '', date: '', categoryId: '', documentNumber: '', paymentMethod: 'CASH' });
      setShowExpenseModal(false);
      alert('تم تسجيل المصروف بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل تسجيل المصروف');
    }
  };

  // Submit Revenue
  const handleAddRevenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevenue.amount || !newRevenue.categoryId) return;

    try {
      await addRevenue({
        amount: Number(newRevenue.amount),
        description: newRevenue.description || undefined,
        date: newRevenue.date || undefined,
        categoryId: newRevenue.categoryId,
        userId: user?.id,
        documentNumber: newRevenue.documentNumber || undefined,
        paymentMethod: newRevenue.paymentMethod
      });
      
      const updatedSummary = await fetchFinancialSummary(startDate, endDate);
      setSummary(updatedSummary);
      await fetchFundSummary(startDate, endDate);
      
      setNewRevenue({ amount: '', description: '', date: '', categoryId: '', documentNumber: '', paymentMethod: 'CASH' });
      setShowRevenueModal(false);
      alert('تم تسجيل الإيراد بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل تسجيل الإيراد');
    }
  };

  // Submit Manual Fund Transaction
  const handleAddSafeTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSafeTx.amount || !newSafeTx.description) return;

    try {
      await addManualFundTransaction({
        amount: Number(newSafeTx.amount),
        type: newSafeTx.type,
        paymentMethod: newSafeTx.paymentMethod,
        reference: newSafeTx.reference || undefined,
        documentNumber: newSafeTx.documentNumber || undefined,
        description: newSafeTx.description,
        date: newSafeTx.date || undefined,
        userId: user?.id
      });
      
      await fetchFundSummary(startDate, endDate);
      fetchFundLedger({ startDate, endDate });
      
      setNewSafeTx({ amount: '', type: 'INFLOW', paymentMethod: 'CASH', reference: '', documentNumber: '', description: '', date: '' });
      setShowSafeModal(false);
      alert('تم تسجيل حركة الصندوق بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل تسجيل حركة الصندوق');
    }
  };

  // Categories Add/Delete
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName('');
      alert('تم إضافة فئة المصاريف بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل إضافة الفئة');
    }
  };

  const handleAddRevenueCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevenueCategoryName.trim()) return;
    try {
      await addRevenueCategory(newRevenueCategoryName.trim());
      setNewRevenueCategoryName('');
      alert('تم إضافة فئة الإيرادات بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل إضافة الفئة');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    try {
      await deleteExpense(id);
      const updatedSummary = await fetchFinancialSummary(startDate, endDate);
      setSummary(updatedSummary);
      await fetchFundSummary(startDate, endDate);
    } catch (err) {
      console.error(err);
      alert('فشل حذف المصروف');
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإيراد؟')) return;
    try {
      await deleteRevenue(id);
      const updatedSummary = await fetchFinancialSummary(startDate, endDate);
      setSummary(updatedSummary);
      await fetchFundSummary(startDate, endDate);
    } catch (err) {
      console.error(err);
      alert('فشل حذف الإيراد');
    }
  };

  const handleDeleteSafeTx = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحركة من دفتر الصندوق؟')) return;
    try {
      await deleteManualFundTransaction(id);
      await fetchFundSummary(startDate, endDate);
    } catch (err: any) {
      alert(err.message || 'فشل حذف الحركة');
    }
  };

  // Toggle Safe Settings
  const handleToggleSettings = async (field: 'linkSalesToFund' | 'linkPurchasesToFund' | 'linkExpensesToFund', val: boolean) => {
    try {
      await updateSettings({ [field]: val });
      alert('تم تحديث إعدادات الصندوق بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل تحديث الإعدادات');
    }
  };

  // Preset dates helper
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

  // Filter lists based on search
  const filteredExpenses = expenses.filter(e => 
    (e.description || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
    (e.category?.name || '').toLowerCase().includes(expenseSearch.toLowerCase()) ||
    (e.documentNumber || '').toLowerCase().includes(expenseSearch.toLowerCase())
  );

  const filteredRevenues = revenues.filter(r => 
    (r.description || '').toLowerCase().includes(revenueSearch.toLowerCase()) ||
    (r.category?.name || '').toLowerCase().includes(revenueSearch.toLowerCase()) ||
    (r.documentNumber || '').toLowerCase().includes(revenueSearch.toLowerCase())
  );

  const filteredSafeTx = fundTransactions.filter(tx => 
    tx.description.toLowerCase().includes(safeSearch.toLowerCase()) ||
    tx.transactionCode.toLowerCase().includes(safeSearch.toLowerCase()) ||
    (tx.documentNumber || '').toLowerCase().includes(safeSearch.toLowerCase())
  );

  // Paginated Slices
  const paginatedSafeTx = filteredSafeTx.slice((safePage - 1) * safePageSize, safePage * safePageSize);
  const paginatedExpenses = filteredExpenses.slice((expensePage - 1) * expensePageSize, expensePage * expensePageSize);

  const collectionsList = fundTransactions.filter(tx => tx.source === 'SALE' && tx.type === 'INFLOW');
  const filteredCollections = collectionsList.filter(tx => 
    tx.description.toLowerCase().includes(revenueSearch.toLowerCase()) ||
    tx.transactionCode.toLowerCase().includes(revenueSearch.toLowerCase()) ||
    (tx.documentNumber || '').toLowerCase().includes(revenueSearch.toLowerCase())
  );
  const paginatedCollections = filteredCollections.slice((collectionsPage - 1) * collectionsPageSize, collectionsPage * collectionsPageSize);

  const paginatedRevenues = filteredRevenues.slice((otherRevenuesPage - 1) * otherRevenuesPageSize, otherRevenuesPage * otherRevenuesPageSize);

  // Pagination Helper Component
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-[var(--border-color)]/60 text-xs text-[var(--text-secondary)] select-none" dir="rtl">
        <div className="flex items-center gap-2">
          <span>عدد السجلات:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1 outline-none text-[var(--text-primary)] cursor-pointer text-xs font-bold"
          >
            <option value={10}>10 سجلات</option>
            <option value={20}>20 سجل</option>
            <option value={50}>50 سجل</option>
            <option value={100}>100 سجل</option>
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
                        ? 'bg-teal-600 text-white shadow-md'
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

  // PDF exports (colored, formatted template with header branding)
  const handleExportPDF = (type: 'expenses' | 'revenues-collections' | 'revenues-other' | 'safe') => {
    const companyName = settings?.name || "المثنى للأدوية والمستلزمات الطبية";
    const companyPhone = settings?.phone || "0912345678";
    const companyAddress = settings?.address || "السودان - الخرطوم";
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    let title = "";
    let headers: string[] = [];
    let rowsHTML = "";
    let themeColor = "#0d9488"; // default teal
    let themeBg = "#ecfdf5";
    let themeText = "#0f766e";

    if (type === 'expenses') {
      title = "تقرير المصاريف والمنصرفات التفصيلي";
      themeColor = "#e11d48"; // rose
      themeBg = "#fff1f2";
      themeText = "#be123c";
      headers = ['#', 'تاريخ الصرف', 'رقم المستند', 'طريقة الدفع', 'فئة المصروف', 'البيان والتفاصيل', 'المبلغ (SDG)', 'المسجل'];
      rowsHTML = filteredExpenses.map((exp, idx) => `
        <tr>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${idx + 1}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${new Date(exp.date).toLocaleDateString('ar-SA')}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${exp.documentNumber || '---'}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${translatePaymentMethod(exp.paymentMethod)}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: ${themeColor};">${exp.category?.name || 'عام'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${exp.description || '---'}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; font-family: monospace; color: #ef4444;">${exp.amount.toLocaleString()} SDG</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">${exp.user?.name || '---'}</td>
        </tr>
      `).join('');
    } else if (type === 'revenues-collections') {
      title = "تقرير تحصيل فواتير المبيعات (التحصيل الفعلي)";
      themeColor = "#0d9488"; // teal
      themeBg = "#f0fdf4";
      themeText = "#115e59";
      headers = ['رقم الحركة', 'رقم المستند', 'التاريخ', 'طريقة التحصيل', 'البيان والتفاصيل', 'المبلغ المحصل (SDG)', 'المسجل'];
      rowsHTML = filteredCollections.map((tx) => `
        <tr>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: ${themeColor};">${tx.transactionCode}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${tx.documentNumber || '---'}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${new Date(tx.date).toLocaleDateString('ar-SA')}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${translatePaymentMethod(tx.paymentMethod)}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${tx.description}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; font-family: monospace; color: #10b981;">+${tx.amount.toLocaleString()} SDG</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">${tx.user}</td>
        </tr>
      `).join('');
    } else if (type === 'revenues-other') {
      title = "تقرير المقبوضات والإيرادات الأخرى";
      themeColor = "#059669"; // emerald
      themeBg = "#ecfdf5";
      themeText = "#065f46";
      headers = ['#', 'التاريخ', 'رقم المستند', 'طريقة الدفع', 'فئة الإيراد', 'البيان والتفاصيل', 'المبلغ (SDG)', 'المسجل'];
      rowsHTML = filteredRevenues.map((rev, idx) => `
        <tr>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${idx + 1}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${new Date(rev.date).toLocaleDateString('ar-SA')}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${rev.documentNumber || '---'}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${translatePaymentMethod(rev.paymentMethod || 'CASH')}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: ${themeColor};">${rev.category?.name || 'عام'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${rev.description || '---'}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; font-family: monospace; color: #10b981;">+${rev.amount.toLocaleString()} SDG</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">${rev.user?.name || '---'}</td>
        </tr>
      `).join('');
    } else {
      title = "تقرير حركة الخزينة وكشف الصندوق التفصيلي";
      themeColor = "#2563eb"; // blue
      themeBg = "#eff6ff";
      themeText = "#1e40af";
      headers = ['رقم الحركة', 'رقم المستند', 'التاريخ', 'طريقة الدفع', 'البيان والتفاصيل', 'الوارد (له)', 'المنصرف (عليه)', 'المسجل'];
      rowsHTML = filteredSafeTx.map((tx) => `
        <tr>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: ${themeColor};">${tx.transactionCode}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${tx.documentNumber || '---'}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${new Date(tx.date).toLocaleDateString('ar-SA')}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #64748b;">${translatePaymentMethod(tx.paymentMethod)}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${tx.description}</td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; font-family: monospace; color: #10b981;">
            ${tx.type === 'INFLOW' ? `+${tx.amount.toLocaleString()}` : '-'}
          </td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; font-family: monospace; color: #ef4444;">
            ${tx.type === 'OUTFLOW' ? `-${tx.amount.toLocaleString()}` : '-'}
          </td>
          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">${tx.user}</td>
        </tr>
      `).join('');
    }

    const headerHTML = headers.map(h => `<th style="background-color: ${themeColor}; color: white; padding: 12px 10px; border: 1px solid ${themeColor}; font-size: 13px; font-weight: 700; text-align: center;">${h}</th>`).join('');

    printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
    * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
    body { background: #fff; color: #1e293b; line-height: 1.5; padding: 0; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${themeColor}; padding-bottom: 12px; margin-bottom: 20px; }
    .company { display: flex; align-items: center; gap: 12px; }
    .company-logo {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, ${themeColor}, #10b981);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 900;
      font-size: 22px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .company h1 { font-size: 22px; color: ${themeText}; margin: 0 0 4px 0; font-weight: 900; }
    .company p { font-size: 11px; color: #475569; margin: 0; }
    .title h2 { font-size: 18px; color: ${themeColor}; margin: 0; font-weight: 700; text-align: left; }
    .title p { font-size: 11px; color: #64748b; margin-top: 2px; text-align: left; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { font-size: 12px; }
    td { font-size: 11px; padding: 8px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    
    .totals-box { margin-top: 20px; border: 2px solid ${themeColor}; border-radius: 12px; padding: 16px; background: ${themeBg}; font-size: 13px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
    .final-balance { font-size: 15px; color: ${themeText}; font-weight: 900; }
    
    .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px dashed #e2e8f0; padding-top: 15px; }
    .stamp { border: 2px dashed #cbd5e1; border-radius: 6px; padding: 6px 16px; font-size: 12px; font-weight: 700; color: ${themeColor}; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <div class="company-logo">م</div>
      <div>
        <h1>${companyName}</h1>
        <p>🏢 ${companyAddress} &nbsp;|&nbsp; 📞 هاتف: ${companyPhone}</p>
      </div>
    </div>
    <div class="title">
      <h2>${title}</h2>
      <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        ${headerHTML}
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>

  <div class="footer">
    <div>تم توليد التقرير تلقائياً عبر نظام المثنى للأدوية ERP.</div>
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

  // Recharts preparation
  const chartData = [
    { name: 'المبيعات (داخل)', 'المتوقع': summary?.totalSales || 0, 'الفعلي/المدفوع': summary?.totalSalesPaid || 0, fill: '#10b981' },
    { name: 'المشتريات (خارج)', 'المتوقع': summary?.totalPurchases || 0, 'الفعلي/المدفوع': summary?.totalPurchasesPaid || 0, fill: '#3b82f6' },
    { name: 'المصاريف (خارج)', 'الفعلي/المدفوع': summary?.totalExpenses || 0, fill: '#f43f5e' },
  ];

  const expenseByCategory = categories.map(cat => {
    const total = expenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, value: total };
  }).filter(item => item.value > 0);

  const COLORS = ['#0d9488', '#3b82f6', '#f43f5e', '#8b5cf6', '#eab308', '#06b6d4', '#ec4899'];

  // Excel exports
  const handleExportExcel = (type: 'expenses' | 'revenues' | 'safe') => {
    const companyName = settings?.name || "المثنى للأدوية";
    let headers: string[] = [];
    let rows: any[] = [];
    let title = "";

    if (type === 'expenses') {
      headers = ['رقم السجل', 'تاريخ الصرف', 'رقم المستند', 'طريقة الدفع', 'القيمة (SDG)', 'الفئة', 'البيان والتفاصيل', 'المسجل'];
      title = "كشف المصاريف والمنصرفات";
      rows = filteredExpenses.map((exp, idx) => [
        idx + 1,
        new Date(exp.date).toLocaleDateString('ar-SA'),
        exp.documentNumber || '---',
        translatePaymentMethod(exp.paymentMethod),
        exp.amount,
        exp.category?.name || 'عام',
        exp.description || '---',
        exp.user?.name || '---'
      ]);
    } else if (type === 'revenues') {
      headers = ['رقم السجل', 'التاريخ', 'رقم المستند', 'طريقة الدفع', 'القيمة (SDG)', 'الفئة', 'البيان والتفاصيل', 'المسجل'];
      title = "كشف المقبوضات والإيرادات";
      rows = filteredRevenues.map((rev, idx) => [
        idx + 1,
        new Date(rev.date).toLocaleDateString('ar-SA'),
        rev.documentNumber || '---',
        'نقداً',
        rev.amount,
        rev.category?.name || 'عام',
        rev.description || '---',
        rev.user?.name || '---'
      ]);
    } else {
      headers = ['رقم الحركة', 'رقم المستند', 'التاريخ', 'طريقة الدفع', 'البيان', 'الوارد (له)', 'المنصرف (عليه)', 'المسجل'];
      title = "دفتر قيود الصندوق";
      rows = filteredSafeTx.map((tx) => [
        tx.transactionCode,
        tx.documentNumber || '---',
        new Date(tx.date).toLocaleDateString('ar-SA'),
        translatePaymentMethod(tx.paymentMethod),
        tx.description,
        tx.type === 'INFLOW' ? tx.amount : 0,
        tx.type === 'OUTFLOW' ? tx.amount : 0,
        tx.user
      ]);
    }

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
      '   <Font ss:FontName="Calibri" ss:Size="18" ss:Color="#0d9488" ss:Bold="1"/>\n' +
      '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n' +
      '  </Style>\n' +
      '  <Style ss:ID="Title">\n' +
      '   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#1f2937" ss:Bold="1"/>\n' +
      '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n' +
      '  </Style>\n' +
      '  <Style ss:ID="Header">\n' +
      '   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>\n' +
      '   <Interior ss:Color="#0d9488" ss:Pattern="Solid"/>\n' +
      '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n' +
      '  </Style>\n' +
      '  <Style ss:ID="Cell">\n' +
      '   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>\n' +
      '  </Style>\n' +
      ' </Styles>\n' +
      '  <Worksheet ss:Name="كشف الحساب">\n' +
      '   <Table>\n' +
      colDefs + '\n';

    xml += '   <Row ss:Height="35">\n';
    xml += '    <Cell ss:MergeAcross="' + (headers.length - 1) + '" ss:StyleID="CompanyHeader"><Data ss:Type="String">' + companyName + '</Data></Cell>\n';
    xml += '   </Row>\n';

    xml += '   <Row ss:Height="25">\n';
    xml += '    <Cell ss:MergeAcross="' + (headers.length - 1) + '" ss:StyleID="Title"><Data ss:Type="String">' + title + '</Data></Cell>\n';
    xml += '   </Row>\n';

    xml += '   <Row ss:Height="15"></Row>\n';

    // Headers
    xml += '   <Row ss:Height="25">\n';
    headers.forEach(h => {
      xml += '    <Cell ss:StyleID="Header"><Data ss:Type="String">' + h + '</Data></Cell>\n';
    });
    xml += '   </Row>\n';

    // Rows
    rows.forEach(row => {
      xml += '   <Row ss:Height="20">\n';
      row.forEach((cell: any) => {
        const cellType = typeof cell === 'number' ? 'Number' : 'String';
        xml += `    <Cell ss:StyleID="Cell"><Data ss:Type="${cellType}">${cell}</Data></Cell>\n`;
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
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Arabic PM
  const translatePaymentMethod = (m: string) => {
    switch (m) {
      case 'CASH': return 'نقداً';
      case 'BANK_TRANSFER': return 'تحويل بنكي';
      case 'CHECK': return 'شيك';
      case 'MOBILE_MONEY': return 'باقة إلكترونية / بنكك';
      default: return 'نقداً';
    }
  };

  const translateSource = (s: string) => {
    switch (s) {
      case 'SALE': return 'مبيعات';
      case 'PURCHASE': return 'مشتريات';
      case 'EXPENSE': return 'مصروفات';
      case 'REVENUE': return 'إيرادات';
      case 'SUPPLIER_PAYMENT': return 'دفعة لمورد';
      case 'RETURN': return 'مرتجع';
      case 'MANUAL': return 'يدوي / تسوية';
      default: return 'أخرى';
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">إدارة الحسابات والخزينة</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">تتبع التدفقات المالية والنقدية، الأرباح، الصندوق وحركة المصاريف والإيرادات</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl text-sm hover:bg-[var(--border-color)] transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>فئات المصاريف</span>
          </button>
          <button 
            onClick={() => setShowRevenueCategoryModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl text-sm hover:bg-[var(--border-color)] transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>فئات الإيرادات</span>
          </button>
          <button 
            onClick={() => {
              setNewSafeTx({ amount: '', type: 'INFLOW', paymentMethod: 'CASH', reference: '', documentNumber: '', description: '', date: new Date().toISOString().split('T')[0] });
              setShowSafeModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>حركة صندوق جديدة</span>
          </button>
          <button 
            onClick={() => {
              setNewExpense({ amount: '', description: '', date: new Date().toISOString().split('T')[0], categoryId: categories[0]?.id || '', documentNumber: '', paymentMethod: 'CASH' });
              setShowExpenseModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-rose-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مصروف جديد</span>
          </button>
          <button 
            onClick={() => {
              setNewRevenue({ amount: '', description: '', date: new Date().toISOString().split('T')[0], categoryId: revenueCategories[0]?.id || '', documentNumber: '', paymentMethod: 'CASH' });
              setShowRevenueModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل إيراد جديد</span>
          </button>
        </div>
      </div>

      {/* Date Presets and Filters */}
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

        {/* Tab switchers */}
        <div className="flex flex-wrap bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] w-full lg:w-auto mt-4 lg:mt-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-teal-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>الأداء المالي</span>
          </button>
          <button
            onClick={() => setActiveTab('safe')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'safe' ? 'bg-teal-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>الخزينة والصندوق</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'expenses' ? 'bg-teal-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>المصاريف</span>
          </button>
          <button
            onClick={() => setActiveTab('revenues')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'revenues' ? 'bg-teal-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>الإيرادات</span>
          </button>
          <button
            onClick={() => setActiveTab('profit-loss')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profit-loss' ? 'bg-teal-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>الأرباح والخسائر</span>
          </button>
        </div>
      </div>

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
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Safe Balance Card */}
                <div className="glass-card p-5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent flex justify-between items-center relative overflow-hidden">
                  <div className="space-y-2">
                    <span className="text-xs text-[var(--text-secondary)] font-bold">رصيد الصندوق / الخزينة الحالي</span>
                    <h2 className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                      {(fundSummary?.currentBalance || 0).toLocaleString()} <span className="text-xs">SDG</span>
                    </h2>
                    <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span>وارد الفترة: <strong>{(fundSummary?.totalInflow || 0).toLocaleString()} SDG</strong></span>
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                    <Briefcase className="w-6 h-6" />
                  </div>
                </div>

                {/* Sales Income Card */}
                <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent flex justify-between items-center relative overflow-hidden">
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

                {/* Purchases Outcomes Card */}
                <div className="glass-card p-5 rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent flex justify-between items-center relative overflow-hidden">
                  <div className="space-y-2">
                    <span className="text-xs text-[var(--text-secondary)] font-bold">فواتير الشراء (المستودع)</span>
                    <h2 className="text-2xl font-black text-yellow-600 dark:text-yellow-400 font-mono">
                      {(summary?.totalPurchases || 0).toLocaleString()} <span className="text-xs">SDG</span>
                    </h2>
                    <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-red-500" />
                      <span>المسدد للموردين: <strong>{(summary?.totalPurchasesPaid || 0).toLocaleString()} SDG</strong></span>
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-2xl">
                    <ArrowDownRight className="w-6 h-6" />
                  </div>
                </div>

                {/* Expenses Card */}
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
              </div>

              {/* Safe Toggles & Recharts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Safe linking settings */}
                <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] space-y-4">
                  <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                    <Settings className="w-5 h-5 text-teal-500" />
                    <h3 className="text-base font-bold text-[var(--text-primary)]">ربط الصندوق بالعمليات</h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">حدد العمليات التي تؤثر بشكل تلقائي ومباشر على رصيد الخزينة والصندوق اليومي:</p>
                  
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] cursor-pointer hover:border-teal-500/30 transition-all">
                      <span className="text-xs font-bold text-[var(--text-primary)]">إضافة مبالغ المبيعات والعملاء للصندوق</span>
                      <input 
                        type="checkbox"
                        checked={settings?.linkSalesToFund ?? true}
                        onChange={(e) => handleToggleSettings('linkSalesToFund', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] cursor-pointer hover:border-teal-500/30 transition-all">
                      <span className="text-xs font-bold text-[var(--text-primary)]">خصم مبالغ المشتريات والموردين من الصندوق</span>
                      <input 
                        type="checkbox"
                        checked={settings?.linkPurchasesToFund ?? true}
                        onChange={(e) => handleToggleSettings('linkPurchasesToFund', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] cursor-pointer hover:border-teal-500/30 transition-all">
                      <span className="text-xs font-bold text-[var(--text-primary)]">خصم مبالغ المصروفات من الصندوق</span>
                      <input 
                        type="checkbox"
                        checked={settings?.linkExpensesToFund ?? true}
                        onChange={(e) => handleToggleSettings('linkExpensesToFund', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300"
                      />
                    </label>
                  </div>
                </div>

                {/* Composed Chart */}
                <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] lg:col-span-2 space-y-4">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">مقارنة التدفقات المالية (المبيعات مقابل المنصرفات)</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                        <YAxis stroke="var(--text-secondary)" fontSize={10} />
                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()} SDG`} />
                        <Legend />
                        <Bar dataKey="المتوقع" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={25} />
                        <Bar dataKey="الفعلي/المدفوع" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAFE / FUND LEDGER */}
          {activeTab === 'safe' && (
            <div className="space-y-6 animate-fade-in-slide">
              <div className="glass-card p-4 rounded-2xl flex flex-wrap justify-between items-center gap-4">
                <div className="flex flex-wrap gap-3 flex-1">
                  <div className="flex items-center gap-2.5 px-3 py-2 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                    <input 
                      type="text"
                      value={safeSearch}
                      onChange={(e) => setSafeSearch(e.target.value)}
                      placeholder="ابحث برقم الحركة، البيان، رقم المستند..."
                      className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)]"
                    />
                  </div>

                  <select
                    value={selectedSafeMethod}
                    onChange={(e) => setSelectedSafeMethod(e.target.value)}
                    className="px-3 py-2 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    <option value="">كل طرق الدفع</option>
                    <option value="CASH">نقداً</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CHECK">شيك</option>
                    <option value="MOBILE_MONEY">بنكك</option>
                  </select>

                  <select
                    value={selectedSafeSource}
                    onChange={(e) => setSelectedSafeSource(e.target.value)}
                    className="px-3 py-2 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                  >
                    <option value="">كل المصادر</option>
                    <option value="SALE">مبيعات</option>
                    <option value="PURCHASE">مشتريات</option>
                    <option value="EXPENSE">مصروفات</option>
                    <option value="REVENUE">إيرادات</option>
                    <option value="SUPPLIER_PAYMENT">دفعات موردين</option>
                    <option value="RETURN">مرتجع</option>
                    <option value="MANUAL">يدوي / تسوية</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportExcel('safe')}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>تصدير Excel</span>
                  </button>
                  <button 
                    onClick={() => handleExportPDF('safe')}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>تصدير PDF ملون</span>
                  </button>
                </div>
              </div>

              {/* Fund balance card banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-sm opacity-90">رصيد الخزينة الكلي الحالي</h4>
                  <h1 className="text-3xl sm:text-4xl font-black font-mono mt-1">
                    {(fundSummary?.currentBalance || 0).toLocaleString()} <span className="text-sm font-normal">SDG</span>
                  </h1>
                </div>
                <div className="flex gap-4 text-xs opacity-90">
                  <div className="bg-white/10 p-3 rounded-xl">
                    <p>إجمالي الوارد بالفترة</p>
                    <p className="font-bold font-mono text-sm mt-0.5">{(fundSummary?.totalInflow || 0).toLocaleString()} SDG</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl">
                    <p>إجمالي المنصرف بالفترة</p>
                    <p className="font-bold font-mono text-sm mt-0.5">{(fundSummary?.totalOutflow || 0).toLocaleString()} SDG</p>
                  </div>
                </div>
              </div>

              {/* Safe Ledger Table */}
              <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-bold">
                        <th className="p-4 text-center">رقم الحركة</th>
                        <th className="p-4 text-center">رقم المستند</th>
                        <th className="p-4 text-center">التاريخ</th>
                        <th className="p-4 text-center">طريقة الدفع</th>
                        <th className="p-4">البيان والتفاصيل</th>
                        <th className="p-4 text-center">وارد (له)</th>
                        <th className="p-4 text-center">منصرف (عليه)</th>
                        <th className="p-4 text-center">المسجل</th>
                        <th className="p-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-primary)]">
                      {paginatedSafeTx.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-[var(--text-secondary)]">لا توجد حركات مسجلة بالخزينة تتطابق مع شروط البحث.</td>
                        </tr>
                      ) : (
                        paginatedSafeTx.map((tx) => (
                          <tr key={tx.id} className="hover:bg-[var(--border-color)]/20 transition-colors">
                            <td className="p-4 text-center font-bold text-teal-600 font-mono">{tx.transactionCode}</td>
                            <td className="p-4 text-center font-mono">{tx.documentNumber || '---'}</td>
                            <td className="p-4 text-center font-mono">{new Date(tx.date).toLocaleDateString('ar-SA')}</td>
                            <td className="p-4 text-center font-bold text-[var(--text-secondary)]">{translatePaymentMethod(tx.paymentMethod)}</td>
                            <td className="p-4 font-medium">{tx.description}</td>
                            <td className="p-4 text-center font-bold text-emerald-600 font-mono">
                              {tx.type === 'INFLOW' ? `+${tx.amount.toLocaleString()}` : '0'} SDG
                            </td>
                            <td className="p-4 text-center font-bold text-rose-600 font-mono">
                              {tx.type === 'OUTFLOW' ? `-${tx.amount.toLocaleString()}` : '0'} SDG
                            </td>
                            <td className="p-4 text-center text-[var(--text-secondary)]">{tx.user}</td>
                            <td className="p-4 text-center">
                              {tx.source === 'MANUAL' ? (
                                <button 
                                  onClick={() => handleDeleteSafeTx(tx.id)}
                                  className="text-rose-600 hover:text-rose-700 p-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                                  title="حذف الحركة اليدوية"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-[var(--text-secondary)] italic">آلي</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)]/30 border-t border-[var(--border-color)]">
                  {renderPagination(safePage, safePageSize, filteredSafeTx.length, setSafePage, setSafePageSize)}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXPENSES LOG */}
          {activeTab === 'expenses' && (
            <div className="space-y-6 animate-fade-in-slide">
              <div className="glass-card p-4 rounded-2xl flex flex-wrap justify-between items-center gap-4">
                <div className="flex flex-wrap gap-3 flex-1">
                  <div className="flex items-center gap-2.5 px-3 py-2 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                    <input 
                      type="text"
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      placeholder="ابحث بوصف المصروف، فئة المصاريف، رقم المستند..."
                      className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)]"
                    />
                  </div>

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

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportExcel('expenses')}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>تصدير Excel</span>
                  </button>
                  <button 
                    onClick={() => handleExportPDF('expenses')}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>تصدير PDF ملون</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-bold">
                        <th className="p-4 text-center">#</th>
                        <th className="p-4 text-center">التاريخ</th>
                        <th className="p-4 text-center">رقم المستند</th>
                        <th className="p-4 text-center">طريقة الدفع</th>
                        <th className="p-4 text-center">المبلغ (SDG)</th>
                        <th className="p-4 text-center">فئة المصروف</th>
                        <th className="p-4">البيان والتفاصيل</th>
                        <th className="p-4 text-center">المسجل</th>
                        <th className="p-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-primary)]">
                      {paginatedExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-[var(--text-secondary)]">لا توجد مصاريف مسجلة.</td>
                        </tr>
                      ) : (
                        paginatedExpenses.map((exp, idx) => (
                          <tr key={exp.id} className="hover:bg-[var(--border-color)]/20 transition-colors">
                            <td className="p-4 text-center font-mono">{(expensePage - 1) * expensePageSize + idx + 1}</td>
                            <td className="p-4 text-center font-mono">{new Date(exp.date).toLocaleDateString('ar-SA')}</td>
                            <td className="p-4 text-center font-mono">{exp.documentNumber || '---'}</td>
                            <td className="p-4 text-center font-bold">{translatePaymentMethod(exp.paymentMethod)}</td>
                            <td className="p-4 text-center font-bold text-rose-600 font-mono">{exp.amount.toLocaleString()} SDG</td>
                            <td className="p-4 text-center font-bold text-teal-600">{exp.category?.name || 'عام'}</td>
                            <td className="p-4">{exp.description || '---'}</td>
                            <td className="p-4 text-center text-[var(--text-secondary)]">{exp.user?.name || '---'}</td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="text-rose-600 hover:text-rose-700 p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors cursor-pointer"
                                title="حذف المصروف"
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
                <div className="p-4 bg-[var(--bg-secondary)]/30 border-t border-[var(--border-color)]">
                  {renderPagination(expensePage, expensePageSize, filteredExpenses.length, setExpensePage, setExpensePageSize)}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REVENUES LOG */}
          {activeTab === 'revenues' && (
            <div className="space-y-6 animate-fade-in-slide">
              {/* Sub-tab Switcher for Collections vs Direct Revenues */}
              <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] max-w-md">
                <button
                  type="button"
                  onClick={() => setRevenueSubTab('sales-collections')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    revenueSubTab === 'sales-collections'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>التحصيل الفعلي للفواتير والمبيعات</span>
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    revenueSubTab === 'sales-collections' ? 'bg-white/20 text-white' : 'bg-[var(--border-color)]/50 text-[var(--text-secondary)]'
                  }`}>
                    {fundTransactions.filter(tx => tx.source === 'SALE' && tx.type === 'INFLOW').length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueSubTab('other-revenues')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    revenueSubTab === 'other-revenues'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>الإيرادات والمقبوضات الأخرى</span>
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    revenueSubTab === 'other-revenues' ? 'bg-white/20 text-white' : 'bg-[var(--border-color)]/50 text-[var(--text-secondary)]'
                  }`}>
                    {revenues.length}
                  </span>
                </button>
              </div>

              {/* Sales Invoice Collections Table */}
              {revenueSubTab === 'sales-collections' && (
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="glass-card p-4 rounded-2xl flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-2.5 px-3 py-2 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] flex-1 min-w-[250px]">
                      <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                      <input 
                        type="text"
                        value={revenueSearch}
                        onChange={(e) => setRevenueSearch(e.target.value)}
                        placeholder="ابحث برقم الحركة، البيان، رقم الفاتورة..."
                        className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleExportExcel('safe')} // Export collections via Safe format
                        className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>تصدير Excel</span>
                      </button>
                      <button 
                        onClick={() => handleExportPDF('revenues-collections')}
                        className="flex items-center justify-center gap-2 px-3.5 py-2 bg-teal-600/10 hover:bg-teal-600/20 text-teal-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>تصدير PDF ملون</span>
                      </button>
                    </div>
                  </div>

                  {/* Collections Table */}
                  <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-bold">
                            <th className="p-4 text-center">رقم الحركة</th>
                            <th className="p-4 text-center">رقم المستند</th>
                            <th className="p-4 text-center">التاريخ</th>
                            <th className="p-4 text-center">طريقة التحصيل</th>
                            <th className="p-4">البيان والتفاصيل</th>
                            <th className="p-4 text-center">المبلغ المحصل (SDG)</th>
                            <th className="p-4 text-center">المسجل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-primary)]">
                          {paginatedCollections.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">لا توجد حركات تحصيل فواتير مسجلة للفترة المحددة.</td>
                            </tr>
                          ) : (
                            paginatedCollections.map((tx) => (
                              <tr key={tx.id} className="hover:bg-[var(--border-color)]/20 transition-colors">
                                <td className="p-4 text-center font-bold text-teal-600 font-mono">{tx.transactionCode}</td>
                                <td className="p-4 text-center font-mono">{tx.documentNumber || '---'}</td>
                                <td className="p-4 text-center font-mono">{new Date(tx.date).toLocaleDateString('ar-SA')}</td>
                                <td className="p-4 text-center font-bold">{translatePaymentMethod(tx.paymentMethod)}</td>
                                <td className="p-4 font-medium">{tx.description}</td>
                                <td className="p-4 text-center font-bold text-emerald-600 font-mono">+{tx.amount.toLocaleString()} SDG</td>
                                <td className="p-4 text-center text-[var(--text-secondary)]">{tx.user}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 bg-[var(--bg-secondary)]/30 border-t border-[var(--border-color)]">
                      {renderPagination(collectionsPage, collectionsPageSize, filteredCollections.length, setCollectionsPage, setCollectionsPageSize)}
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Revenues Table */}
              {revenueSubTab === 'other-revenues' && (
                <div className="space-y-6 animate-fade-in-slide">
                  <div className="glass-card p-4 rounded-2xl flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-wrap gap-3 flex-1">
                      <div className="flex items-center gap-2.5 px-3 py-2 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                        <input 
                          type="text"
                          value={revenueSearch}
                          onChange={(e) => setRevenueSearch(e.target.value)}
                          placeholder="ابحث بوصف الإيراد، فئة الإيرادات، رقم المستند..."
                          className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)]"
                        />
                      </div>

                      <select
                        value={selectedRevenueCategoryId}
                        onChange={(e) => setSelectedRevenueCategoryId(e.target.value)}
                        className="px-3 py-2 border border-[var(--border-color)] rounded-xl bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none cursor-pointer"
                      >
                        <option value="">كل فئات الإيرادات</option>
                        {revenueCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleExportExcel('revenues')}
                        className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>تصدير Excel</span>
                      </button>
                      <button 
                        onClick={() => handleExportPDF('revenues-other')}
                        className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>تصدير PDF ملون</span>
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-bold">
                            <th className="p-4 text-center">#</th>
                            <th className="p-4 text-center">التاريخ</th>
                            <th className="p-4 text-center">رقم المستند</th>
                            <th className="p-4 text-center">طريقة الدفع</th>
                            <th className="p-4 text-center">المبلغ (SDG)</th>
                            <th className="p-4 text-center">فئة الإيراد</th>
                            <th className="p-4">البيان والتفاصيل</th>
                            <th className="p-4 text-center">المسجل</th>
                            <th className="p-4 text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-primary)]">
                          {paginatedRevenues.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-[var(--text-secondary)]">لا توجد إيرادات مسجلة.</td>
                            </tr>
                          ) : (
                            paginatedRevenues.map((rev, idx) => (
                              <tr key={rev.id} className="hover:bg-[var(--border-color)]/20 transition-colors">
                                <td className="p-4 text-center font-mono">{(otherRevenuesPage - 1) * otherRevenuesPageSize + idx + 1}</td>
                                <td className="p-4 text-center font-mono">{new Date(rev.date).toLocaleDateString('ar-SA')}</td>
                                <td className="p-4 text-center font-mono">{rev.documentNumber || '---'}</td>
                                <td className="p-4 text-center font-bold">نقداً</td>
                                <td className="p-4 text-center font-bold text-emerald-600 font-mono">{rev.amount.toLocaleString()} SDG</td>
                                <td className="p-4 text-center font-bold text-teal-600">{rev.category?.name || 'عام'}</td>
                                <td className="p-4">{rev.description || '---'}</td>
                                <td className="p-4 text-center text-[var(--text-secondary)]">{rev.user?.name || '---'}</td>
                                <td className="p-4 text-center">
                                  <button 
                                    onClick={() => handleDeleteRevenue(rev.id)}
                                    className="text-rose-600 hover:text-rose-700 p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors cursor-pointer"
                                    title="حذف الإيراد"
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
                    <div className="p-4 bg-[var(--bg-secondary)]/30 border-t border-[var(--border-color)]">
                      {renderPagination(otherRevenuesPage, otherRevenuesPageSize, filteredRevenues.length, setOtherRevenuesPage, setOtherRevenuesPageSize)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROFIT & LOSS */}
          {activeTab === 'profit-loss' && (
            <div className="space-y-6 animate-fade-in-slide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expected Profits */}
                <div className="glass-card p-6 rounded-2xl border border-[var(--border-color)] space-y-4">
                  <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-base font-bold text-[var(--text-primary)]">الأرباح والخسائر المتوقعة (الاستحقاق)</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs py-1 border-b border-[var(--border-color)]">
                      <span className="text-[var(--text-secondary)]">إجمالي المبيعات (المستحق)</span>
                      <span className="font-bold font-mono text-emerald-600">{(summary?.totalSales || 0).toLocaleString()} SDG</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1 border-b border-[var(--border-color)]">
                      <span className="text-[var(--text-secondary)]">إجمالي المشتريات (المستحق)</span>
                      <span className="font-bold font-mono text-rose-600">{(summary?.totalPurchases || 0).toLocaleString()} SDG</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1 border-b border-[var(--border-color)]">
                      <span className="text-[var(--text-secondary)]">إجمالي المصاريف اليومية</span>
                      <span className="font-bold font-mono text-rose-600">{(summary?.totalExpenses || 0).toLocaleString()} SDG</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-2 font-bold bg-[var(--bg-secondary)] px-3 rounded-lg">
                      <span>صافي الأرباح المتوقعة</span>
                      <span className={`font-mono ${(summary?.netProfitExpected || 0) >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                        {(summary?.netProfitExpected || 0).toLocaleString()} SDG
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actual Realized Profits */}
                <div className="glass-card p-6 rounded-2xl border border-[var(--border-color)] space-y-4">
                  <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                    <DollarSign className="w-5 h-5 text-teal-600" />
                    <h3 className="text-base font-bold text-[var(--text-primary)]">الأرباح والخسائر الفعلية (النقدي المحصل)</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs py-1 border-b border-[var(--border-color)]">
                      <span className="text-[var(--text-secondary)]">المبيعات المحصلة نقداً فعلياً</span>
                      <span className="font-bold font-mono text-emerald-600">{(summary?.totalSalesPaid || 0).toLocaleString()} SDG</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1 border-b border-[var(--border-color)]">
                      <span className="text-[var(--text-secondary)]">المشتريات المسددة للموردين</span>
                      <span className="font-bold font-mono text-rose-600">{(summary?.totalPurchasesPaid || 0).toLocaleString()} SDG</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-1 border-b border-[var(--border-color)]">
                      <span className="text-[var(--text-secondary)]">إجمالي المصاريف اليومية</span>
                      <span className="font-bold font-mono text-rose-600">{(summary?.totalExpenses || 0).toLocaleString()} SDG</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-2 font-bold bg-[var(--bg-secondary)] px-3 rounded-lg">
                      <span>صافي الأرباح الفعلية المحققة</span>
                      <span className={`font-mono ${(summary?.netProfitActual || 0) >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                        {(summary?.netProfitActual || 0).toLocaleString()} SDG
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-2xl animate-scale-in" dir="rtl">
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">تسجيل مصروف جديد</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddExpenseSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">قيمة المبلغ (SDG)</label>
                <input 
                  type="number"
                  required
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">فئة المصروف</label>
                <select
                  required
                  value={newExpense.categoryId}
                  onChange={(e) => setNewExpense({ ...newExpense, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                >
                  <option value="">اختر الفئة</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">رقم المستند / العملية</label>
                <input 
                  type="text"
                  value={newExpense.documentNumber}
                  onChange={(e) => setNewExpense({ ...newExpense, documentNumber: e.target.value })}
                  placeholder="مثال: 78"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">طريقة الدفع</label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                >
                  <option value="CASH">نقداً</option>
                  <option value="BANK_TRANSFER">تحويل بنكي</option>
                  <option value="CHECK">شيك</option>
                  <option value="MOBILE_MONEY">بنكك</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">التاريخ</label>
                <DatePicker 
                  value={newExpense.date}
                  onChange={(val) => setNewExpense({ ...newExpense, date: val })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">البيان والتفاصيل</label>
                <textarea 
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="شرح وتفاصيل للمصروف..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">حفظ المصروف</button>
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl text-sm transition-colors cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revenue Modal */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-2xl animate-scale-in" dir="rtl">
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">تسجيل إيراد جديد</h3>
              <button onClick={() => setShowRevenueModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddRevenueSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">قيمة المبلغ (SDG)</label>
                <input 
                  type="number"
                  required
                  value={newRevenue.amount}
                  onChange={(e) => setNewRevenue({ ...newRevenue, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">فئة الإيراد</label>
                <select
                  required
                  value={newRevenue.categoryId}
                  onChange={(e) => setNewRevenue({ ...newRevenue, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                >
                  <option value="">اختر الفئة</option>
                  {revenueCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">رقم المستند / العملية</label>
                <input 
                  type="text"
                  value={newRevenue.documentNumber}
                  onChange={(e) => setNewRevenue({ ...newRevenue, documentNumber: e.target.value })}
                  placeholder="مثال: 120"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">طريقة القبض</label>
                <select
                  value={newRevenue.paymentMethod}
                  onChange={(e) => setNewRevenue({ ...newRevenue, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                >
                  <option value="CASH">نقداً</option>
                  <option value="BANK_TRANSFER">تحويل بنكي</option>
                  <option value="CHECK">شيك</option>
                  <option value="MOBILE_MONEY">بنكك</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">التاريخ</label>
                <DatePicker 
                  value={newRevenue.date}
                  onChange={(val) => setNewRevenue({ ...newRevenue, date: val })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">البيان والتفاصيل</label>
                <textarea 
                  value={newRevenue.description}
                  onChange={(e) => setNewRevenue({ ...newRevenue, description: e.target.value })}
                  placeholder="شرح وتفاصيل للإيراد..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">حفظ الإيراد</button>
                <button type="button" onClick={() => setShowRevenueModal(false)} className="flex-1 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl text-sm transition-colors cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Modal */}
      {showSafeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-2xl animate-scale-in" dir="rtl">
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">تسجيل حركة صندوق يدوية</h3>
              <button onClick={() => setShowSafeModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddSafeTxSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">نوع الحركة</label>
                <select
                  value={newSafeTx.type}
                  onChange={(e) => setNewSafeTx({ ...newSafeTx, type: e.target.value as 'INFLOW' | 'OUTFLOW' })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                >
                  <option value="INFLOW">وارد (إضافة للخزينة / قبض)</option>
                  <option value="OUTFLOW">منصرف (سحب من الخزينة / صرف)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">قيمة المبلغ (SDG)</label>
                <input 
                  type="number"
                  required
                  value={newSafeTx.amount}
                  onChange={(e) => setNewSafeTx({ ...newSafeTx, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">طريقة الدفع</label>
                <select
                  value={newSafeTx.paymentMethod}
                  onChange={(e) => setNewSafeTx({ ...newSafeTx, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                >
                  <option value="CASH">نقداً</option>
                  <option value="BANK_TRANSFER">تحويل بنكي</option>
                  <option value="CHECK">شيك</option>
                  <option value="MOBILE_MONEY">بنكك</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">رقم المستند / المرجع</label>
                <input 
                  type="text"
                  value={newSafeTx.documentNumber}
                  onChange={(e) => setNewSafeTx({ ...newSafeTx, documentNumber: e.target.value })}
                  placeholder="رقم الفاتورة أو مرجع السند"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">التاريخ</label>
                <DatePicker 
                  value={newSafeTx.date}
                  onChange={(val) => setNewSafeTx({ ...newSafeTx, date: val })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">البيان والتفاصيل</label>
                <textarea 
                  required
                  value={newSafeTx.description}
                  onChange={(e) => setNewSafeTx({ ...newSafeTx, description: e.target.value })}
                  placeholder="شرح للعملية والسبب..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">حفظ الحركة</button>
                <button type="button" onClick={() => setShowSafeModal(false)} className="flex-1 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl text-sm transition-colors cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-2xl animate-scale-in" dir="rtl">
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">فئات المصاريف</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 space-y-4">
              <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
                <input 
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="اسم الفئة الجديدة..."
                  className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                />
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">إضافة</button>
              </form>

              <div className="max-h-[200px] overflow-y-auto divide-y divide-[var(--border-color)]">
                {categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center py-2.5">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <button 
                      onClick={() => {
                        if (confirm(`هل تريد بالتأكيد حذف فئة "${cat.name}"؟`)) {
                          deleteCategory(cat.id);
                        }
                      }}
                      className="text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Category Modal */}
      {showRevenueCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-2xl animate-scale-in" dir="rtl">
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">فئات الإيرادات</h3>
              <button onClick={() => setShowRevenueCategoryModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 space-y-4">
              <form onSubmit={handleAddRevenueCategorySubmit} className="flex gap-2">
                <input 
                  type="text"
                  required
                  value={newRevenueCategoryName}
                  onChange={(e) => setNewRevenueCategoryName(e.target.value)}
                  placeholder="اسم الفئة الجديدة..."
                  className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
                />
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">إضافة</button>
              </form>

              <div className="max-h-[200px] overflow-y-auto divide-y divide-[var(--border-color)]">
                {revenueCategories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center py-2.5">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <button 
                      onClick={() => {
                        if (confirm(`هل تريد بالتأكيد حذف فئة "${cat.name}"؟`)) {
                          deleteRevenueCategory(cat.id);
                        }
                      }}
                      className="text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
