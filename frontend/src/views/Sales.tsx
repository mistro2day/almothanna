import React, { useState, useEffect } from 'react';
import { useInventoryStore, Batch } from '../store/useInventoryStore';
import { useSalesStore, Customer, CartItem } from '../store/useSalesStore';
import { apiClient } from '../api/apiClient';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { useActivityStore } from '../store/useActivityStore';
import { 
  ShoppingCart, 
  UserCheck, 
  Calendar, 
  AlertCircle, 
  FileText,
  CreditCard,
  TrendingUp,
  Plus,
  X,
  Search,
  Printer,
  DollarSign,
  CheckCircle2,
  Download,
  Trash2,
  Edit3,
  MoreVertical,
  ArrowRight,
  Save
} from 'lucide-react';
import DatePicker from '../components/DatePicker';

interface InvoiceItem {
  productName: string;
  batchNumber: string;
  qty: number;
  price: number;
}

interface InvoiceInstallment {
  id: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  notes?: string;
}

interface Invoice {
  id: string;
  customerName: string;
  total: number;
  paid: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  createdAt: string;
  items: InvoiceItem[];
  installments?: InvoiceInstallment[];
}

type ViewType = 'dashboard' | 'inventory' | 'sales' | 'customers' | 'suppliers';

export default function Sales() {
  const { products, batches, getFEFOBatches, decrementBatchQty } = useInventoryStore();
  const { customers, cart, addToCart, removeFromCart, updateCartQty, clearCart, addCustomer } = useSalesStore();
  const { settings } = useSettingsStore();
  const { user } = useAuthStore();

  // Price List States
  const [showPriceListModal, setShowPriceListModal] = useState(false);
  const [priceListSearch, setPriceListSearch] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'name',
    'price',
    'qty',
    'expiryDate'
  ]);
  const [priceListHistory, setPriceListHistory] = useState<{
    id: string;
    title: string;
    date: string;
    columns: string[];
    filters: string;
  }[]>([]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('price_list_history');
    if (saved) {
      try {
        setPriceListHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveHistory = (newHistory: typeof priceListHistory) => {
    setPriceListHistory(newHistory);
    localStorage.setItem('price_list_history', JSON.stringify(newHistory));
  };

  const getPriceListRows = () => {
    const showBatchDetails = selectedColumns.includes('batchNumber') || selectedColumns.includes('expiryDate');

    if (showBatchDetails) {
      return batches
        .filter(b => b.qty > 0)
        .map(b => {
          const prod = products.find(p => p.id === b.productId);
          return {
            id: b.id,
            name: prod?.name || b.productName || 'منتج غير معروف',
            scientificName: prod?.scientificName || '---',
            category: prod?.category || '---',
            batchNumber: b.batchNumber,
            expiryDate: b.expiryDate,
            qty: b.qty,
            unit: prod?.unit || 'قطعة',
            price: Math.round(b.costPrice * 1.25)
          };
        })
        .filter(r => r.name.toLowerCase().includes(priceListSearch.toLowerCase()) || r.scientificName.toLowerCase().includes(priceListSearch.toLowerCase()));
    } else {
      return products
        .map(p => {
          const prodBatches = batches.filter(b => b.productId === p.id && b.qty > 0);
          const totalQty = prodBatches.reduce((sum, b) => sum + b.qty, 0);
          const firstBatch = prodBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
          const price = firstBatch ? Math.round(firstBatch.costPrice * 1.25) : 0;
          return {
            id: p.id,
            name: p.name,
            scientificName: p.scientificName || '---',
            category: p.category || '---',
            batchNumber: '---',
            expiryDate: '---',
            qty: totalQty,
            unit: p.unit,
            price
          };
        })
        .filter(r => r.qty > 0)
        .filter(r => r.name.toLowerCase().includes(priceListSearch.toLowerCase()) || r.scientificName.toLowerCase().includes(priceListSearch.toLowerCase()));
    }
  };

  const [columnsOrder, setColumnsOrder] = useState<string[]>([
    'scientificName',
    'category',
    'batchNumber',
    'expiryDate',
    'qty',
    'price'
  ]);

  const moveColumn = (key: string, direction: 'up' | 'down') => {
    const index = columnsOrder.indexOf(key);
    if (index === -1) return;
    const newOrder = [...columnsOrder];
    if (direction === 'up' && index > 0) {
      newOrder[index] = newOrder[index - 1];
      newOrder[index - 1] = key;
    } else if (direction === 'down' && index < columnsOrder.length - 1) {
      newOrder[index] = newOrder[index + 1];
      newOrder[index + 1] = key;
    }
    setColumnsOrder(newOrder);
  };

  const logPriceListExport = (type: 'PDF' | 'Excel', columns: string[]) => {
    const newEntry = {
      id: 'PL-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      title: `قائمة أسعار (${type === 'PDF' ? 'PDF' : 'Excel'})`,
      date: new Date().toLocaleString('ar-SA', { hour12: true }),
      columns,
      filters: priceListSearch ? `بحث: "${priceListSearch}"` : 'بدون تصفية'
    };
    const updated = [newEntry, ...priceListHistory];
    saveHistory(updated);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = priceListHistory.filter(item => item.id !== id);
    saveHistory(updated);
  };

  const exportPriceListPDF = (
    customColumns = ['name', ...columnsOrder.filter(col => selectedColumns.includes(col))],
    customSearch = priceListSearch
  ) => {
    const rows = getPriceListRows();
    const columnLabels: Record<string, string> = {
      name: 'اسم الدواء / المنتج',
      scientificName: 'الاسم العلمي',
      category: 'التصنيف',
      batchNumber: 'رقم التشغيلة',
      expiryDate: 'تاريخ الصلاحية',
      qty: 'الكمية المتوفرة',
      price: 'سعر البيع المقترح'
    };

    const currency = settings?.currency || "SDG";
    const companyName = settings?.name || "المثنى للأدوية";
    const companyPhone = settings?.phone || "0912345678";
    const companyAddress = settings?.address || "السودان - أمدرمان";
    const companyLogoHtml = settings?.logo 
      ? `<div class="logo-container"><img src="${settings.logo}" /></div>` 
      : '';
    const footerText = settings?.invoiceFooter || "شكراً لتعاملكم مع المثنى للأدوية";

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const headerCols = customColumns.map(col => `<th>${columnLabels[col] || col}</th>`).join('');

    const rowsHtml = rows.map((r: any, idx) => {
      const cols = customColumns.map(col => {
        if (col === 'price') return `<td style="text-align: center; font-weight: bold; color: #10b981;">${r.price.toLocaleString('en-US')} ${currency}</td>`;
        if (col === 'qty') return `<td style="text-align: center;">${r.qty} ${r.unit || ''}</td>`;
        if (col === 'expiryDate') return `<td style="text-align: center; direction: ltr;">${r.expiryDate}</td>`;
        if (col === 'batchNumber') return `<td style="text-align: center; font-weight: 500;">${r.batchNumber}</td>`;
        return `<td style="text-align: right;">${r[col]}</td>`;
      }).join('');
      return `<tr><td style="text-align: center; color: #64748b;">${idx + 1}</td>${cols}</tr>`;
    }).join('');

    printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>قائمة الأسعار الرسمية</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 15mm 12mm; }
    * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
    body { background: #fff; color: #1e293b; line-height: 1.6; padding: 10px; }
    .header-section { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 16px; margin-bottom: 25px; }
    .company-details { display: flex; align-items: center; gap: 15px; }
    .logo-container img { max-height: 70px; object-fit: contain; }
    .company-details h1 { font-size: 22px; color: #065f46; margin: 0 0 4px 0; }
    .company-details p { font-size: 12px; color: #64748b; margin: 0; }
    .doc-title { text-align: left; }
    .doc-title h2 { font-size: 24px; color: #10b981; margin: 0; }
    .doc-title p { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    
    .meta-bar { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 18px; margin-bottom: 25px; font-size: 13px; display: flex; justify-content: space-between; }
    .meta-bar span { color: #64748b; }
    .meta-bar strong { color: #0f172a; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #10b981; color: white; padding: 10px 8px; font-size: 13px; font-weight: 700; text-align: center; border: 1px solid #10b981; }
    td { padding: 10px 8px; font-size: 12px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    
    .footer { border-top: 2px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-top: 40px; }
    .stamp { border: 2px dashed #cbd5e1; border-radius: 8px; padding: 6px 18px; font-size: 13px; font-weight: 700; color: #10b981; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header-section">
    <div class="company-details">
      ${companyLogoHtml}
      <div>
        <h1>${companyName}</h1>
        <p>${companyAddress} &nbsp;|&nbsp; هاتف: ${companyPhone}</p>
      </div>
    </div>
    <div class="doc-title">
      <h2>قائمة الأسعار المعتمدة</h2>
      <p>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</p>
    </div>
  </div>
  
  <div class="meta-bar">
    <div><span>عدد الأصناف:</span> <strong>${rows.length} صنفاً</strong></div>
    <div><span>الحالة:</span> <strong style="color: #10b981;">متوفرة بالمخزون</strong></div>
    <div><span>الجهة:</span> <strong>لائحة أسعار معلنة</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        ${headerCols}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <div><p>${footerText}</p><p>تم إنشاء هذه القائمة إلكترونياً وهي صالحة حتى تحديثها التالي.</p></div>
    <div class="stamp">${companyName}</div>
  </div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script>
    window.onload = function() {
      const element = document.body;
      const opt = {
        margin:       [12, 12, 12, 12],
        filename:     'قائمة_الأسعار_${new Date().toISOString().slice(0, 10)}.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2.5, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save().then(() => {
        setTimeout(() => { window.close(); }, 1000);
      });
    };
  </script>
</body>
</html>
    `);
    printWindow.document.close();

    logPriceListExport('PDF', customColumns);
  };

  const exportPriceListExcel = (
    customColumns = ['name', ...columnsOrder.filter(col => selectedColumns.includes(col))],
    customSearch = priceListSearch
  ) => {
    const rows = getPriceListRows();
    const companyName = settings?.name || "المثنى للأدوية";
    const currency = settings?.currency || "SDG";

    const columnLabels: Record<string, string> = {
      name: 'اسم الدواء / المنتج',
      scientificName: 'الاسم العلمي',
      category: 'التصنيف',
      batchNumber: 'رقم التشغيلة',
      expiryDate: 'تاريخ الصلاحية',
      qty: 'الكمية المتوفرة',
      price: 'سعر البيع المقترح'
    };

    const headerCols = customColumns.map(col => `<th style="background-color: #10b981; color: #ffffff; font-weight: bold; border: 1px solid #dddddd; padding: 10px; text-align: center;">${columnLabels[col] || col}</th>`).join('');

    const rowsHtml = rows.map((r: any, idx) => {
      const cols = customColumns.map(col => {
        if (col === 'price') {
          return `<td style="border: 1px solid #dddddd; padding: 8px; text-align: center; font-weight: bold; color: #10b981;">${r.price} ${currency}</td>`;
        }
        if (col === 'qty') {
          return `<td style="border: 1px solid #dddddd; padding: 8px; text-align: center;">${r.qty} ${r.unit || ''}</td>`;
        }
        if (col === 'expiryDate' || col === 'batchNumber') {
          return `<td style="border: 1px solid #dddddd; padding: 8px; text-align: center;">${r[col]}</td>`;
        }
        return `<td style="border: 1px solid #dddddd; padding: 8px; text-align: right;">${r[col]}</td>`;
      }).join('');
      
      return `<tr><td style="border: 1px solid #dddddd; padding: 8px; text-align: center; color: #666666;">${idx + 1}</td>${cols}</tr>`;
    }).join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>قائمة الأسعار</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                  <x:LayoutDirection>RTL</x:LayoutDirection>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', 'Arial', sans-serif; direction: rtl; }
          table { border-collapse: collapse; width: 100%; }
        </style>
      </head>
      <body>
        <h2 style="color: #065f46; text-align: center; margin-bottom: 5px;">${companyName}</h2>
        <h3 style="color: #10b981; text-align: center; margin-bottom: 20px;">قائمة الأسعار المعتمدة - تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</h3>
        <table>
          <thead>
            <tr>
              <th style="background-color: #10b981; color: #ffffff; font-weight: bold; border: 1px solid #dddddd; padding: 10px; text-align: center;">#</th>
              ${headerCols}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `قائمة_الأسعار_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logPriceListExport('Excel', customColumns);
  };

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [quickCust, setQuickCust] = useState({
    name: '',
    type: 'Pharmacy',
    state: 'الخرطوم',
    phone: '',
    creditLimit: 500000
  });

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

  const filteredCustomersForSelect = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.state.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCust.name || !quickCust.phone) return;

    try {
      const created = await addCustomer({
        name: quickCust.name,
        type: quickCust.type,
        state: quickCust.state,
        phone: quickCust.phone,
        creditLimit: Number(quickCust.creditLimit)
      });
      setSelectedCustomerId(created.id);
      setQuickCust({ name: '', type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000 });
      setShowQuickAddCustomer(false);
    } catch (err) {
      console.error(err);
      alert('فشل في إضافة العميل');
    }
  };

  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  const filteredProductsForSelect = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  
  const [fefoBatches, setFefoBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const [paidAmount, setPaidAmount] = useState(0);
  const [invoiceSuccess, setInvoiceSuccess] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issuingInvoice, setIssuingInvoice] = useState(false);
  const [sales, setSales] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced features state variables
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [invoiceDate, setInvoiceDate] = useState(getTodayStr());
  const [usePaymentPlan, setUsePaymentPlan] = useState(false);
  const [installmentsPlan, setInstallmentsPlan] = useState<{ dueDate: string; amount: string | number; notes: string }[]>([]);

  const parseDigits = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val);
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const englishStr = str.replace(/[٠-٩]/g, (w) => String(arabicDigits.indexOf(w)));
    return Number(englishStr) || 0;
  };

  const addInstallmentToPlan = () => {
    const remaining = Math.max(0, cartTotal - paidAmount) - installmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0);
    setInstallmentsPlan([
      ...installmentsPlan,
      { dueDate: getTodayStr(), amount: remaining > 0 ? remaining : '', notes: '' }
    ]);
  };

  const removeInstallmentFromPlan = (index: number) => {
    setInstallmentsPlan(installmentsPlan.filter((_, i) => i !== index));
  };

  const updateInstallmentInPlan = (index: number, key: 'dueDate' | 'amount' | 'notes', value: any) => {
    setInstallmentsPlan(
      installmentsPlan.map((inst, i) => (i === index ? { ...inst, [key]: value } : inst))
    );
  };

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterCustomerSearch, setFilterCustomerSearch] = useState('');
  const [isFilterCustomerDropdownOpen, setIsFilterCustomerDropdownOpen] = useState(false);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [sortField, setSortField] = useState<'id' | 'customerName' | 'createdAt' | 'total' | 'paid' | 'remaining' | 'status'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'id' | 'customerName' | 'createdAt' | 'total' | 'paid' | 'remaining' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortArrow = (field: 'id' | 'customerName' | 'createdAt' | 'total' | 'paid' | 'remaining' | 'status') => {
    if (sortField !== field) return <span className="opacity-30 mr-1.5 font-mono select-none">⇅</span>;
    return sortDirection === 'asc' 
      ? <span className="mr-1.5 text-white dark:text-emerald-400 select-none animate-bounce">↑</span> 
      : <span className="mr-1.5 text-white dark:text-emerald-400 select-none animate-bounce">↓</span>;
  };

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const selectedInvoiceIdForDetails = useSalesStore((state) => state.selectedInvoiceIdForDetails);
  const setSelectedInvoiceIdForDetails = useSalesStore((state) => state.setSelectedInvoiceIdForDetails);

  useEffect(() => {
    if (selectedInvoiceIdForDetails && sales.length > 0) {
      const matched = sales.find(s => s.id === selectedInvoiceIdForDetails);
      if (matched) {
        setSelectedInvoice(matched);
        setSelectedInvoiceIdForDetails(null); // Reset global bridging state
      }
    }
  }, [selectedInvoiceIdForDetails, sales, setSelectedInvoiceIdForDetails]);

  // Invoice edit mode states
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [editInvoicePaid, setEditInvoicePaid] = useState(0);
  const [editInvoiceDate, setEditInvoiceDate] = useState('');
  const [editInstallmentsPlan, setEditInstallmentsPlan] = useState<{ dueDate: string; amount: string | number; notes: string }[]>([]);

  const addInstallmentToEditPlan = () => {
    if (!selectedInvoice) return;
    const remaining = Math.max(0, selectedInvoice.total - editInvoicePaid) - editInstallmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0);
    setEditInstallmentsPlan([
      ...editInstallmentsPlan,
      { dueDate: getTodayStr(), amount: remaining > 0 ? remaining : '', notes: '' }
    ]);
  };

  const removeInstallmentFromEditPlan = (index: number) => {
    setEditInstallmentsPlan(editInstallmentsPlan.filter((_, i) => i !== index));
  };

  const updateInstallmentInEditPlan = (index: number, key: 'dueDate' | 'amount' | 'notes', value: any) => {
    setEditInstallmentsPlan(
      editInstallmentsPlan.map((inst, i) => (i === index ? { ...inst, [key]: value } : inst))
    );
  };

  const handleSaveInvoiceUpdate = async () => {
    if (!selectedInvoice) return;
    
    const remainingAmount = selectedInvoice.total - editInvoicePaid;
    const installmentsTotal = editInstallmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0);
    
    if (editInstallmentsPlan.length > 0 && Math.abs(remainingAmount - installmentsTotal) > 0.01) {
      alert('مجموع مبالغ الأقساط يجب أن يساوي المبلغ المتبقي تماماً!');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await apiClient.put(`/sales/${selectedInvoice.id}/update-invoice`, {
        createdAt: new Date(editInvoiceDate).toISOString(),
        paid: editInvoicePaid,
        installments: editInstallmentsPlan.map(i => ({
          dueDate: i.dueDate,
          amount: parseDigits(i.amount),
          notes: i.notes
        }))
      });
      
      alert('تم تعديل الفاتورة وجدولة الأقساط بنجاح!');
      setIsEditingInvoice(false);
      // Reload sales from server
      const { data } = await apiClient.get<Invoice[]>('/sales');
      setSales(data);
      
      const updated = data.find(s => s.id === selectedInvoice.id);
      if (updated) {
        setSelectedInvoice(updated);
      } else {
        setSelectedInvoice(null);
      }
    } catch (err) {
      console.error(err);
      alert('فشل في حفظ التعديلات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; invoiceId: string | null; loading: boolean }>({
    open: false,
    invoiceId: null,
    loading: false,
  });
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editDateValue, setEditDateValue] = useState('');

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; invoice: Invoice | null; amount: number; loading: boolean }>({
    open: false,
    invoice: null,
    amount: 0,
    loading: false,
  });

  const filteredInvoiceList = sales.filter((sale) => {
    // 1. Text Search Filter (Invoice ID or Customer Name)
    const matchesSearch = (() => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        sale.id.toLowerCase().includes(q) ||
        sale.customerName.toLowerCase().includes(q)
      );
    })();

    // 2. Date Range Filter
    const matchesDateRange = (() => {
      const saleDate = new Date(sale.createdAt);
      // Strip time elements for clean day comparison
      saleDate.setHours(0, 0, 0, 0);

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (saleDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(0, 0, 0, 0);
        if (saleDate > to) return false;
      }
      return true;
    })();

    // 3. Customer Filter
    const matchesCustomer = !filterCustomerName || sale.customerName === filterCustomerName;

    // 4. Payment Status Filter
    const matchesPaymentStatus = !filterPaymentStatus || sale.status === filterPaymentStatus;

    return matchesSearch && matchesDateRange && matchesCustomer && matchesPaymentStatus;
  });

  // Reset pagination to page 1 when search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, fromDate, toDate, filterCustomerName, filterPaymentStatus]);

  const sortedInvoiceList = [...filteredInvoiceList].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortField) {
      case 'id':
        aVal = a.id;
        bVal = b.id;
        break;
      case 'customerName':
        aVal = a.customerName;
        bVal = b.customerName;
        break;
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      case 'total':
        aVal = a.total;
        bVal = b.total;
        break;
      case 'paid':
        aVal = a.paid;
        bVal = b.paid;
        break;
      case 'remaining':
        aVal = Math.max(0, a.total - a.paid);
        bVal = Math.max(0, b.total - b.paid);
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedInvoiceList.length / itemsPerPage);
  const paginatedInvoiceList = sortedInvoiceList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (selectedProductId) {
      const suggested = getFEFOBatches(selectedProductId);
      setFefoBatches(suggested);
      if (suggested.length > 0) {
        setSelectedBatchId(suggested[0].id);
        setPrice(Math.round(suggested[0].costPrice * 1.25));
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
    setSelectedProductId('');
    setSelectedBatchId('');
    setQty(1);
  };

  const cartTotal = cart.reduce((sum: number, item: CartItem) => sum + (item.qty * item.price), 0);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const loadSales = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<Invoice[]>('/sales');
      setSales(data);
    } catch (error) {
      console.error('Failed to load sales from server:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handlePrint = (sale: Invoice) => {
    const currency = settings?.currency || "SDG";
    const remaining = Math.max(0, sale.total - sale.paid);
    const statusLabel = sale.status === 'PAID' ? 'مدفوع' : sale.status === 'PARTIAL' ? 'جزئي' : 'معلق';
    const paidLabel = sale.paid > 0 ? sale.paid.toLocaleString('en-US') + ' ' + currency : '---';

    const companyName = settings?.name || "المثنى للأدوية";
    const companyPhone = settings?.phone || "0912345678";
    const companyEmail = settings?.email ? ` &nbsp;|&nbsp; البريد: ${settings.email}` : "";
    const companyAddress = settings?.address || "السودان - أمدرمان";
    const companyLogoHtml = settings?.logo 
      ? `<div class="logo-container"><img src="${settings.logo}" /></div>` 
      : '';
    const regAndTaxHtml = (settings?.commercialReg || settings?.taxNumber)
      ? `<p style="font-size: 11px; color: #64748b; margin-top: 4px;">${settings.commercialReg ? 'سجل تجاري: ' + settings.commercialReg : ''} ${settings.taxNumber ? ' &nbsp;|&nbsp; رقم ضريبي: ' + settings.taxNumber : ''}</p>`
      : '';
    const footerText = settings?.invoiceFooter || "شكراً لتعاملكم مع المثنى للأدوية";

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const itemsRows = sale.items
      .map(
        (item: InvoiceItem, i: number) => `
        <tr>
          <td style="text-align: center; padding: 6px 4px; border: 1px solid #ddd;">${i + 1}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${item.productName}</td>
          <td style="text-align: center; padding: 6px 4px; border: 1px solid #ddd;">${item.batchNumber}</td>
          <td style="text-align: center; padding: 6px 4px; border: 1px solid #ddd;">${item.qty}</td>
          <td style="text-align: center; padding: 6px 4px; border: 1px solid #ddd;">${item.price.toLocaleString('en-US')}</td>
          <td style="text-align: center; padding: 6px 4px; border: 1px solid #ddd;">${(item.qty * item.price).toLocaleString('en-US')}</td>
        </tr>`
      )
      .join('');

    printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>فاتورة - ${sale.id}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 15mm 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Tajawal', 'Segoe UI', 'Arial', sans-serif; background: #fff; color: #1e293b; line-height: 1.6; }
    .invoice-container { max-width: 190mm; margin: 0 auto; padding: 10px 0; }
    .invoice-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 16px; margin-bottom: 20px; }
    .company-info { display: flex; align-items: center; gap: 15px; }
    .company-info .logo-container { max-height: 70px; display: flex; align-items: center; }
    .company-info .logo-container img { max-height: 70px; object-fit: contain; }
    .company-info h1 { font-size: 22px; color: #065f46; margin: 0 0 4px 0; }
    .company-info p { font-size: 12px; color: #64748b; margin: 0; }
    .invoice-title { text-align: left; }
    .invoice-title h2 { font-size: 26px; color: #10b981; letter-spacing: 1px; }
    .invoice-title p { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .meta-grid { display: flex; justify-content: space-between; background: #f1f5f9; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; }
    .meta-grid .col { display: flex; flex-direction: column; gap: 4px; }
    .meta-grid .col span:first-child { color: #64748b; font-size: 11px; }
    .meta-grid .col span:last-child { font-weight: 600; color: #1e293b; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .status-PAID { background: #d1fae5; color: #065f46; }
    .status-PARTIAL { background: #fef3c7; color: #92400e; }
    .status-PENDING { background: #e2e8f0; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    table thead th { background: #10b981; color: #fff; font-size: 12px; font-weight: 600; padding: 10px 6px; border: none; }
    table tbody tr:nth-child(even) { background: #f8fafc; }
    .totals { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-bottom: 24px; }
    .totals .row { display: flex; justify-content: space-between; width: 260px; font-size: 14px; }
    .totals .row.total { font-size: 17px; font-weight: 700; color: #065f46; border-top: 2px solid #10b981; padding-top: 6px; }
    .invoice-footer { border-top: 2px solid #e2e8f0; padding-top: 14px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
    .invoice-footer .stamp { border: 2px dashed #cbd5e1; border-radius: 8px; padding: 6px 18px; font-size: 14px; font-weight: 700; color: #10b981; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div class="company-info">
        ${companyLogoHtml}
        <div>
          <h1>${companyName}</h1>
          <p>${companyAddress} &nbsp;|&nbsp; هاتف: ${companyPhone} ${companyEmail}</p>
          ${regAndTaxHtml}
        </div>
      </div>
      <div class="invoice-title">
        <h2>فاتورة مبيعات</h2>
        <p>${sale.id}</p>
      </div>
    </div>
    <div class="meta-grid">
      <div class="col"><span>العميل</span><span>${sale.customerName}</span></div>
      <div class="col"><span>التاريخ</span><span>${new Date(sale.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
      <div class="col"><span>رقم الفاتورة</span><span style="direction: ltr; text-align: left;">${sale.id}</span></div>
      <div class="col"><span>حالة الدفع</span><span class="status-badge status-${sale.status}">${statusLabel}</span></div>
    </div>
    <table>
      <thead><tr><th style="width: 40px;">#</th><th>المنتج</th><th>رقم التشغيلة</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span>المدفوع:</span><span style="color: #10b981; font-weight: 600;">${paidLabel}</span></div>
      <div class="row"><span>المتبقي:</span><span style="color: ${remaining > 0 ? '#e11d48' : '#10b981'}; font-weight: 600;">${remaining > 0 ? remaining.toLocaleString('en-US') + ' ' + currency : '---'}</span></div>
      <div class="row total"><span>الإجمالي:</span><span>${sale.total.toLocaleString('en-US')} ${currency}</span></div>
    </div>
    <div class="invoice-footer">
      <div><p>${footerText}</p><p>تم إصدار هذه الفاتورة إلكترونياً</p></div>
      <div class="stamp">${companyName}</div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>
    `);

    printWindow.document.close();
  };

  const handleExportExcel = () => {
    const headers = ['رقم الفاتورة', 'العميل', 'التاريخ', 'الإجمالي (SDG)', 'المدفوع (SDG)', 'المتبقي (SDG)', 'الحالة'];
    const rows = filteredInvoiceList.map((sale) => {
      const remaining = Math.max(0, sale.total - sale.paid);
      const statusLabel = sale.status === 'PAID' ? 'مدفوع' : sale.status === 'PARTIAL' ? 'جزئي' : 'معلق';
      return [
        sale.id,
        sale.customerName,
        new Date(sale.createdAt).toLocaleDateString('ar-SA'),
        sale.total,
        sale.paid,
        remaining,
        statusLabel
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_المبيعات_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const currency = settings?.currency || "SDG";
    const companyName = settings?.name || "المثنى للأدوية";
    const footerText = settings?.invoiceFooter || "شكراً لتعاملكم مع المثنى للأدوية";

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;

    const rowsHTML = filteredInvoiceList.map((sale, idx) => {
      const remaining = Math.max(0, sale.total - sale.paid);
      const statusLabel = sale.status === 'PAID' ? 'مدفوع' : sale.status === 'PARTIAL' ? 'جزئي' : 'معلق';
      return `
        <tr>
          <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${sale.id}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${sale.customerName}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${new Date(sale.createdAt).toLocaleDateString('ar-SA')}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #ddd; font-weight: bold;">${sale.total.toLocaleString('en-US')} ${currency}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #ddd; color: #10b981;">${sale.paid.toLocaleString('en-US')} ${currency}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #ddd; color: #rose-500;">${remaining.toLocaleString('en-US')} ${currency}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${statusLabel}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تقرير سجل المبيعات</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Tajawal', 'Segoe UI', 'Arial', sans-serif; direction: rtl; padding: 20px; }
    h1 { text-align: center; color: #065f46; margin-bottom: 5px; }
    p.subtitle { text-align: center; color: #64748b; font-size: 14px; margin-bottom: 25px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background-color: #10b981; color: white; padding: 10px; font-size: 13px; text-align: center; }
    td { font-size: 12px; padding: 8px; text-align: center; border: 1px solid #ddd; }
    .footer { text-align: left; font-size: 11px; color: #94a3b8; margin-top: 50px; }
  </style>
</head>
<body>
  <h1>${companyName}</h1>
  <p class="subtitle">تقرير سجل الفواتير والمبيعات - تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>رقم الفاتورة</th>
        <th>العميل</th>
        <th>التاريخ</th>
        <th>الإجمالي</th>
        <th>المدفوع</th>
        <th>المتبقي</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>
  <div class="footer">
    <p>تم استخراج هذا التقرير تلقائياً من نظام سجلات ${companyName}</p>
    <p>${footerText}</p>
  </div>
  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>
    `);
    printWindow.document.close();
  };

  const openPaymentModal = (sale: Invoice) => {
    const remaining = Math.max(0, sale.total - sale.paid);
    setPaymentModal({
      open: true,
      invoice: sale,
      amount: remaining,
      loading: false,
    });
  };

  const closePaymentModal = () => {
    setPaymentModal({ open: false, invoice: null, amount: 0, loading: false });
  };

  const handlePaymentSubmit = async () => {
    const { invoice, amount } = paymentModal;
    if (!invoice || amount <= 0) return;

    setPaymentModal((prev) => ({ ...prev, loading: true }));

    try {
      await apiClient.post(`/sales/${invoice.id}/pay`, { amount });
      useActivityStore.getState().logActivity(
        'تحصيل مبيعات',
        `تم استلام دفعة بقيمة ${amount.toLocaleString()} SDG للفاتورة رقم ${invoice.id} للعميل ${invoice.customerName}`
      );
      // Reload sales from server
      await loadSales();
    } catch (error) {
      console.error('Failed to submit payment:', error);
      alert('فشل في تسجيل الدفعة');
    }

    closePaymentModal();
  };

  const handleCheckout = async () => {
    if (!selectedCustomerId || cart.length === 0 || isSubmitting) return;

    if (usePaymentPlan) {
      const remainingAmount = cartTotal - paidAmount;
      const installmentsTotal = installmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0);
      if (Math.abs(remainingAmount - installmentsTotal) > 0.01) {
        alert('مجموع مبالغ الأقساط يجب أن يساوي المبلغ المتبقي تماماً!');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post<Invoice>('/sales/offline', {
        customerId: selectedCustomerId,
        items: cart.map((item: CartItem) => ({
          productId: item.productId,
          batchId: item.batchId,
          qty: item.qty,
          price: item.price,
        })),
        total: cartTotal,
        paid: paidAmount,
        createdAt: new Date(invoiceDate).toISOString(),
        installments: usePaymentPlan ? installmentsPlan.map(i => ({
          dueDate: i.dueDate,
          amount: parseDigits(i.amount),
          notes: i.notes
        })) : undefined,
      });

      setInvoiceNumber(response.data.id);
      setInvoiceSuccess(true);

      useActivityStore.getState().logActivity(
        'فاتورة مبيعات جديدة',
        `تم إصدار فاتورة مبيعات رقم ${response.data.id} للعميل ${selectedCustomer?.name || ''} بقيمة ${cartTotal.toLocaleString()} SDG (المدفوع: ${paidAmount.toLocaleString()} SDG)`
      );

      // Decrement batch quantities in the local inventory store
      cart.forEach((item: CartItem) => {
        decrementBatchQty(item.batchId, item.qty);
      });

      // Reload sales from server
      await loadSales();

      clearCart();
      setPaidAmount(0);
      setSelectedCustomerId('');
      setInvoiceDate(getTodayStr()); // Reset to today's date
      setUsePaymentPlan(false);
      setInstallmentsPlan([]);
      setIssuingInvoice(false);

      setTimeout(() => {
        setInvoiceSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to create sale:', error);
      alert('فشل في إصدار الفاتورة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSale = async () => {
    if (!deleteConfirm.invoiceId) return;
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await apiClient.delete(`/sales/${deleteConfirm.invoiceId}`);
      await loadSales();
      setDeleteConfirm({ open: false, invoiceId: null, loading: false });
      setSelectedInvoice(null);
    } catch (err) {
      console.error(err);
      alert('فشل في حذف الفاتورة');
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleUpdateInvoiceDate = async (invoiceId: string, newDateStr: string) => {
    try {
      await apiClient.patch(`/sales/${invoiceId}`, { createdAt: new Date(newDateStr).toISOString() });
      await loadSales();
      setIsEditingDate(false);
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice({
          ...selectedInvoice,
          createdAt: new Date(newDateStr).toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to update date:', err);
      alert('فشل في تعديل تاريخ الفاتورة');
    }
  };

  const invoiceCount = sales.length;
  const totalSalesAmount = sales.reduce((sum: number, sale: Invoice) => sum + sale.total, 0);
  const totalPaidAmount = sales.reduce((sum: number, sale: Invoice) => sum + sale.paid, 0);
  const totalOutstanding = sales.reduce((sum: number, sale: Invoice) => sum + Math.max(0, sale.total - sale.paid), 0);

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

  // Mobile Invoice Card Component
  const InvoiceCard = ({ sale }: { sale: Invoice }) => {
    const remaining = Math.max(0, sale.total - sale.paid);
    return (
      <div 
        onClick={() => setSelectedInvoice(sale)} 
        className="glass-card p-4 rounded-xl border border-[var(--glass-border)] space-y-3 cursor-pointer hover:border-emerald-500/25 hover:shadow-lg transition-all"
      >
        <div className="flex justify-between items-start">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            sale.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 
            sale.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500' : 
            'bg-gray-500/10 text-gray-500'
          }`}>
            {sale.status === 'PAID' ? 'مدفوع' : sale.status === 'PARTIAL' ? 'جزئي' : 'معلق'}
          </span>
          <div className="text-left">
            <p className="text-sm font-bold text-[var(--text-primary)]">{sale.customerName}</p>
            <p className="text-xs text-[var(--text-secondary)] font-mono">{sale.id}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[var(--text-secondary)]">الإجمالي</span>
            <p className="font-bold text-[var(--text-primary)]">{sale.total.toLocaleString('en-US')} SDG</p>
          </div>
          <div className="text-left">
            <span className="text-[var(--text-secondary)]">المدفوع</span>
            <p className="font-bold text-emerald-500">{sale.paid.toLocaleString('en-US')} SDG</p>
          </div>
          <div className="col-span-2 text-left">
            <span className="text-[var(--text-secondary)]">المتبقي: </span>
            <span className="font-bold text-rose-500">{remaining.toLocaleString('en-US')} SDG</span>
          </div>
          <div className="col-span-2 flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-secondary)]">
              {new Date(sale.createdAt).toLocaleDateString('en-US')}
            </span>
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {sale.status !== 'PAID' && (
                <button
                  onClick={(e) => { e.stopPropagation(); openPaymentModal(sale); }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>سداد</span>
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handlePrint(sale); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 text-xs font-semibold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const columnLabels: Record<string, string> = {
    name: 'اسم الدواء / المنتج',
    scientificName: 'الاسم العلمي',
    category: 'التصنيف',
    batchNumber: 'رقم التشغيلة',
    expiryDate: 'تاريخ الصلاحية',
    qty: 'الكمية المتوفرة',
    price: 'سعر البيع المقترح'
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="space-y-6 animate-fade-in-slide">
      {/* Success Toast */}
      {invoiceSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>تم إصدار الفاتورة {invoiceNumber} بنجاح</span>
        </div>
      )}

      {selectedInvoice ? (
        /* ====== INVOICE DETAIL FULL PAGE (REDESIGNED PREMIUM LOOK & FEEL) ====== */
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-slide w-full" dir="rtl">
          
          {/* 🌟 شريط الحالة المتوهج والفاخر في الأعلى */}
          <div className={`relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 shadow-xl ${
            selectedInvoice.status === 'PAID' 
              ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/[0.02] to-transparent border-emerald-500/20 shadow-emerald-500/5' 
              : selectedInvoice.status === 'PARTIAL' 
                ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/[0.02] to-transparent border-amber-500/20 shadow-amber-500/5' 
                : 'bg-gradient-to-r from-slate-500/10 via-slate-500/[0.02] to-transparent border-slate-500/20 shadow-slate-500/5'
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.02] blur-2xl pointer-events-none rounded-full" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                  selectedInvoice.status === 'PAID' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                  selectedInvoice.status === 'PARTIAL' ? 'bg-amber-500 text-white shadow-amber-500/20' :
                  'bg-slate-500 text-white shadow-slate-500/20'
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em]">رقم الفاتورة المرجعي</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--border-color)] text-[var(--text-primary)] font-mono">
                      {selectedInvoice.id}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mt-1">
                    فاتورة مبيعات: <span className="text-emerald-600 dark:text-emerald-400">{selectedInvoice.customerName}</span>
                  </h1>
                </div>
              </div>

              {/* شارة الحالة المضيئة */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[var(--text-secondary)]">حالة السداد:</span>
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black border transition-all duration-300 shadow-md ${
                  selectedInvoice.status === 'PAID' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                    : selectedInvoice.status === 'PARTIAL' 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                      : 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    selectedInvoice.status === 'PAID' ? 'bg-emerald-500 animate-pulse' :
                    selectedInvoice.status === 'PARTIAL' ? 'bg-amber-500 animate-pulse' :
                    'bg-slate-500'
                  }`} />
                  {selectedInvoice.status === 'PAID' ? 'مدفوعة بالكامل' : selectedInvoice.status === 'PARTIAL' ? 'مدفوعة جزئياً (أقساط)' : 'معلقة / غير مسددة'}
                </span>
              </div>
            </div>
          </div>

          {/* 🎛️ أزرار التحكم والإجراءات السريعة (Styled & Micro-animated Buttons Row) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-secondary)] p-4 rounded-3xl border border-[var(--border-color)] shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSelectedInvoice(null); setIsEditingInvoice(false); setIsEditingDate(false); }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-primary)] hover:bg-[var(--border-color)]/50 border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl font-bold text-xs transition-all active:scale-95"
              >
                <ArrowRight className="w-4 h-4 text-emerald-500" />
                <span>العودة للفواتير</span>
              </button>
              
              <div className="w-[1px] h-8 bg-[var(--border-color)] mx-1 hidden sm:block" />
              
              <span className="text-[11px] font-bold text-[var(--text-secondary)] hidden lg:inline">إجراءات إدارية:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isEditingInvoice && (
                <button
                  onClick={() => {
                    setIsEditingInvoice(true);
                    setEditInvoicePaid(selectedInvoice.paid);
                    setEditInvoiceDate(selectedInvoice.createdAt.split('T')[0]);
                    setEditInstallmentsPlan(
                      selectedInvoice.installments?.map(inst => ({
                        dueDate: inst.dueDate.split('T')[0],
                        amount: inst.amount,
                        notes: inst.notes || ''
                      })) || []
                    );
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-2xl text-xs font-black transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل الفاتورة والأقساط</span>
                </button>
              )}
              
              {user?.role === 'ADMIN' && !isEditingInvoice && (
                <button
                  onClick={() => {
                    setEditDateValue(selectedInvoice.createdAt.split('T')[0]);
                    setIsEditingDate(!isEditingDate);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-black transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>تعديل التاريخ</span>
                </button>
              )}
              
              {selectedInvoice.status !== 'PAID' && !isEditingInvoice && (
                <button
                  onClick={() => openPaymentModal(selectedInvoice)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/15 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>تسجيل دفعة سداد</span>
                </button>
              )}
              
              <button
                onClick={() => handlePrint(selectedInvoice)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-black transition-all hover:-translate-y-0.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة حرارية</span>
              </button>

              {user?.role === 'ADMIN' && !isEditingInvoice && (
                <button
                  onClick={() => setDeleteConfirm({ open: true, invoiceId: selectedInvoice.id, loading: false })}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl text-xs font-black transition-all hover:-translate-y-0.5 mr-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الفاتورة</span>
                </button>
              )}
            </div>
          </div>

          {/* 📅 محرر التاريخ المنسدل الأنيق */}
          {isEditingDate && !isEditingInvoice && (
            <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-4 animate-scale-in">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-black">تغيير تاريخ تسجيل الفاتورة لوقت سابق أو تاريخ محدد:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                <div className="flex-1 w-full text-right">
                  <DatePicker value={editDateValue} onChange={setEditDateValue} />
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleUpdateInvoiceDate(selectedInvoice.id, editDateValue)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    حفظ التغيير
                  </button>
                  <button
                    onClick={() => setIsEditingDate(false)}
                    className="px-5 py-2.5 bg-[var(--border-color)] text-[var(--text-primary)] rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              🛠️ وضع التعديل الفاخر (PROFrosted Glass Invoice Editor)
              ======================================================== */}
          {isEditingInvoice ? (
            <div className="space-y-6 animate-scale-in">
              <div className="glass-card-no-backdrop p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-cyan-950/[0.02] dark:bg-cyan-950/[0.15] space-y-6 shadow-2xl relative">
                
                {/* شريط تمييز جانبي ملون لوضع التعديل */}
                <div className="absolute top-0 bottom-0 right-0 w-2 bg-cyan-500 rounded-r-3xl" />

                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 pr-3">
                  <div className="flex items-center gap-2.5 text-cyan-600 dark:text-cyan-400">
                    <Edit3 className="w-5 h-5 animate-pulse" />
                    <span className="text-base font-black">وضع التعديل النشط — جدولة الأقساط وتعديل الفاتورة</span>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] font-mono">تحديث المعطيات المالية للفاتورة رقم: {selectedInvoice.id}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pr-3">
                  <div className="space-y-2 text-right">
                    <label className="block text-xs font-bold text-[var(--text-secondary)]">تاريخ إصدار الفاتورة</label>
                    <DatePicker value={editInvoiceDate} onChange={setEditInvoiceDate} />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="block text-xs font-bold text-[var(--text-secondary)]">المبلغ المدفوع حالياً (SDG)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={editInvoicePaid}
                        onChange={(e) => setEditInvoicePaid(Number(e.target.value))}
                        className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] text-sm font-bold outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all text-center pr-10"
                      />
                      <DollarSign className="w-4 h-4 text-cyan-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* بطاقات المؤشرات المالية في وضع التعديل */}
                <div className="grid grid-cols-3 gap-3 text-sm pr-3">
                  <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-center shadow-sm">
                    <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-semibold mb-1">إجمالي الفاتورة</p>
                    <p className="font-mono font-black text-sm sm:text-base text-[var(--text-primary)]">{selectedInvoice.total.toLocaleString('en-US')} SDG</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 text-center shadow-sm">
                    <p className="text-[10px] sm:text-xs text-emerald-600 font-semibold mb-1">المدفوع المعدل</p>
                    <p className="font-mono font-black text-sm sm:text-base text-emerald-600">{editInvoicePaid.toLocaleString('en-US')} SDG</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 text-center shadow-sm">
                    <p className="text-[10px] sm:text-xs text-rose-500 font-semibold mb-1">المتبقي للاستحقاق</p>
                    <p className="font-mono font-black text-sm sm:text-base text-rose-500">{Math.max(0, selectedInvoice.total - editInvoicePaid).toLocaleString('en-US')} SDG</p>
                  </div>
                </div>

                {/* 📝 جدولة الأقساط والدفعات المستحقة */}
                {selectedInvoice.total - editInvoicePaid > 0 && (
                  <div className="space-y-4 border-t border-[var(--border-color)] pt-5 pr-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4.5 h-4.5 text-cyan-500" />
                        <span className="text-sm font-black text-[var(--text-primary)]">جدول وتوزيع خطة الأقساط</span>
                      </div>
                      <button
                        type="button"
                        onClick={addInstallmentToEditPlan}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        + إضافة دفعة جديدة
                      </button>
                    </div>

                    {editInstallmentsPlan.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-8 text-center text-xs text-[var(--text-secondary)]">
                        لم يتم جدولة أي أقساط بعد للمبلغ المتبقي. انقر على "+ إضافة دفعة جديدة" لبدء الجدولة الذكية للأقساط.
                      </div>
                    )}

                    {/* قائمة بطاقات تعديل الأقساط */}
                    <div className="space-y-3">
                      {editInstallmentsPlan.map((inst, idx) => (
                        <div key={idx} className="p-4 bg-[var(--bg-primary)]/70 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-4 text-xs relative group transition-all hover:border-cyan-500/20">
                          <div className="flex justify-between items-center border-b border-[var(--border-color)]/40 pb-2">
                            <span className="font-black text-cyan-600 dark:text-cyan-400 text-xs flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-lg bg-cyan-500/10 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                              الدفعة المستحقة #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeInstallmentFromEditPlan(idx)}
                              className="text-rose-500 hover:text-rose-600 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              حذف الدفعة
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5 text-right">
                              <label className="text-[10px] font-bold text-[var(--text-secondary)] block">تاريخ الاستحقاق</label>
                              <DatePicker
                                value={inst.dueDate}
                                onChange={(val) => updateInstallmentInEditPlan(idx, 'dueDate', val)}
                              />
                            </div>
                            <div className="space-y-1.5 text-right">
                              <label className="text-[10px] font-bold text-[var(--text-secondary)] block">المبلغ المستحق (SDG)</label>
                              <input
                                type="text"
                                value={inst.amount}
                                onChange={(e) => updateInstallmentInEditPlan(idx, 'amount', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-black text-center text-sm outline-none focus:border-cyan-500/50"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5 text-right">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] block">ملاحظات أو وسيلة الدفع المتوقعة</label>
                            <input
                              type="text"
                              value={inst.notes}
                              placeholder="مثلاً: دفعة بشيك مؤجل، نقدي، تحويل بنكي..."
                              onChange={(e) => updateInstallmentInEditPlan(idx, 'notes', e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 📊 مؤشر التحقق والتحذير المالي التفاعلي */}
                    {editInstallmentsPlan.length > 0 && (
                      <div className={`text-xs p-4 rounded-2xl border transition-all duration-300 ${
                        Math.abs((selectedInvoice.total - editInvoicePaid) - editInstallmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0)) < 0.05
                          ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/[0.02]'
                          : 'bg-rose-500/5 border-rose-500/25 text-rose-600 dark:text-rose-400 shadow-md shadow-rose-500/[0.02]'
                      }`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <span className="font-black text-xs">
                            مجموع الدفعات المجدولة حالياً: {editInstallmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0).toLocaleString()} SDG
                          </span>
                          <span className="font-mono text-[10px] opacity-80">
                            المطلوب جدولته: {(selectedInvoice.total - editInvoicePaid).toLocaleString()} SDG
                          </span>
                        </div>
                        {Math.abs((selectedInvoice.total - editInvoicePaid) - editInstallmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0)) > 0.05 && (
                          <div className="mt-2 pt-2 border-t border-current/10 flex items-center gap-2 font-bold animate-pulse text-[10px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>
                              الرجاء مطابقة المبالغ المجدولة. الفارق الحالي: {Math.abs((selectedInvoice.total - editInvoicePaid) - editInstallmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0)).toLocaleString()} SDG
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 💾 أزرار الحفظ والإلغاء */}
                <div className="flex flex-wrap sm:flex-nowrap gap-3 pt-5 border-t border-[var(--border-color)] pr-3 justify-end">
                  <button
                    onClick={handleSaveInvoiceUpdate}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-cyan-500/10 disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4.5 h-4.5" />
                        <span>حفظ التعديلات والتحديث</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditingInvoice(false)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-bold text-xs transition-all cursor-pointer text-center active:scale-95"
                  >
                    إلغاء التعديل
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================
                👁️ وضع العرض الفاخر (Premium High-Fidelity Details View)
                ======================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* اللوحة الرئيسية (العريضة) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 👤 بطاقة معلومات العميل والتاريخ */}
                <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-sm text-right space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.12em] border-b border-[var(--border-color)] pb-2.5">
                    <UserCheck className="w-4.5 h-4.5 text-emerald-500" />
                    <span>بيانات العميل والإصدار</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">الجهة / العميل</span>
                      <p className="font-black text-sm text-[var(--text-primary)]">{selectedInvoice.customerName}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">تاريخ الفاتورة</span>
                      <p className="font-bold text-sm text-[var(--text-primary)]">
                        {new Date(selectedInvoice.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">توقيت التسجيل</span>
                      <p className="font-mono text-sm text-[var(--text-secondary)]">
                        {new Date(selectedInvoice.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 📦 جدول أصناف الفاتورة المتطور */}
                <div className="glass-card rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4.5 h-4.5 text-emerald-500" />
                      <span className="text-sm font-black text-[var(--text-primary)]">الأدوية والمستلزمات المصدرة</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                      {selectedInvoice.items.length} أصناف
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs border-collapse">
                      <thead>
                        <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-bold">
                          <th className="p-4 text-center">#</th>
                          <th className="p-4 text-right">اسم الدواء / الصنف</th>
                          <th className="p-4 text-center">رقم التشغيلة</th>
                          <th className="p-4 text-center">الكمية</th>
                          <th className="p-4 text-center">سعر الوحدة</th>
                          <th className="p-4 text-left pl-6">الإجمالي الفرعي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="text-[var(--text-primary)] hover:bg-[var(--border-color)]/20 transition-colors">
                            <td className="p-4 text-center font-mono text-[var(--text-secondary)]">{idx + 1}</td>
                            <td className="p-4 text-right font-black text-[var(--text-primary)]">{item.productName}</td>
                            <td className="p-4 text-center font-mono">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] font-semibold text-[10px]">
                                {item.batchNumber}
                              </span>
                            </td>
                            <td className="p-4 text-center font-black font-mono text-sm">{item.qty}</td>
                            <td className="p-4 text-center font-mono text-[var(--text-secondary)]">{item.price.toLocaleString('en-US')} SDG</td>
                            <td className="p-4 text-left pl-6 font-black font-mono text-emerald-600">{(item.qty * item.price).toLocaleString('en-US')} SDG</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ⏳ خط زمني تفاعلي وأنيق للأقساط والدفعات المستحقة */}
                {selectedInvoice.installments && selectedInvoice.installments.length > 0 && (
                  <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-sm space-y-6">
                    <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                      <Calendar className="w-4.5 h-4.5 text-cyan-500" />
                      <span className="text-sm font-black text-[var(--text-primary)]">الخط الزمني وجدول سداد الأقساط</span>
                    </div>

                    <div className="relative pr-6 border-r-2 border-dashed border-[var(--border-color)] space-y-6 mr-3">
                      {selectedInvoice.installments.map((inst, idx) => {
                        const remaining = Math.max(0, inst.amount - inst.paidAmount);
                        return (
                          <div key={inst.id || idx} className="relative group text-right">
                            
                            {/* نقطة الخط الزمني المضيئة */}
                            <div className={`absolute -right-[31px] top-1 w-4 h-4 rounded-full border-2 bg-[var(--bg-secondary)] transition-all duration-300 ${
                              inst.status === 'PAID' ? 'border-emerald-500 ring-4 ring-emerald-500/10' :
                              inst.status === 'PARTIAL' ? 'border-amber-500 ring-4 ring-amber-500/10' :
                              'border-slate-300 dark:border-slate-700'
                            }`} />

                            <div className="bg-[var(--bg-primary)]/40 hover:bg-[var(--bg-primary)] border border-[var(--border-color)]/70 hover:border-cyan-500/15 p-4 rounded-2xl transition-all duration-300 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-xs text-[var(--text-primary)]">القسط #{idx + 1}</span>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                                    inst.status === 'PAID' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                                    inst.status === 'PARTIAL' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                                    'bg-slate-500/10 border-slate-500/20 text-[var(--text-secondary)]'
                                  }`}>
                                    {inst.status === 'PAID' ? 'تم السداد' : inst.status === 'PARTIAL' ? 'سداد جزئي' : 'قيد الانتظار'}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[var(--text-secondary)] font-semibold flex items-center gap-2">
                                  <span>تاريخ الاستحقاق:</span>
                                  <span className="font-mono font-bold text-[var(--text-primary)]">
                                    {new Date(inst.dueDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                {inst.notes && (
                                  <p className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-lg border border-[var(--border-color)] inline-block">
                                    💡 {inst.notes}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-5 sm:self-center font-mono">
                                <div className="text-center">
                                  <span className="block text-[9px] text-[var(--text-secondary)] font-bold">قيمة القسط</span>
                                  <strong className="text-xs text-[var(--text-primary)]">{inst.amount.toLocaleString()} SDG</strong>
                                </div>
                                <div className="w-[1px] h-8 bg-[var(--border-color)]" />
                                <div className="text-center">
                                  <span className="block text-[9px] text-emerald-600 font-bold">المسدد منه</span>
                                  <strong className="text-xs text-emerald-600">{inst.paidAmount.toLocaleString()} SDG</strong>
                                </div>
                                {remaining > 0 && (
                                  <>
                                    <div className="w-[1px] h-8 bg-[var(--border-color)]" />
                                    <div className="text-center">
                                      <span className="block text-[9px] text-rose-500 font-bold">المتبقي للقسط</span>
                                      <strong className="text-xs text-rose-500">{remaining.toLocaleString()} SDG</strong>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* الشريط الجانبي (Sidebar) للملخص المالي */}
              <div className="space-y-6">
                
                {/* 💳 كرت الملخص المالي ومؤشر التقدم الدائري المتطور */}
                <div className="glass-card rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-6 space-y-5 text-right shadow-sm sticky top-6">
                  <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3.5">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-black text-[var(--text-primary)]">الملخص المالي والتحصيل</span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)] font-bold">إجمالي قيمة المبيعات</span>
                      <strong className="font-mono text-sm text-[var(--text-primary)]">{selectedInvoice.total.toLocaleString('en-US')} SDG</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-600 font-bold">إجمالي المبلغ المحصّل</span>
                      <strong className="font-mono text-sm text-emerald-600">{selectedInvoice.paid.toLocaleString('en-US')} SDG</strong>
                    </div>
                    
                    <div className="w-full h-[1px] bg-[var(--border-color)]" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-rose-500 font-black">المتبقي المستحق للتحصيل</span>
                      <strong className="font-mono text-sm text-rose-500">{Math.max(0, selectedInvoice.total - selectedInvoice.paid).toLocaleString('en-US')} SDG</strong>
                    </div>
                  </div>

                  {/* 📊 مؤشر سداد الفاتورة التقدمي */}
                  <div className="pt-3 border-t border-[var(--border-color)]">
                    <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-bold mb-1.5">
                      <span>معدل التحصيل والاكتفاء:</span>
                      <span className="text-emerald-500 font-black">{selectedInvoice.total > 0 ? Math.round((selectedInvoice.paid / selectedInvoice.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-3 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-color)]/50 p-0.5">
                      <div
                        className="h-full bg-gradient-to-l from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 shadow-inner shadow-black/10"
                        style={{ width: `${selectedInvoice.total > 0 ? Math.min(100, (selectedInvoice.paid / selectedInvoice.total) * 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* زر السداد السريع المباشر */}
                  {selectedInvoice.status !== 'PAID' && (
                    <button
                      onClick={() => openPaymentModal(selectedInvoice)}
                      className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-emerald-500/10 hover:-translate-y-0.5"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>تسجيل دفعة نقدية فورية</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : !issuingInvoice ? (
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)]">إدارة الفواتير</h1>
              <p className="mt-1 text-sm sm:text-base text-[var(--text-secondary)]">
                شاشة شاملة لعرض الفواتير المصدرة، مراقبة المبيعات، وحفظ سجل الفواتير داخل النظام.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
              <button
                onClick={() => setShowPriceListModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-500/20 transition-colors w-full sm:w-auto"
              >
                <FileText className="w-4 h-4" />
                <span>قائمة الأسعار</span>
              </button>
              
              <button
                onClick={() => setIssuingInvoice(true)}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/20 transition-colors w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إصدار فاتورة جديدة</span>
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="glass-card p-4 sm:p-6 rounded-2xl border border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">عدد الفواتير</p>
                  <h2 className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-[var(--text-primary)]">{invoiceCount}</h2>
                </div>
                <div className="p-2 sm:p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--text-secondary)]">الفواتير المسجلة حتى الآن.</p>
            </div>

            <div className="glass-card p-4 sm:p-6 rounded-2xl border border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">إجمالي المبيعات</p>
                  <h2 className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-[var(--text-primary)]">{totalSalesAmount.toLocaleString('en-US')} SDG</h2>
                </div>
                <div className="p-2 sm:p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--text-secondary)]">قيمة الفواتير الإجمالية.</p>
            </div>

            <div className="glass-card p-4 sm:p-6 rounded-2xl border border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">المدفوعات</p>
                  <h2 className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-emerald-500">{totalPaidAmount.toLocaleString('en-US')} SDG</h2>
                </div>
                <div className="p-2 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--text-secondary)]">المبالغ المسددة.</p>
            </div>

            <div className="glass-card p-4 sm:p-6 rounded-2xl border border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">المستحقات</p>
                  <h2 className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold text-rose-500">{totalOutstanding.toLocaleString('en-US')} SDG</h2>
                </div>
                <div className="p-2 sm:p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--text-secondary)]">المبالغ المتبقية.</p>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-6 rounded-3xl border border-[var(--glass-border)]">
            {/* Search and Filters Dashboard Card Banner */}
            <div className="bg-emerald-500/[0.03] dark:bg-emerald-950/[0.15] border border-emerald-500/10 dark:border-emerald-500/5 rounded-3xl p-4 sm:p-6 mb-6 space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/[0.03] to-transparent dark:from-emerald-500/5 dark:to-transparent border border-emerald-500/10">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <span className="w-2.5 h-6 rounded-full bg-emerald-600 block"></span>
                    الفواتير المصدرة
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)]">عرض سريع لكل الفواتير المسجلة وأوضاع الدفع والتصدير.</p>
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير إكسل</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial"
                  >
                    <Printer className="w-4 h-4" />
                    <span>تصدير بي دي إف</span>
                  </button>
                </div>
              </div>

              {/* Date and Custom Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end" dir="rtl">
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">من تاريخ</label>
                  <DatePicker value={fromDate} onChange={setFromDate} placeholder="اختر تاريخ البداية" />
                </div>
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">إلى تاريخ</label>
                  <DatePicker value={toDate} onChange={setToDate} placeholder="اختر تاريخ النهاية" />
                </div>
                <div className="space-y-1.5 text-right relative">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">العميل</label>
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={isFilterCustomerDropdownOpen ? filterCustomerSearch : (filterCustomerName || 'جميع العملاء')}
                      placeholder="ابحث عن العميل..."
                      onFocus={() => {
                        setFilterCustomerSearch('');
                        setIsFilterCustomerDropdownOpen(true);
                      }}
                      onChange={(e) => {
                        setFilterCustomerSearch(e.target.value);
                        setIsFilterCustomerDropdownOpen(true);
                      }}
                      className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50 transition-colors h-[42px]"
                    />
                    {isFilterCustomerDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xl max-h-60 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterCustomerName('');
                            setIsFilterCustomerDropdownOpen(false);
                          }}
                          className="w-full text-right px-4 py-2.5 hover:bg-[var(--border-color)]/30 text-[var(--text-secondary)] text-sm transition-colors block border-b border-[var(--border-color)]/20 last:border-0 font-bold"
                        >
                          جميع العملاء
                        </button>
                        {customers
                          .filter(c => c.name.toLowerCase().includes(filterCustomerSearch.toLowerCase()))
                          .map((c) => (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => {
                                setFilterCustomerName(c.name);
                                setIsFilterCustomerDropdownOpen(false);
                              }}
                              className="w-full text-right px-4 py-2.5 hover:bg-[var(--border-color)]/30 text-[var(--text-primary)] text-sm transition-colors block border-b border-[var(--border-color)]/20 last:border-0"
                            >
                              {c.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {isFilterCustomerDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsFilterCustomerDropdownOpen(false)} 
                    />
                  )}
                </div>
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-[var(--text-secondary)]">حالة المبالغ</label>
                  <select
                    value={filterPaymentStatus}
                    onChange={(e) => setFilterPaymentStatus(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50 transition-colors h-[42px]"
                  >
                    <option value="">جميع الحالات</option>
                    <option value="PAID">مدفوع بالكامل</option>
                    <option value="PARTIAL">مدفوع جزئياً</option>
                    <option value="PENDING">غير مدفوع / معلق</option>
                  </select>
                </div>
              </div>

              {(fromDate || toDate || filterCustomerName || filterPaymentStatus) && (
                <div className="flex justify-end">
                  <button
                    onClick={() => { setFromDate(''); setToDate(''); setFilterCustomerName(''); setFilterPaymentStatus(''); }}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>إلغاء جميع الفلاتر</span>
                  </button>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث برقم الفاتورة أو اسم العميل..."
                  className="w-full pr-10 pl-4 py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-dashed border-[var(--border-color)] p-8 sm:p-10 text-center">
                <div className="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="mt-3 text-[var(--text-secondary)]">جاري تحميل الفواتير...</p>
              </div>
            ) : filteredInvoiceList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border-color)] p-8 sm:p-10 text-center">
                <p className="text-[var(--text-secondary)]">
                  {searchQuery.trim() ? 'لا توجد فواتير تطابق بحثك.' : 'لا توجد فواتير مسجلة حتى الآن.'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile: Cards View */}
                <div className="lg:hidden space-y-3">
                  {paginatedInvoiceList.map((sale: Invoice) => (
                    <InvoiceCard key={sale.id} sale={sale} />
                  ))}
                </div>
                
                {/* Desktop: Table View */}
                <div className="hidden lg:block overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
                  <table className="w-full text-right text-sm border-collapse">
                    <thead>
                      <tr className="bg-emerald-700 text-white dark:bg-emerald-950/70 dark:text-emerald-200 font-bold border-b border-emerald-600/20">
                        <th 
                          onClick={() => handleSort('id')} 
                          className="py-4 px-4 pr-6 text-right rounded-tr-2xl cursor-pointer hover:bg-emerald-800/80 transition-colors select-none"
                        >
                          <div className="flex items-center gap-1">
                            <span>رقم الفاتورة</span>
                            {renderSortArrow('id')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('customerName')} 
                          className="py-4 px-4 text-center cursor-pointer hover:bg-emerald-800/80 transition-colors select-none"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>العميل</span>
                            {renderSortArrow('customerName')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('createdAt')} 
                          className="py-4 px-4 text-center cursor-pointer hover:bg-emerald-800/80 transition-colors select-none"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>التاريخ</span>
                            {renderSortArrow('createdAt')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('total')} 
                          className="py-4 px-4 text-center cursor-pointer hover:bg-emerald-800/80 transition-colors select-none"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>الإجمالي</span>
                            {renderSortArrow('total')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('paid')} 
                          className="py-4 px-4 text-center cursor-pointer hover:bg-emerald-800/80 transition-colors select-none"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>المدفوع</span>
                            {renderSortArrow('paid')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('remaining')} 
                          className="py-4 px-4 text-center cursor-pointer hover:bg-emerald-800/80 transition-colors select-none"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>المتبقي</span>
                            {renderSortArrow('remaining')}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('status')} 
                          className="py-4 px-4 text-center cursor-pointer hover:bg-emerald-800/80 transition-colors select-none"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>الحالة</span>
                            {renderSortArrow('status')}
                          </div>
                        </th>
                        <th className="py-4 px-4 pl-6 text-center rounded-tl-2xl select-none">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {paginatedInvoiceList.map((sale: Invoice) => {
                        const remaining = Math.max(0, sale.total - sale.paid);
                        return (
                          <tr 
                            key={sale.id} 
                            onClick={() => setSelectedInvoice(sale)} 
                            className="hover:bg-[var(--border-color)]/30 transition-colors cursor-pointer"
                          >
                            <td className="py-4 px-4 pr-6 font-mono font-semibold text-[var(--text-primary)]">{sale.id}</td>
                            <td className="py-4 px-4 text-center text-[var(--text-primary)]">{sale.customerName}</td>
                            <td className="py-4 px-4 text-center font-mono text-[var(--text-secondary)]">{new Date(sale.createdAt).toLocaleDateString('en-US')}</td>
                            <td className="py-4 px-4 text-center font-bold text-[var(--text-primary)]">{sale.total.toLocaleString('en-US')} SDG</td>
                            <td className="py-4 px-4 text-center font-bold text-emerald-500">{sale.paid.toLocaleString('en-US')} SDG</td>
                            <td className="py-4 px-4 text-center font-mono text-rose-500">{remaining.toLocaleString('en-US')} SDG</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                                sale.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 
                                sale.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500' : 
                                'bg-gray-500/10 text-gray-500'
                              }`}>
                                {sale.status === 'PAID' ? 'مدفوع' : sale.status === 'PARTIAL' ? 'جزئي' : 'معلق'}
                              </span>
                            </td>
                            <td className="py-4 px-4 pl-6 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                {sale.status !== 'PAID' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openPaymentModal(sale); }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    سداد
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePrint(sale); }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 text-xs font-semibold transition-colors"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  طباعة
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 🎚️ لوحة التحكم بالترقيم والصفحات الفاخرة (Premium Pagination Controls Card) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-[var(--bg-secondary)] p-4 rounded-3xl border border-[var(--border-color)] shadow-sm text-xs font-bold text-[var(--text-secondary)]" dir="rtl">
                  {/* تحديد عدد الفواتير في الصفحة */}
                  <div className="flex items-center gap-2">
                    <span>عرض</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-bold outline-none focus:border-emerald-500/50 cursor-pointer"
                    >
                      {[10, 25, 50, 75, 100].map(val => (
                        <option key={val} value={val}>{val} فواتير</option>
                      ))}
                    </select>
                    <span>لكل صفحة</span>
                  </div>

                  {/* معلومات عرض الصفحات المرجعية */}
                  <div className="text-center font-semibold">
                    عرض الفواتير <strong className="text-[var(--text-primary)] font-mono">{(currentPage - 1) * itemsPerPage + 1}</strong> إلى <strong className="text-[var(--text-primary)] font-mono">{Math.min(currentPage * itemsPerPage, filteredInvoiceList.length)}</strong> من أصل <strong className="text-emerald-500 font-mono">{filteredInvoiceList.length}</strong> فواتير مصدرة
                  </div>

                  {/* أزرار التنقل السريعة الفاخرة */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 bg-[var(--bg-primary)] hover:bg-[var(--border-color)]/50 border border-[var(--border-color)] text-[var(--text-primary)] disabled:opacity-40 rounded-xl transition-all cursor-pointer font-black"
                    >
                      السابق
                    </button>
                    
                    {/* أرقام الصفحات الذكية */}
                    <div className="flex items-center gap-1 mx-1.5">
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        // Only show first, last, current, and pages around current to avoid overflow
                        if (
                          pageNum === 1 || 
                          pageNum === totalPages || 
                          Math.abs(currentPage - pageNum) <= 1
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all font-mono font-black text-xs cursor-pointer ${
                                currentPage === pageNum 
                                  ? 'bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/10' 
                                  : 'hover:bg-[var(--border-color)]/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          (pageNum === 2 && currentPage > 3) || 
                          (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                        ) {
                          return <span key={pageNum} className="text-[var(--text-secondary)] px-0.5">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3.5 py-2 bg-[var(--bg-primary)] hover:bg-[var(--border-color)]/50 border border-[var(--border-color)] text-[var(--text-primary)] disabled:opacity-40 rounded-xl transition-all cursor-pointer font-black"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-[var(--bg-primary)]">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">إصدار فاتورة جديدة</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">تحديث شامل لمعلومات الفاتورة والعميل.</p>
            </div>
            <button onClick={closeIssueModal} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-2xl font-semibold transition-colors">
              <X className="w-4 h-4" /><span>العودة</span>
            </button>
          </div>

          <div className="p-4 sm:p-6" dir="rtl">
            {/* Mobile Layout */}
            <div className="lg:hidden space-y-6">
              <div className="glass-card-no-backdrop p-5 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/20">
                <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-secondary)] mb-4">
                  <UserCheck className="w-5 h-5" /> بيانات العميل
                </div>
                 <div className="relative w-full">
                   <div className="flex gap-2">
                     <div className="relative flex-1">
                      <input
                        type="text"
                        value={isCustomerDropdownOpen ? customerSearch : (selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.state}` : '')}
                        placeholder="ابحث عن العميل أو اختر..."
                        onFocus={() => {
                          setCustomerSearch('');
                          setIsCustomerDropdownOpen(true);
                        }}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setIsCustomerDropdownOpen(true);
                        }}
                        className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none pr-10 text-right text-sm focus:border-emerald-500/50 h-11"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--text-secondary)]">
                        <Search className="w-4 h-4" />
                      </div>
                       {isCustomerDropdownOpen && (
                         <div className="absolute z-50 w-full mt-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xl max-h-60 overflow-y-auto">
                          {filteredCustomersForSelect.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setQuickCust({ name: customerSearch, type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000 });
                                setShowQuickAddCustomer(true);
                                setIsCustomerDropdownOpen(false);
                              }}
                              className="w-full text-right px-4 py-3 hover:bg-[var(--border-color)]/30 text-emerald-500 font-semibold text-xs border-b border-[var(--border-color)]/50 transition-colors flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              <span>إضافة عميل جديد باسم "{customerSearch}"</span>
                            </button>
                          ) : (
                            filteredCustomersForSelect.map((c: Customer) => (
                              <button
                                type="button"
                                key={c.id}
                                onClick={() => {
                                  setSelectedCustomerId(c.id);
                                  setIsCustomerDropdownOpen(false);
                                }}
                                className="w-full text-right px-4 py-2.5 hover:bg-[var(--border-color)]/30 text-[var(--text-primary)] text-sm transition-colors block border-b border-[var(--border-color)]/20 last:border-0"
                              >
                                {c.name} - {c.state} ({c.type === 'Pharmacy' ? 'صيدلية' : c.type === 'Hospital' ? 'مستشفى' : 'موزع'})
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCust({ name: customerSearch, type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000 });
                        setShowQuickAddCustomer(true);
                      }}
                      className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer h-11"
                      title="إضافة عميل جديد"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {isCustomerDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsCustomerDropdownOpen(false)} 
                    />
                  )}
                </div>
                {selectedCustomer && (
                  <div className="mt-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-secondary)]">
                    <div className="mb-2">العميل المحدد: <strong className="text-[var(--text-primary)]">{selectedCustomer.name}</strong></div>
                    <div>النوع: <strong>{selectedCustomer.type}</strong></div>
                    <div>الولاية: <strong>{selectedCustomer.state}</strong></div>
                  </div>
                )}
              </div>

              <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/10">
                <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-secondary)] mb-4">
                  <ShoppingCart className="w-5 h-5" /> إضافة أصناف الفاتورة
                </div>
                   <form onSubmit={handleAddToCart} className="space-y-4">
                   <div className="relative w-full">
                     <div className="relative">
                      <input
                        type="text"
                        value={isProductDropdownOpen ? productSearch : (products.find(p => p.id === selectedProductId)?.name || '')}
                        placeholder="ابحث عن المنتج..."
                        onFocus={() => {
                          setProductSearch('');
                          setIsProductDropdownOpen(true);
                        }}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setIsProductDropdownOpen(true);
                        }}
                        className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none pr-10 text-right text-sm focus:border-emerald-500/50 h-11"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--text-secondary)]">
                        <Search className="w-4 h-4" />
                      </div>
                       {isProductDropdownOpen && (
                         <div className="absolute z-50 w-full mt-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xl max-h-60 overflow-y-auto">
                          {filteredProductsForSelect.length === 0 ? (
                            <div className="text-center py-3 text-xs text-[var(--text-secondary)]">لا توجد منتجات تطابق البحث</div>
                          ) : (
                            filteredProductsForSelect.map((p) => (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => {
                                  setSelectedProductId(p.id);
                                  setIsProductDropdownOpen(false);
                                }}
                                className="w-full text-right px-4 py-2.5 hover:bg-[var(--border-color)]/30 text-[var(--text-primary)] text-sm transition-colors block border-b border-[var(--border-color)]/20 last:border-0"
                              >
                                {p.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {isProductDropdownOpen && (
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setIsProductDropdownOpen(false)} 
                      />
                    )}
                  </div>
                  <select value={selectedBatchId} onChange={(e) => { setSelectedBatchId(e.target.value); const sb = batches.find(b => b.id === e.target.value); if (sb) setPrice(Math.round(sb.costPrice * 1.25)); }} disabled={fefoBatches.length === 0} className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none disabled:opacity-50 h-11">
                    <option value="">اختر التشغيلة</option>
                    {fefoBatches.map((b: Batch, index: number) => (
                      <option key={b.id} value={b.id}>
                        {b.batchNumber} (المتاح: {b.qty}) {index === 0 ? ' 👈 [موصى بصرفه أولاً - FEFO ⭐]' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} placeholder="الكمية" className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none h-11" />
                    <input type="number" min={0.1} step="any" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="سعر البيع" className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none h-11" />
                  </div>
                  <button type="submit" disabled={!selectedBatchId} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 h-11"><Plus className="w-4 h-4" />إضافة</button>
                </form>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/10">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">عناصر الفاتورة</h4>
                {cart.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-6 text-center text-sm text-[var(--text-secondary)]">لم يضف بعد أي منتج.</div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {cart.map((item: CartItem) => (
                      <div key={item.batchId} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--bg-secondary)] p-3">
                        <div className="space-y-1 text-right">
                          <p className="font-medium text-[var(--text-primary)]">{item.productName}</p>
                          <p className="text-[var(--text-secondary)] text-xs">{item.batchNumber} • {item.qty} x {item.price} SDG</p>
                        </div>
                        <button onClick={() => removeFromCart(item.batchId)} className="rounded-2xl bg-rose-500/10 px-3 py-2 text-rose-500 text-xs font-semibold h-11">حذف</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/10 space-y-5">
                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex justify-between"><span>إجمالي الفاتورة</span><strong className="text-[var(--text-primary)] text-base">{cartTotal.toLocaleString('en-US')} SDG</strong></div>
                  <div className="flex justify-between"><span>المدفوع حالياً</span><strong className="text-emerald-500 text-base">{paidAmount.toLocaleString('en-US')} SDG</strong></div>
                  <div className="flex justify-between border-t border-[var(--border-color)] pt-3"><span className="font-semibold">المتبقي</span><strong className="font-semibold text-rose-500 text-base">{Math.max(0, cartTotal - paidAmount).toLocaleString('en-US')} SDG</strong></div>
                </div>
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">تاريخ الفاتورة</label>
                  <DatePicker
                    value={invoiceDate}
                    onChange={setInvoiceDate}
                  />
                </div>
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">المبلغ المدفوع</label>
                  <input type="number" min={0} step="any" value={paidAmount} onChange={(e) => { setPaidAmount(Number(e.target.value)); setUsePaymentPlan(false); setInstallmentsPlan([]); }} placeholder="المبلغ المدفوع" className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none h-11" />
                </div>
                {cartTotal - paidAmount > 0 && (
                  <div className="space-y-4 border-t border-[var(--border-color)] pt-4 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-bold text-[var(--text-primary)]">تفعيل خطة سداد بالأقساط</span>
                      <input
                        type="checkbox"
                        checked={usePaymentPlan}
                        onChange={(e) => {
                          setUsePaymentPlan(e.target.checked);
                          if (e.target.checked && installmentsPlan.length === 0) {
                            setInstallmentsPlan([{ dueDate: getTodayStr(), amount: cartTotal - paidAmount, notes: '' }]);
                          }
                        }}
                        className="w-5 h-5 text-emerald-600 border-[var(--border-color)] rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    {usePaymentPlan && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold text-[var(--text-secondary)]">جدول الدفعات</span>
                          <button
                            type="button"
                            onClick={addInstallmentToPlan}
                            className="text-sm text-emerald-500 font-extrabold hover:underline cursor-pointer"
                          >
                            + إضافة دفعة
                          </button>
                        </div>
                        {installmentsPlan.map((inst, idx) => (
                          <div key={idx} className="p-4 bg-[var(--bg-primary)]/40 rounded-xl border border-[var(--border-color)]/70 space-y-3 text-sm">
                            <div className="flex justify-between items-center border-b border-[var(--border-color)]/30 pb-2">
                              <span className="font-bold text-[var(--text-primary)] text-sm sm:text-base">الدفعة #{idx + 1}</span>
                              {installmentsPlan.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeInstallmentFromPlan(idx)}
                                  className="text-rose-500 hover:underline cursor-pointer font-bold text-xs"
                                >
                                  حذف
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] block mb-1">تاريخ الاستحقاق</label>
                                <DatePicker
                                  value={inst.dueDate}
                                  onChange={(val) => updateInstallmentInPlan(idx, 'dueDate', val)}
                                />
                              </div>
                              <div>
                                <label className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] block mb-1">المبلغ (SDG)</label>
                                <input
                                  type="text"
                                  value={inst.amount}
                                  onChange={(e) => updateInstallmentInPlan(idx, 'amount', e.target.value)}
                                  className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-black text-center text-sm sm:text-base outline-none focus:border-emerald-500/50"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] block mb-1">ملاحظات الدفعة</label>
                              <input
                                type="text"
                                value={inst.notes}
                                placeholder="مثلاً: دفعة بشيك أو نقداً"
                                onChange={(e) => updateInstallmentInPlan(idx, 'notes', e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm"
                              />
                            </div>
                          </div>
                        ))}
                        <div className="text-xs sm:text-sm text-right text-amber-500 font-extrabold bg-amber-500/10 p-3 rounded-lg border border-amber-500/25">
                          مجموع الدفعات المجدولة: {installmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0).toLocaleString()} SDG
                          {Math.abs((cartTotal - paidAmount) - installmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0)) > 0.01 && (
                            <span className="block text-[11px] text-rose-500 mt-1.5 font-bold">يجب أن يطابق المتبقي: {(cartTotal - paidAmount).toLocaleString()} SDG</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <button 
                  onClick={handleCheckout} 
                  disabled={!selectedCustomerId || cart.length === 0 || isSubmitting} 
                  className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors h-11 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الإصدار...</span>
                    </>
                  ) : (
                    <span>إصدار الفاتورة</span>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-[2fr_420px] gap-6">
              <div className="space-y-6">
                <div className="glass-card-no-backdrop p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/20">
                  <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-secondary)] mb-5"><UserCheck className="w-5 h-5" /> بيانات العميل</div>
                   <div className="relative w-full">
                     <div className="flex gap-2">
                       <div className="relative flex-1">
                        <input
                          type="text"
                          value={isCustomerDropdownOpen ? customerSearch : (selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.state}` : '')}
                          placeholder="ابحث عن العميل أو اختر من القائمة..."
                          onFocus={() => {
                            setCustomerSearch('');
                            setIsCustomerDropdownOpen(true);
                          }}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setIsCustomerDropdownOpen(true);
                          }}
                          className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none pr-10 text-right text-sm focus:border-emerald-500/50"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--text-secondary)]">
                          <Search className="w-4 h-4" />
                        </div>
                        {isCustomerDropdownOpen && (
                          <div className="absolute z-50 w-full mt-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xl max-h-60 overflow-y-auto">
                            {filteredCustomersForSelect.length === 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickCust({ name: customerSearch, type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000 });
                                  setShowQuickAddCustomer(true);
                                  setIsCustomerDropdownOpen(false);
                                }}
                                className="w-full text-right px-4 py-3 hover:bg-[var(--border-color)]/30 text-emerald-500 font-semibold text-xs border-b border-[var(--border-color)]/50 transition-colors flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                <span>إضافة عميل جديد باسم "{customerSearch}"</span>
                              </button>
                            ) : (
                              filteredCustomersForSelect.map((c: Customer) => (
                                <button
                                  type="button"
                                  key={c.id}
                                  onClick={() => {
                                    setSelectedCustomerId(c.id);
                                    setIsCustomerDropdownOpen(false);
                                  }}
                                  className="w-full text-right px-4 py-2.5 hover:bg-[var(--border-color)]/30 text-[var(--text-primary)] text-sm transition-colors block border-b border-[var(--border-color)]/20 last:border-0"
                                >
                                  {c.name} - {c.state} ({c.type === 'Pharmacy' ? 'صيدلية' : c.type === 'Hospital' ? 'مستشفى' : 'موزع'})
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickCust({ name: customerSearch, type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000 });
                          setShowQuickAddCustomer(true);
                        }}
                        className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
                        title="إضافة عميل جديد"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    {isCustomerDropdownOpen && (
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setIsCustomerDropdownOpen(false)} 
                      />
                    )}
                  </div>
                  {selectedCustomer && (
                    <div className="mt-4 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-secondary)]">
                      <div className="mb-2">العميل المحدد: <strong className="text-[var(--text-primary)]">{selectedCustomer.name}</strong></div>
                      <div>النوع: <strong>{selectedCustomer.type}</strong></div>
                      <div>الولاية: <strong>{selectedCustomer.state}</strong></div>
                 </div>
               )}
             </div>
 
             <div className="glass-card-no-backdrop p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/10">
               <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-secondary)] mb-5"><ShoppingCart className="w-5 h-5" /> إضافة أصناف الفاتورة</div>
                  <form onSubmit={handleAddToCart} className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                     <div className="lg:col-span-2 space-y-1 relative">
                      <label className="block text-xs text-[var(--text-secondary)]">المنتج</label>
                   <div className="relative w-full">
                     <div className="relative">
                          <input
                            type="text"
                            value={isProductDropdownOpen ? productSearch : (products.find(p => p.id === selectedProductId)?.name || '')}
                            placeholder="ابحث عن المنتج..."
                            onFocus={() => {
                              setProductSearch('');
                              setIsProductDropdownOpen(true);
                            }}
                            onChange={(e) => {
                              setProductSearch(e.target.value);
                              setIsProductDropdownOpen(true);
                            }}
                            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none pr-10 text-right text-sm focus:border-emerald-500/50"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--text-secondary)]">
                            <Search className="w-4 h-4" />
                          </div>
                          {isProductDropdownOpen && (
                            <div className="absolute z-50 w-full mt-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xl max-h-60 overflow-y-auto">
                              {filteredProductsForSelect.length === 0 ? (
                                <div className="text-center py-3 text-xs text-[var(--text-secondary)]">لا توجد منتجات تطابق البحث</div>
                              ) : (
                                filteredProductsForSelect.map((p) => (
                                  <button
                                    type="button"
                                    key={p.id}
                                    onClick={() => {
                                      setSelectedProductId(p.id);
                                      setIsProductDropdownOpen(false);
                                    }}
                                    className="w-full text-right px-4 py-2.5 hover:bg-[var(--border-color)]/30 text-[var(--text-primary)] text-sm transition-colors block border-b border-[var(--border-color)]/20 last:border-0"
                                  >
                                    {p.name}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        {isProductDropdownOpen && (
                          <div 
                            className="fixed inset-0 z-40 bg-transparent" 
                            onClick={() => setIsProductDropdownOpen(false)} 
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-[var(--text-secondary)]">التشغيليلة</label>
                      <select value={selectedBatchId} onChange={(e) => { setSelectedBatchId(e.target.value); const sb = batches.find(b => b.id === e.target.value); if (sb) setPrice(Math.round(sb.costPrice * 1.25)); }} disabled={fefoBatches.length === 0} className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none disabled:opacity-50">
                        <option value="">اختر التشغيلة</option>
                        {fefoBatches.map((b: Batch, index: number) => (
                          <option key={b.id} value={b.id}>
                            {b.batchNumber} (المتاح: {b.qty}) {index === 0 ? ' 👈 [موصى بصرفه أولاً - FEFO ⭐]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-[var(--text-secondary)]">الكمية</label>
                      <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" />
                    </div>
                    <div className="lg:col-span-4 flex justify-end">
                      <button type="submit" disabled={!selectedBatchId} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"><Plus className="w-4 h-4" />إضافة</button>
                    </div>
                  </form>
                </div>

                <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/10">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">عناصر الفاتورة</h4>
                  {cart.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-[var(--border-color)] p-6 text-center text-sm text-[var(--text-secondary)]">لم يضف بعد أي منتج.</div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      {cart.map((item: CartItem) => (
                        <div key={item.batchId} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--bg-secondary)] p-3">
                          <div className="space-y-1 text-right">
                            <p className="font-medium text-[var(--text-primary)]">{item.productName}</p>
                            <p className="text-[var(--text-secondary)] text-xs">{item.batchNumber} • {item.qty} x {item.price} SDG</p>
                          </div>
                          <button onClick={() => removeFromCart(item.batchId)} className="rounded-2xl bg-rose-500/10 px-3 py-2 text-rose-500 text-xs font-semibold">حذف</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6 xl:sticky xl:top-6">
                <div className="glass-card p-7 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] shadow-lg shadow-black/10">
                  <div className="flex items-center justify-between mb-5"><h4 className="text-base font-semibold text-[var(--text-primary)]">الملخص</h4><span className="text-xs text-[var(--text-secondary)]">{cart.length} صنف</span></div>
                  <div className="space-y-5 text-sm text-[var(--text-secondary)]">
                    <div className="flex justify-between"><span>إجمالي الفاتورة</span><strong className="text-[var(--text-primary)] text-base">{cartTotal.toLocaleString('en-US')} SDG</strong></div>
                    <div className="flex justify-between"><span>المدفوع حالياً</span><strong className="text-emerald-500 text-base">{paidAmount.toLocaleString('en-US')} SDG</strong></div>
                    <div className="flex justify-between border-t border-[var(--border-color)] pt-5"><span className="font-semibold">المتبقي</span><strong className="font-semibold text-rose-500 text-base">{Math.max(0, cartTotal - paidAmount).toLocaleString('en-US')} SDG</strong></div>
                  </div>
                </div>
                <div className="glass-card p-7 rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-secondary)] space-y-5 shadow-lg shadow-black/10">
                  <div className="space-y-2 text-sm text-right">
                    <label className="block text-[var(--text-secondary)] font-semibold">تاريخ الفاتورة</label>
                    <DatePicker
                      value={invoiceDate}
                      onChange={setInvoiceDate}
                    />
                  </div>
                  <div className="space-y-2 text-sm text-right">
                    <label className="block text-[var(--text-secondary)] font-semibold">المبلغ المدفوع</label>
                    <input type="number" min={0} step="any" value={paidAmount} onChange={(e) => { setPaidAmount(Number(e.target.value)); setUsePaymentPlan(false); setInstallmentsPlan([]); }} className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" />
                  </div>
                  {cartTotal - paidAmount > 0 && (
                    <div className="space-y-4 border-t border-[var(--border-color)] pt-4 text-right">
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base font-bold text-[var(--text-primary)]">تفعيل خطة سداد بالأقساط</span>
                        <input
                          type="checkbox"
                          checked={usePaymentPlan}
                          onChange={(e) => {
                            setUsePaymentPlan(e.target.checked);
                            if (e.target.checked && installmentsPlan.length === 0) {
                              setInstallmentsPlan([{ dueDate: getTodayStr(), amount: cartTotal - paidAmount, notes: '' }]);
                            }
                          }}
                          className="w-5 h-5 text-emerald-600 border-[var(--border-color)] rounded focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>

                      {usePaymentPlan && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-[var(--text-secondary)]">جدول الدفعات</span>
                            <button
                              type="button"
                              onClick={addInstallmentToPlan}
                              className="text-sm text-emerald-500 font-extrabold hover:underline cursor-pointer"
                            >
                              + إضافة دفعة
                            </button>
                          </div>
                          {installmentsPlan.map((inst, idx) => (
                            <div key={idx} className="p-4 bg-[var(--bg-primary)]/40 rounded-xl border border-[var(--border-color)]/70 space-y-3 text-sm">
                              <div className="flex justify-between items-center border-b border-[var(--border-color)]/30 pb-2">
                                <span className="font-bold text-[var(--text-primary)] text-sm sm:text-base">الدفعة #{idx + 1}</span>
                                {installmentsPlan.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeInstallmentFromPlan(idx)}
                                    className="text-rose-500 hover:underline cursor-pointer font-bold text-xs"
                                  >
                                    حذف
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] block mb-1">تاريخ الاستحقاق</label>
                                  <DatePicker
                                    value={inst.dueDate}
                                    onChange={(val) => updateInstallmentInPlan(idx, 'dueDate', val)}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] block mb-1">المبلغ (SDG)</label>
                                  <input
                                    type="text"
                                    value={inst.amount}
                                    onChange={(e) => updateInstallmentInPlan(idx, 'amount', e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-black text-center text-sm sm:text-base outline-none focus:border-emerald-500/50"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] block mb-1">ملاحظات الدفعة</label>
                                <input
                                  type="text"
                                  value={inst.notes}
                                  placeholder="مثلاً: دفعة بشيك أو نقداً"
                                  onChange={(e) => updateInstallmentInPlan(idx, 'notes', e.target.value)}
                                  className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm"
                                />
                              </div>
                            </div>
                          ))}
                          <div className="text-xs sm:text-sm text-right text-amber-500 font-extrabold bg-amber-500/10 p-3 rounded-lg border border-amber-500/25">
                            مجموع الدفعات المجدولة: {installmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0).toLocaleString()} SDG
                            {Math.abs((cartTotal - paidAmount) - installmentsPlan.reduce((sum, inst) => sum + parseDigits(inst.amount), 0)) > 0.01 && (
                              <span className="block text-[11px] text-rose-500 mt-1.5 font-bold">يجب أن يطابق المتبقي: {(cartTotal - paidAmount).toLocaleString()} SDG</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <button 
                    onClick={handleCheckout} 
                    disabled={!selectedCustomerId || cart.length === 0 || isSubmitting} 
                    className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري الإصدار...</span>
                      </>
                    ) : (
                      <span>إصدار الفاتورة</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Payment Modal */}
      {paymentModal.open && paymentModal.invoice && (
        <div className="modal-overlay" onClick={closePaymentModal}>
          <div className="modal-content-card max-w-md" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">سداد الفاتورة</h3>
              <button onClick={closePaymentModal} className="p-2 rounded-xl bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="glass-card rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">رقم الفاتورة</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">{paymentModal.invoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">العميل</span>
                <span className="font-semibold text-[var(--text-primary)]">{paymentModal.invoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">الإجمالي</span>
                <span className="font-semibold text-[var(--text-primary)]">{paymentModal.invoice.total.toLocaleString('en-US')} SDG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">المدفوع سابقاً</span>
                <span className="font-semibold text-emerald-500">{paymentModal.invoice.paid.toLocaleString('en-US')} SDG</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-color)] pt-2">
                <span className="font-semibold text-[var(--text-secondary)]">المتبقي</span>
                <span className="font-semibold text-rose-500">{Math.max(0, paymentModal.invoice.total - paymentModal.invoice.paid).toLocaleString('en-US')} SDG</span>
              </div>
            </div>

            <div className="space-y-4">
              <input type="number" min={1} max={Math.max(0, paymentModal.invoice.total - paymentModal.invoice.paid)} step="any" value={paymentModal.amount} onChange={(e) => setPaymentModal((prev) => ({ ...prev, amount: Number(e.target.value) }))} className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-5 py-4 text-xl font-bold text-[var(--text-primary)] outline-none text-center focus:border-emerald-500/50 transition-colors" />
              
              <div className="grid grid-cols-3 gap-2">
                {[0.25, 0.5, 0.75].map((fraction) => {
                  const remaining = paymentModal.invoice!.total - paymentModal.invoice!.paid;
                  const quickAmount = Math.round(remaining * fraction);
                  return (
                    <button key={fraction} onClick={() => setPaymentModal((prev) => ({ ...prev, amount: quickAmount }))} className="px-3 py-2 rounded-xl bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] text-xs font-semibold transition-colors">
                      {Math.round(fraction * 100)}%
                    </button>
                  );
                })}
                <button onClick={() => setPaymentModal((prev) => ({ ...prev, amount: Math.max(0, prev.invoice!.total - prev.invoice!.paid) }))} className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-semibold transition-colors">
                  كامل المبلغ
                </button>
              </div>

              <button onClick={handlePaymentSubmit} disabled={paymentModal.amount <= 0 || paymentModal.loading || paymentModal.amount > Math.max(0, paymentModal.invoice.total - paymentModal.invoice.paid)} className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {paymentModal.loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /><span>تأكيد السداد</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Quick Add Customer Modal */}

      {showQuickAddCustomer && (
        <div className="modal-overlay z-[9999]" onClick={() => setShowQuickAddCustomer(false)}>
          <div className="modal-content-card max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">إضافة عميل معتمد جديد</h3>
            
            <form onSubmit={handleQuickAddCustomer} className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">اسم الجهة (الصيدلية / المستشفى)</label>
                <input 
                  type="text" 
                  required
                  value={quickCust.name}
                  onChange={(e) => setQuickCust({ ...quickCust, name: e.target.value })}
                  placeholder="اسم الصيدلية أو الموزع"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">نوع العميل</label>
                  <select 
                    value={quickCust.type}
                    onChange={(e) => setQuickCust({ ...quickCust, type: e.target.value })}
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
                    value={quickCust.state}
                    onChange={(e) => setQuickCust({ ...quickCust, state: e.target.value })}
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
                    value={quickCust.phone}
                    onChange={(e) => setQuickCust({ ...quickCust, phone: e.target.value })}
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
                    value={quickCust.creditLimit}
                    onChange={(e) => setQuickCust({ ...quickCust, creditLimit: Number(e.target.value) })}
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
                  onClick={() => setShowQuickAddCustomer(false)}
                  className="px-4 py-2 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Warning Modal */}
      {deleteConfirm.open && (
        <div className="modal-overlay z-9999" onClick={() => setDeleteConfirm({ open: false, invoiceId: null, loading: false })}>
          <div className="modal-content-card max-w-sm border-rose-500/20 bg-[var(--bg-secondary)] shadow-2xl shadow-rose-950/20" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center gap-3 mb-4 text-rose-500">
              <AlertCircle className="w-8 h-8 animate-bounce" />
              <h3 className="text-lg font-bold">تأكيد حذف الفاتورة؟</h3>
            </div>
            
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              هل أنت متأكد تماماً من رغبتك في حذف هذه الفاتورة؟ 
              <br />
              <strong className="text-rose-500">تنبيه هام:</strong> سيقوم النظام برفع كميات الأدوية تلقائياً وإرجاعها للمخازن والتشغيلات الأصلية الخاصة بها لضمان دقة الأرصدة.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteSale()}
                disabled={deleteConfirm.loading}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {deleteConfirm.loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>نعم، حذف نهائي</span>
                )}
              </button>
              <button
                onClick={() => setDeleteConfirm({ open: false, invoiceId: null, loading: false })}
                className="flex-1 py-3 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price List Generator Modal */}
      {showPriceListModal && (() => {
        const activeCols = ['name', ...columnsOrder.filter(col => selectedColumns.includes(col))];
        return (
          <div className="modal-overlay z-999" onClick={() => setShowPriceListModal(false)}>
            <div className="modal-content-card max-w-5xl w-full border-indigo-500/20 bg-[var(--bg-secondary)] shadow-2xl p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
              <div className="flex justify-between items-center pb-4 mb-6 border-b border-[var(--border-color)]">
                <div>
                  <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400">توليد وتصدير قائمة الأسعار</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">اختر الأعمدة، ابحث عن الأدوية، وصدر القائمة فوراً بصيغة PDF أو Excel.</p>
                </div>
                <button 
                  onClick={() => setShowPriceListModal(false)}
                  className="p-2 hover:bg-[var(--border-color)]/30 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columns Selector Panel */}
                <div className="space-y-5 lg:border-l lg:border-[var(--border-color)] lg:pl-6">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">1. تخصيص أعمدة الجدول</h4>
                    <div className="space-y-2.5 bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
                      <label className="flex items-center gap-3 cursor-pointer opacity-75">
                        <input 
                          type="checkbox" 
                          checked={true} 
                          disabled={true}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" 
                        />
                        <span className="text-sm font-bold text-[var(--text-primary)]">اسم الدواء / المنتج (أساسي)</span>
                      </label>

                      {columnsOrder.map(colKey => {
                        const colLabelMap: Record<string, string> = {
                          scientificName: 'الاسم العلمي',
                          category: 'التصنيف',
                          batchNumber: 'رقم التشغيلة',
                          expiryDate: 'تاريخ الصلاحية',
                          qty: 'الكمية المتوفرة',
                          price: 'سعر البيع المقترح'
                        };
                        const labelText = colLabelMap[colKey];
                        const isSelected = selectedColumns.includes(colKey);
                        
                        return (
                          <div key={colKey} className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-[var(--border-color)]/20 transition-all border border-transparent">
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedColumns([...selectedColumns, colKey]);
                                  } else {
                                    setSelectedColumns(selectedColumns.filter(c => c !== colKey));
                                  }
                                }}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" 
                              />
                              <span className="text-sm font-semibold text-[var(--text-primary)]">{labelText}</span>
                            </label>
                            {isSelected && (
                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    moveColumn(colKey, 'up');
                                  }}
                                  title="تحريك لأعلى"
                                  className="w-6 h-6 flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    moveColumn(colKey, 'down');
                                  }}
                                  title="تحريك لأسفل"
                                  className="w-6 h-6 flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  ↓
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Instant Action buttons */}
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">2. تصدير وتحميل القائمة</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => exportPriceListPDF()}
                        className="py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-600/10"
                      >
                        <Printer className="w-4 h-4" />
                        <span>تصدير PDF</span>
                      </button>

                      <button
                        onClick={() => exportPriceListExcel()}
                        className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
                      >
                        <Download className="w-4 h-4" />
                        <span>تصدير Excel</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search & Live Preview Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                      <input 
                        type="text"
                        placeholder="ابحث باسم الدواء أو الاسم العلمي في المخزون..."
                        value={priceListSearch}
                        onChange={(e) => setPriceListSearch(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-sm outline-none text-[var(--text-primary)]"
                      />
                    </div>
                  </div>

                  <div className="border border-[var(--border-color)] rounded-2xl overflow-hidden bg-[var(--bg-primary)]">
                    <div className="p-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">معاينة حية لقائمة الأسعار المحددة</span>
                      <span className="text-xs font-bold text-indigo-500">{getPriceListRows().length} صنفاً نشطاً</span>
                    </div>

                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs border-b border-[var(--border-color)]">
                            <th className="p-3 text-center w-12">#</th>
                            <th className="p-3">اسم المنتج / الدواء</th>
                            {activeCols.map(col => {
                              if (col === 'name') return null;
                              return <th key={col} className="p-3 text-center">{columnLabels[col] || col}</th>;
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)] text-xs">
                          {getPriceListRows().length === 0 ? (
                            <tr>
                              <td colSpan={10} className="p-8 text-center text-[var(--text-secondary)]">لا توجد أدوية متوفرة تطابق خيارات البحث</td>
                            </tr>
                          ) : (
                            getPriceListRows().slice(0, 15).map((row: any, idx) => (
                              <tr key={row.id} className="hover:bg-[var(--border-color)]/20 text-[var(--text-primary)]">
                                <td className="p-3 text-center text-[var(--text-secondary)]">{idx + 1}</td>
                                <td className="p-3 font-semibold">{row.name}</td>
                                {activeCols.map(col => {
                                  if (col === 'name') return null;
                                  if (col === 'price') {
                                    return (
                                      <td key={col} className="p-3 text-center font-bold text-emerald-500">
                                        {row.price.toLocaleString('en-US')} {settings?.currency || 'SDG'}
                                      </td>
                                    );
                                  }
                                  if (col === 'qty') {
                                    return <td key={col} className="p-3 text-center">{row.qty} {row.unit}</td>;
                                  }
                                  if (col === 'expiryDate' || col === 'batchNumber') {
                                    return <td key={col} className="p-3 text-center font-mono">{row[col]}</td>;
                                  }
                                  return <td key={col} className="p-3 text-center">{row[col]}</td>;
                                })}
                              </tr>
                            ))
                          )}
                        </tbody>
                    </table>
                  </div>
                  {getPriceListRows().length > 15 && (
                    <div className="p-2 text-center text-[10px] text-[var(--text-secondary)] border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
                      يتم عرض أول 15 صنفاً فقط في المعاينة الحية. سيتم تصدير كافة الأصناف البالغ عددها ({getPriceListRows().length}) صنفاً في التقرير النهائي.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price List Export History Section */}
            <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
              <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>سجل قوائم الأسعار المصدرة سابقاً</span>
              </h4>

              {priceListHistory.length === 0 ? (
                <div className="p-5 text-center text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)]">
                  لا توجد تقارير مصدرة محفوظة حالياً. سيتم حفظ أي قائمة تقوم بتصديرها هنا تلقائياً لسهولة الرجوع إليها.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {priceListHistory.map((item) => (
                    <div 
                      key={item.id}
                      className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex justify-between items-start hover:border-indigo-500/20 transition-all group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-bold px-1.5 py-0.5 rounded">
                            {item.id}
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)]">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)]">{item.date}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] font-medium font-mono">
                          {item.filters} | الأعمدة: {item.columns.length}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (item.title.includes('PDF')) {
                              exportPriceListPDF(item.columns);
                            } else {
                              exportPriceListExcel(item.columns);
                            }
                          }}
                          title="إعادة تحميل وتصدير التقرير"
                          className="p-1.5 hover:bg-indigo-500/10 text-indigo-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          title="حذف من السجل"
                          className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}