import React, { useState, useEffect } from 'react';
import { useInventoryStore, Product, Batch } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import { useActivityStore } from '../store/useActivityStore';
import { useSupplierStore } from '../store/useSupplierStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { 
  Search, 
  Plus, 
  Layers, 
  Calendar, 
  DollarSign, 
  Tag,
  AlertCircle,
  RefreshCw,
  X,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft
} from 'lucide-react';
import DatePicker from '../components/DatePicker';

const generateBatchNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BAT-${dateStr}-${rand}`;
};

const COMMON_MEDICINES_DICTIONARY = [
  { name: 'Panadol 500mg', scientificName: 'Paracetamol', category: 'Analgesic', unit: 'Box' },
  { name: 'Panadol Extra', scientificName: 'Paracetamol / Caffeine', category: 'Analgesic', unit: 'Box' },
  { name: 'Amoxil 500mg', scientificName: 'Amoxicillin Trihydrate', category: 'Antibiotic', unit: 'Box' },
  { name: 'Brufen 400mg', scientificName: 'Ibuprofen', category: 'Analgesic / NSAID', unit: 'Box' },
  { name: 'Voltaren 50mg', scientificName: 'Diclofenac Sodium', category: 'Analgesic / NSAID', unit: 'Box' },
  { name: 'Augmentin 1g', scientificName: 'Amoxicillin Clavulanate Potassium', category: 'Antibiotic', unit: 'Box' },
  { name: 'Zithromax 500mg', scientificName: 'Azithromycin Dihydrate', category: 'Antibiotic', unit: 'Box' },
  { name: 'Glucophage 850mg', scientificName: 'Metformin Hydrochloride', category: 'Antidiabetic', unit: 'Box' },
  { name: 'Glucophage 1000mg', scientificName: 'Metformin Hydrochloride', category: 'Antidiabetic', unit: 'Box' },
  { name: 'Losec 20mg', scientificName: 'Omeprazole', category: 'Antiulcer', unit: 'Box' },
  { name: 'Lipitor 20mg', scientificName: 'Atorvastatin Calcium', category: 'Lipid-lowering', unit: 'Box' },
  { name: 'Lipitor 10mg', scientificName: 'Atorvastatin Calcium', category: 'Lipid-lowering', unit: 'Box' },
  { name: 'Norvasc 5mg', scientificName: 'Amlodipine Besylate', category: 'Antihypertensive', unit: 'Box' },
  { name: 'Norvasc 10mg', scientificName: 'Amlodipine Besylate', category: 'Antihypertensive', unit: 'Box' },
  { name: 'Concor 5mg', scientificName: 'Bisoprolol Fumarate', category: 'Antihypertensive', unit: 'Box' },
  { name: 'Concor 2.5mg', scientificName: 'Bisoprolol Fumarate', category: 'Antihypertensive', unit: 'Box' },
  { name: 'Ventolin Inhaler 100mcg', scientificName: 'Salbutamol Sulfate', category: 'Bronchodilator', unit: 'Inhaler' },
  { name: 'Ciprobay 500mg', scientificName: 'Ciprofloxacin Hydrochloride', category: 'Antibiotic', unit: 'Box' },
  { name: 'Nexium 40mg', scientificName: 'Esomeprazole Magnesium', category: 'Antiulcer', unit: 'Box' },
  { name: 'Crestor 10mg', scientificName: 'Rosuvastatin Calcium', category: 'Lipid-lowering', unit: 'Box' },
  { name: 'Plavix 75mg', scientificName: 'Clopidogrel Bisulfate', category: 'Antiplatelet', unit: 'Box' },
  { name: 'Ventolin Syrup', scientificName: 'Salbutamol Sulfate', category: 'Bronchodilator', unit: 'Bottle' },
  { name: 'Zinnat 500mg', scientificName: 'Cefuroxime Axetil', category: 'Antibiotic', unit: 'Box' },
  { name: 'Klacid 500mg', scientificName: 'Clarithromycin', category: 'Antibiotic', unit: 'Box' },
  { name: 'Daflon 500mg', scientificName: 'Micronized Purified Flavonoid Fraction', category: 'Vasoprotective', unit: 'Box' },
  { name: 'Solpadeine Soluble', scientificName: 'Paracetamol / Caffeine / Codeine Phosphate', category: 'Analgesic', unit: 'Box' },
  { name: 'Duspatalin 135mg', scientificName: 'Mebeverine Hydrochloride', category: 'Antispasmodic', unit: 'Box' }
];

export default function Inventory() {
  const { products, batches, pendingPurchaseOrders, fetchPendingPurchaseOrders, receivePurchaseOrder, addProduct, addBatch, addBatchQty } = useInventoryStore();
  const { user } = useAuthStore();
  const { suppliers, fetchSuppliers } = useSupplierStore();
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    if (suppliers.length === 0) {
      fetchSuppliers();
    }
    fetchPendingPurchaseOrders();
    fetchSettings();
  }, [suppliers.length, fetchSuppliers, fetchPendingPurchaseOrders, fetchSettings]);
  
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'batches'>('products');
  
  // Pagination State
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Detail Modals State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [additionalQty, setAdditionalQty] = useState<number>(0);
  const [addingQtyLoading, setAddingQtyLoading] = useState(false);
  const [receiveLoading, setReceiveLoading] = useState(false);

  // Autocomplete UI States
  const [productSuggestions, setProductSuggestions] = useState<typeof COMMON_MEDICINES_DICTIONARY>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  const [scientificSuggestions, setScientificSuggestions] = useState<typeof COMMON_MEDICINES_DICTIONARY>([]);
  const [showScientificSuggestions, setShowScientificSuggestions] = useState(false);

  const [batchProductSearch, setBatchProductSearch] = useState('');
  const [showBatchProductDropdown, setShowBatchProductDropdown] = useState(false);

  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Modals visibility
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  
  // PO Receive State
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [receiveItemsForm, setReceiveItemsForm] = useState<any[]>([]);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    scientificName: '',
    barcode: '',
    category: '',
    unit: 'Box',
    supplierId: ''
  });

  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    productId: '',
    qty: 0,
    costPrice: 0,
    expiryDate: '',
    manufactureDate: ''
  });

  // Reset page when tab or itemsPerPage or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, itemsPerPage, search]);

  // Filtered products list
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.scientificName?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  // FEFO: Sort batches by expiryDate ascending
  const sortedBatches = [...batches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  // Filtered batches list
  const filteredBatches = sortedBatches.filter(b => {
    const prod = products.find(p => p.id === b.productId);
    const prodName = prod?.name || '';
    const sciName = prod?.scientificName || '';
    return (
      b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
      prodName.toLowerCase().includes(search.toLowerCase()) ||
      sciName.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Filtered products list for Batch Selection autocomplete
  const filteredProductsForBatch = products.filter(p =>
    p.name.toLowerCase().includes(batchProductSearch.toLowerCase()) ||
    p.scientificName?.toLowerCase().includes(batchProductSearch.toLowerCase())
  );

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.unit) return;
    
    try {
      await addProduct({
        ...newProduct,
        supplierId: newProduct.supplierId || undefined
      });
      useActivityStore.getState().logActivity(
        'إضافة منتج جديد',
        `تم إضافة المنتج الدوائي ${newProduct.name} (الاسم العلمي: ${newProduct.scientificName || '---'}) للفئة ${newProduct.category || 'عام'}`
      );
      setNewProduct({ name: '', scientificName: '', barcode: '', category: '', unit: 'Box', supplierId: '' });
      setSupplierSearch('');
      setShowSupplierDropdown(false);
      setShowProductModal(false);
    } catch (err) {
      console.error(err);
      alert('فشل في إضافة المنتج');
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.batchNumber || !newBatch.productId || newBatch.qty <= 0) return;

    try {
      await addBatch({
        batchNumber: newBatch.batchNumber,
        productId: newBatch.productId,
        qty: Number(newBatch.qty),
        costPrice: Number(newBatch.costPrice),
        expiryDate: newBatch.expiryDate,
        manufactureDate: newBatch.manufactureDate
      });
      const prodName = products.find(p => p.id === newBatch.productId)?.name || '';
      useActivityStore.getState().logActivity(
        'إضافة تشغيلة جديدة',
        `تم إضافة تشغيلة جديدة برقم ${newBatch.batchNumber} للمنتج ${prodName} بعدد ${newBatch.qty} قطعة بسعر تكلفة ${newBatch.costPrice} SDG`
      );
      setNewBatch({ batchNumber: '', productId: '', qty: 0, costPrice: 0, expiryDate: '', manufactureDate: '' });
      setShowBatchModal(false);
    } catch (err) {
      console.error(err);
      alert('فشل في إضافة التشغيلة');
    }
  };

  const handleAddQtySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || additionalQty <= 0) return;
    setAddingQtyLoading(true);
    try {
      await addBatchQty(selectedBatch.id, additionalQty);
      const prodName = products.find(p => p.id === selectedBatch.productId)?.name || '';
      useActivityStore.getState().logActivity(
        'توريد كميات إضافية',
        `تم توريد كمية إضافية قدرها ${additionalQty} قطعة للتشغيلة ${selectedBatch.batchNumber} الخاصة بمنتج ${prodName}`
      );
      alert('تم إضافة الكمية للتشغيلة بنجاح');
      setAdditionalQty(0);
      setSelectedBatch(null);
    } catch (err) {
      console.error(err);
      alert('فشل في إضافة الكمية للتشغيلة');
    } finally {
      setAddingQtyLoading(false);
    }
  };

  const handleReceivePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO || receiveLoading) return;
    setReceiveLoading(true);
    try {
      await receivePurchaseOrder(selectedPO.id, receiveItemsForm);
      useActivityStore.getState().logActivity(
        'استلام أمر شراء',
        `تم استلام طلبية من المورد ${selectedPO.supplier?.name} بناءً على أمر الشراء رقم ${selectedPO.orderNumber}`
      );
      setShowReceiveModal(false);
      setSelectedPO(null);
      alert('تم اعتماد الاستلام وإضافة المخزون بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل في استلام أمر الشراء');
    } finally {
      setReceiveLoading(false);
    }
  };

  // helper to check FEFO status helper
  const getFefoStatus = (batch: Batch) => {
    if (batch.qty <= 0) return { label: 'نفذت الكمية ⚪', colorClass: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
    
    const today = new Date(); today.setHours(0,0,0,0);
    const expiry = new Date(batch.expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

    const isExpired = daysLeft <= 0;
    const isNearExpiry = daysLeft > 0 && daysLeft <= 180;

    // Find active batches for this product
    const activeProductBatches = sortedBatches.filter(b => b.productId === batch.productId && b.qty > 0);
    const isTopPriority = activeProductBatches.length > 0 && activeProductBatches[0].id === batch.id;

    if (isExpired) {
      return { label: 'منتهي الصلاحية ❌', colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse font-bold' };
    }
    if (isTopPriority) {
      return { label: 'أولوية الصرف (FEFO) ⭐', colorClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold' };
    }
    if (isNearExpiry) {
      return { label: 'قريب الانتهاء ⚠️', colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
    return { label: 'صلاحية آمنة ✅', colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
  };

  // Excel Export with Styled Header (HTML Spreadsheet format which Excel opens perfectly)
  const exportToExcel = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let reportTitle = '';
    let filename = '';

    if (activeTab === 'products') {
      filename = 'قائمة_الأدوية_والمستلزمات.xls';
      reportTitle = 'تقرير قائمة الأدوية والمستلزمات الطبية المتوفرة';
      headers = ['الاسم التجاري', 'الاسم العلمي', 'الباركود', 'الفئة العلاجية', 'الوحدة', 'المورد', 'الكمية المتوفرة'];
      rows = filteredProducts.map(p => {
        const totalQty = batches.filter(b => b.productId === p.id).reduce((sum, b) => sum + b.qty, 0);
        return [
          p.name,
          p.scientificName || '---',
          p.barcode || '---',
          p.category || 'عام',
          p.unit,
          p.supplier?.name || '---',
          `${totalQty} قطعة`
        ];
      });
    } else {
      filename = 'التشغيلات_النشطة_Batches.xls';
      reportTitle = 'تقرير التشغيلات النشطة وتواريخ الصلاحية بنظام (FEFO)';
      headers = ['رقم التشغيلة', 'الدواء', 'الاسم العلمي', 'الكمية المتوفرة', 'سعر التكلفة (SDG)', 'تاريخ الإنتاج', 'تاريخ الانتهاء', 'أيام متبقية', 'الحالة'];
      rows = filteredBatches.map(b => {
        const prod = products.find(p => p.id === b.productId);
        const today = new Date(); today.setHours(0,0,0,0);
        const expiry = new Date(b.expiryDate);
        const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const status = getFefoStatus(b);
        return [
          b.batchNumber,
          prod?.name || '---',
          prod?.scientificName || '---',
          b.qty.toString(),
          `${b.costPrice} SDG`,
          b.manufactureDate,
          b.expiryDate,
          daysLeft > 0 ? `${daysLeft} يوم` : 'منتهي الصلاحية',
          status.label
        ];
      });
    }

    // Build stylized HTML content for MS Excel to parse beautifully
    const htmlTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>المخزون الدوائي</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                  <x:FitToPage/>
                  <x:Print>
                    <x:ValidPrinterInfo/>
                  </x:Print>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .company-name { font-size: 22px; font-weight: bold; color: #0d9488; text-align: right; }
          .company-details { font-size: 11px; color: #4b5563; text-align: right; }
          .report-title { font-size: 16px; font-weight: bold; color: #374151; text-align: center; background-color: #f3f4f6; padding: 12px; border: 1px solid #e5e7eb; }
          .meta-text { font-size: 11px; color: #6b7280; text-align: left; vertical-align: top; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .data-table th { background-color: #0d9488; color: #ffffff; font-weight: bold; border: 1px solid #0f766e; padding: 12px 10px; text-align: right; white-space: nowrap; }
          .data-table td { border: 1px solid #e5e7eb; padding: 10px 8px; text-align: right; white-space: nowrap; }
          .data-table tr:nth-child(even) { background-color: #f9fafb; }
          .badge-safety { color: #10b981; font-weight: bold; }
          .badge-priority { color: #f59e0b; font-weight: bold; }
          .badge-expired { color: #ef4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td class="company-name" colspan="3">${settings?.name || 'صيدلية المثنى الحديثة'}</td>
            <td class="meta-text" colspan="${headers.length - 3}" rowspan="3" style="text-align: left; vertical-align: top;">
              تاريخ التصدير: ${new Date().toLocaleString('ar-SA')}<br>
              المسؤول: ${user?.name || '---'}
            </td>
          </tr>
          <tr>
            <td class="company-details" colspan="3">
              🏢 العنوان: ${settings?.address || 'العنوان غير محدد'}<br>
              📞 الهاتف: ${settings?.phone || '---'} | 📧 البريد: ${settings?.email || '---'}
            </td>
          </tr>
          ${settings?.taxNumber ? `
          <tr>
            <td class="company-details" colspan="3">الرقم الضريبي: ${settings.taxNumber}</td>
          </tr>` : ''}
          <tr>
            <td colspan="${headers.length}">&nbsp;</td>
          </tr>
          <tr>
            <td class="report-title" colspan="${headers.length}">${reportTitle}</td>
          </tr>
          <tr>
            <td colspan="${headers.length}">&nbsp;</td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => {
                  let styleClass = '';
                  if (cell.includes('صلاحية آمنة')) styleClass = ' class="badge-safety"';
                  else if (cell.includes('FEFO') || cell.includes('قريب الانتهاء')) styleClass = ' class="badge-priority"';
                  else if (cell.includes('منتهي الصلاحية') || cell.includes('منتهي')) styleClass = ' class="badge-expired"';
                  
                  return `<td${styleClass}>${cell}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${settings?.invoiceFooter ? `
        <table style="width: 100%; margin-top: 30px;">
          <tr>
            <td colspan="${headers.length}" style="text-align: center; font-size: 11px; color: #9ca3af; font-style: italic; border-top: 1px dashed #d1d5db; padding-top: 15px;">
              ${settings.invoiceFooter}
            </td>
          </tr>
        </table>` : ''}
      </body>
      </html>
    `;

    const blob = new Blob([htmlTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0" dir="rtl">
      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 15mm;
          }
          body * {
            visibility: hidden;
            background-color: transparent !important;
            color: #000000 !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            direction: rtl;
            background-color: transparent !important;
          }
          #print-area table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          #print-area th {
            background-color: #0d9488 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-weight: bold;
            border: 1px solid #0f766e !important;
            padding: 10px;
          }
          #print-area td {
            border: 1px solid #e5e7eb !important;
            padding: 8px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #print-area tr:nth-child(even) {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="space-y-6 animate-fade-in-slide no-print">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">المخزون الدوائي</h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">تتبع وإدارة المنتجات والتشغيلات (Batches) بنظام FEFO</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={() => {
                setShowBatchModal(true);
                setBatchProductSearch('');
                setNewBatch(prev => ({ ...prev, productId: '', batchNumber: generateBatchNumber() }));
              }}
              disabled={products.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-teal-500/10 cursor-pointer touch-target w-full sm:w-auto font-bold"
            >
              <Layers className="w-4 h-4" />
              <span>إضافة تشغيلة (Batch)</span>
            </button>
            <button 
              onClick={() => {
                setShowProductModal(true);
                setSupplierSearch('');
                setShowSupplierDropdown(false);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer touch-target w-full sm:w-auto font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج جديد</span>
            </button>
          </div>
        </div>

        {/* FEFO Explanation Glassmorphic Banner */}
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-teal-500/20 bg-gradient-to-r from-teal-500/5 via-emerald-500/5 to-transparent relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" />
          <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-2xl shadow-lg shadow-teal-500/20">
              <Layers className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex flex-wrap items-center gap-2">
                <span>نظام إدارة المخزون الذكي (FEFO)</span>
                <span className="text-xs bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold px-2.5 py-0.5 rounded-full">
                  ما تنتهي صلاحيته أولاً، يُصرف أولاً
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                يقوم النظام تلقائياً بتحليل صلاحيات التشغيلات النشطة وترتيبها. يتم منح الأولوية القصوى للصرف للتشغيلات ذات الصلاحية الأقرب للانتهاء لتجنب تلف الأدوية، مع ترميز لوني ذكي لتنبيه الصيادلة ومسؤولي المستودع.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-[var(--border-color)]/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-[var(--glass-border)] text-xs text-[var(--text-secondary)] self-end md:self-auto shrink-0 relative z-10 font-bold">
            <Calendar className="w-4 h-4 text-teal-500" />
            <span>تاريخ اليوم: <strong>{new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
          </div>
        </div>

        {/* Pending Purchase Orders Section */}
        {pendingPurchaseOrders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-display text-amber-500 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>أوامر شراء قيد الاستلام ({pendingPurchaseOrders.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPurchaseOrders.map((po) => (
                <div 
                  key={po.id} 
                  onClick={() => {
                    setSelectedPO(po);
                    setReceiveItemsForm(po.items.map(item => ({
                      purchaseItemId: item.id,
                      productId: item.productId,
                      productName: item.product?.name,
                      qty: item.qty, // default to requested qty
                      unitCost: item.unitCost,
                      batchNumber: generateBatchNumber(), // auto-generate a suggestion
                      expiryDate: '',
                      manufactureDate: ''
                    })));
                    setShowReceiveModal(true);
                  }}
                  className="glass-card p-4 rounded-2xl space-y-3 border border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer bg-gradient-to-br from-amber-500/5 to-transparent relative overflow-hidden animate-pulse"
                >
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500" />
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-[var(--text-primary)]">{po.supplier?.name}</span>
                    <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full font-mono">{po.orderNumber}</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    يحتوي على {po.items.length} أصناف جاهزة للاستلام والإضافة للمخزون.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs, Search & Action Bar */}
        <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Custom Switcher Tabs */}
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] w-full md:w-auto">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>الأدوية والمستلزمات</span>
            </button>
            <button
              onClick={() => setActiveTab('batches')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'batches'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>التشغيلات النشطة (Batches)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] w-full md:flex-1 md:max-w-md">
            <Search className="w-4 h-4 text-[var(--text-secondary)]" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'products' ? "ابحث عن دواء بالاسم، الاسم العلمي، الباركود..." : "ابحث برقم التشغيلة، الدواء..."}
              className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            />
          </div>

          {/* Export Actions & Items Count */}
          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>عرض:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1 outline-none text-[var(--text-primary)] font-bold cursor-pointer"
              >
                <option value={10}>10 نتائج</option>
                <option value={25}>25 نتيجة</option>
                <option value={50}>50 نتيجة</option>
                <option value={100}>100 نتيجة</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="تصدير لملف Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">اكسل</span>
              </button>

              <button
                onClick={exportToPDF}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="تصدير لملف PDF"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">بي دي اف</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Print and Layout Content */}
      <div id="print-area">
        {/* Printable Header - Matching Invoices Template */}
        <div className="hidden print:block mb-8 border-b pb-6">
          <div className="flex justify-between items-start gap-4">
            <div className="text-right space-y-1">
              <h1 className="text-2xl font-bold text-teal-600 dark:text-teal-400">{settings?.name || 'صيدلية المثنى الحديثة'}</h1>
              <p className="text-xs text-gray-500">{settings?.address || 'العنوان غير محدد'}</p>
              <p className="text-xs text-gray-500">هاتف: {settings?.phone || '---'} {settings?.email ? `| بريد: ${settings.email}` : ''}</p>
              {settings?.taxNumber && <p className="text-xs text-gray-500">الرقم الضريبي: {settings.taxNumber}</p>}
            </div>
            
            {settings?.logo ? (
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 p-1 bg-white">
                <img src={settings.logo} alt="Company Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 font-bold text-xl">
                POS
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-dashed border-gray-200 text-center">
            <h2 className="text-lg font-bold text-gray-800">
              {activeTab === 'products' ? 'تقرير الأدوية والمستلزمات الطبية المتوفرة' : 'تقرير تفاصيل التشغيلات النشطة وصلاحيات الأدوية'}
            </h2>
            <p className="text-[11px] text-gray-500 mt-1">تاريخ ووقت طباعة التقرير: {new Date().toLocaleString('ar-SA')}</p>
          </div>
        </div>

        {/* Tab Content 1: Products Table */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="glass-card overflow-hidden border border-[var(--glass-border)] rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-emerald-700 text-white dark:bg-emerald-950/70 dark:text-emerald-200 font-bold border-b border-emerald-600/20">
                      <th className="py-4 px-4 pr-6 text-right rounded-tr-2xl">المنتج (الاسم التجاري)</th>
                      <th className="py-4 px-4 text-right">الاسم العلمي</th>
                      <th className="py-4 px-4 text-right">الفئة</th>
                      <th className="py-4 px-4 text-right">الباركود</th>
                      <th className="py-4 px-4 text-center">الوحدة</th>
                      <th className="py-4 px-4 text-center">الكمية المتوفرة</th>
                      <th className="py-4 px-4 pl-6 text-left rounded-tl-2xl no-print">المورد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-[var(--text-secondary)]">
                          لم يتم العثور على أي منتجات مطابقة.
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

                        return paginatedProducts.map((p) => {
                          const totalQty = batches.filter(b => b.productId === p.id).reduce((sum, b) => sum + b.qty, 0);
                          return (
                            <tr 
                              key={p.id} 
                              onClick={() => setSelectedProduct(p)}
                              className="hover:bg-[var(--border-color)]/30 transition-colors cursor-pointer"
                            >
                              <td className="py-4 px-4 pr-6 text-right font-bold text-[var(--text-primary)]">{p.name}</td>
                              <td className="py-4 px-4 text-right text-[var(--text-secondary)] font-medium italic">{p.scientificName || '---'}</td>
                              <td className="py-4 px-4 text-right">
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                                  {p.category || 'عام'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right font-mono text-[var(--text-secondary)]">{p.barcode || '---'}</td>
                              <td className="py-4 px-4 text-center text-[var(--text-primary)]">{p.unit}</td>
                              <td className="py-4 px-4 text-center">
                                <span className={`font-bold font-mono px-3 py-1 rounded-full text-xs ${totalQty > 0 ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'}`}>
                                  {totalQty} قطعة
                                </span>
                              </td>
                              <td className="py-4 px-4 pl-6 text-left text-xs font-semibold text-[var(--text-secondary)] no-print">
                                {p.supplier?.name ? `🏢 ${p.supplier.name}` : '---'}
                              </td>
                            </tr>
                          );
                        });
                      })()
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {filteredProducts.length > itemsPerPage && (
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--border-color)]/20 border border-[var(--border-color)] rounded-xl no-print">
                <span className="text-xs text-[var(--text-secondary)]">
                  إظهار <strong>{Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)}</strong> إلى <strong>{Math.min(filteredProducts.length, currentPage * itemsPerPage)}</strong> من أصل <strong>{filteredProducts.length}</strong> دواء ومستلزم
                </span>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] disabled:opacity-40 text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] disabled:opacity-40 text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  <span className="flex items-center justify-center px-4 py-1 text-sm font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 rounded-lg">
                    {currentPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)}
                    className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] disabled:opacity-40 text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.ceil(filteredProducts.length / itemsPerPage))}
                    disabled={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)}
                    className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] disabled:opacity-40 text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Batches Table */}
        {activeTab === 'batches' && (
          <div className="space-y-4">
            <div className="glass-card overflow-hidden border border-[var(--glass-border)] rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-emerald-700 text-white dark:bg-emerald-950/70 dark:text-emerald-200 font-bold border-b border-emerald-600/20">
                      <th className="py-4 px-4 pr-6 text-right rounded-tr-2xl">رقم التشغيلة</th>
                      <th className="py-4 px-4 text-right">الدواء (الاسم التجاري)</th>
                      <th className="py-4 px-4 text-center">الكمية</th>
                      <th className="py-4 px-4 text-center">سعر التكلفة</th>
                      <th className="py-4 px-4 text-center">حالة الصلاحية</th>
                      <th className="py-4 px-4 text-center">أيام متبقية</th>
                      <th className="py-4 px-4 pl-6 text-left rounded-tl-2xl">تاريخ الانتهاء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {filteredBatches.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-[var(--text-secondary)]">
                          لم يتم العثور على أي تشغيلات نشطة مطابقة.
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const paginatedBatches = filteredBatches.slice(startIndex, startIndex + itemsPerPage);

                        return paginatedBatches.map((b) => {
                          const prod = products.find(p => p.id === b.productId);
                          const status = getFefoStatus(b);
                          
                          const today = new Date(); today.setHours(0,0,0,0);
                          const expiry = new Date(b.expiryDate);
                          const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

                          return (
                            <tr 
                              key={b.id} 
                              onClick={() => setSelectedBatch(b)}
                              className="hover:bg-[var(--border-color)]/30 transition-colors cursor-pointer"
                            >
                              <td className="py-4 px-4 pr-6 text-right font-mono font-bold text-[var(--text-primary)]">{b.batchNumber}</td>
                              <td className="py-4 px-4 text-right">
                                <div className="font-bold text-[var(--text-primary)]">{prod?.name || 'منتج غير معروف'}</div>
                                {prod?.scientificName && <div className="text-xs text-[var(--text-secondary)] font-medium italic mt-0.5">{prod.scientificName}</div>}
                              </td>
                              <td className="py-4 px-4 text-center font-bold font-mono text-[var(--text-primary)]">{b.qty}</td>
                              <td className="py-4 px-4 text-center font-mono text-[var(--text-secondary)]">{b.costPrice} SDG</td>
                              <td className="py-4 px-4 text-center">
                                <span className={`text-xs px-2.5 py-1 rounded-full border ${status.colorClass}`}>
                                  {status.label}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center font-bold font-mono">
                                {daysLeft > 0 ? (
                                  <span className={daysLeft <= 180 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{daysLeft} يوم</span>
                                ) : (
                                  <span className="text-rose-600 dark:text-rose-400">منتهي</span>
                                )}
                              </td>
                              <td className="py-4 px-4 pl-6 text-left font-mono text-[var(--text-secondary)]">
                                {new Date(b.expiryDate).toLocaleDateString('en-US')}
                              </td>
                            </tr>
                          );
                        });
                      })()
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {filteredBatches.length > itemsPerPage && (
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--border-color)]/20 border border-[var(--border-color)] rounded-xl no-print">
                <span className="text-xs text-[var(--text-secondary)]">
                  إظهار <strong>{Math.min(filteredBatches.length, (currentPage - 1) * itemsPerPage + 1)}</strong> إلى <strong>{Math.min(filteredBatches.length, currentPage * itemsPerPage)}</strong> من أصل <strong>{filteredBatches.length}</strong> تشغيلة
                </span>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] disabled:opacity-40 text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] disabled:opacity-40 text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  <span className="flex items-center justify-center px-4 py-1 text-sm font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 rounded-lg">
                    {currentPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredBatches.length / itemsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(filteredBatches.length / itemsPerPage)}
                    className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] disabled:opacity-40 text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.ceil(filteredBatches.length / itemsPerPage))}
                    disabled={currentPage >= Math.ceil(filteredBatches.length / itemsPerPage)}
                    className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] disabled:opacity-40 text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal 1: Add Product */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-product max-w-md" dir="rtl">
            <div className="modal-glow-back" />
            <h3 className="text-xl font-bold text-[var(--text-primary)]">إضافة منتج دوائي جديد</h3>
            
            <form onSubmit={handleAddProduct} className="space-y-3 text-sm">
              <div className="space-y-1 relative">
                <label className="block text-[var(--text-secondary)] font-medium">اسم المنتج (التجاري)</label>
                <input 
                  type="text" 
                  required
                  value={newProduct.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewProduct({ ...newProduct, name: val });
                    if (val.trim().length > 1) {
                      const filtered = COMMON_MEDICINES_DICTIONARY.filter(med => 
                        med.name.toLowerCase().includes(val.toLowerCase()) ||
                        med.scientificName.toLowerCase().includes(val.toLowerCase())
                      );
                      setProductSuggestions(filtered);
                      setShowProductSuggestions(true);
                    } else {
                      setProductSuggestions([]);
                      setShowProductSuggestions(false);
                    }
                  }}
                  onBlur={() => {
                    // Slight delay to allow clicking suggestions before hiding
                    setTimeout(() => setShowProductSuggestions(false), 200);
                  }}
                  placeholder="مثال: Paracetamol 500mg"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-emerald-500"
                />

                {showProductSuggestions && productSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-[var(--border-color)]">
                    {productSuggestions.map((med, index) => (
                      <div
                        key={index}
                        onMouseDown={() => {
                          setNewProduct({
                            name: med.name,
                            scientificName: med.scientificName,
                            category: med.category,
                            unit: med.unit,
                            barcode: newProduct.barcode,
                            supplierId: newProduct.supplierId
                          });
                          setShowProductSuggestions(false);
                        }}
                        className="p-3 hover:bg-[var(--border-color)]/30 cursor-pointer transition-all flex flex-col justify-start text-right"
                      >
                        <span className="font-bold text-sm text-[var(--text-primary)]">{med.name}</span>
                        <span className="text-xs text-[var(--text-secondary)] italic mt-0.5">{med.scientificName} ({med.category})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1 relative">
                <label className="block text-[var(--text-secondary)] font-medium">الاسم العلمي</label>
                <input 
                  type="text" 
                  value={newProduct.scientificName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewProduct({ ...newProduct, scientificName: val });
                    if (val.trim().length > 1) {
                      const filtered = COMMON_MEDICINES_DICTIONARY.filter(med => 
                        med.scientificName.toLowerCase().includes(val.toLowerCase())
                      );
                      // Keep only unique scientific names to avoid duplicates in suggestions
                      const uniqueFiltered: typeof COMMON_MEDICINES_DICTIONARY = [];
                      const seen = new Set();
                      for (const item of filtered) {
                        if (!seen.has(item.scientificName.toLowerCase())) {
                          seen.add(item.scientificName.toLowerCase());
                          uniqueFiltered.push(item);
                        }
                      }
                      setScientificSuggestions(uniqueFiltered);
                      setShowScientificSuggestions(true);
                    } else {
                      setScientificSuggestions([]);
                      setShowScientificSuggestions(false);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowScientificSuggestions(false), 200);
                  }}
                  placeholder="مثال: Paracetamol"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-emerald-500"
                />

                {showScientificSuggestions && scientificSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-[var(--border-color)]">
                    {scientificSuggestions.map((med, index) => (
                      <div
                        key={index}
                        onMouseDown={() => {
                          setNewProduct({
                            ...newProduct,
                            scientificName: med.scientificName,
                            category: med.category || newProduct.category,
                            unit: med.unit || newProduct.unit
                          });
                          setShowScientificSuggestions(false);
                        }}
                        className="p-3 hover:bg-[var(--border-color)]/30 cursor-pointer transition-all flex flex-col justify-start text-right"
                      >
                        <span className="font-bold text-sm text-[var(--text-primary)]">{med.scientificName}</span>
                        <span className="text-xs text-[var(--text-secondary)] mt-0.5">مثال: {med.name} ({med.category})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">الباركود</label>
                  <input 
                    type="text" 
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    placeholder="رقم الباركود"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">الوحدة</label>
                  <select 
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-emerald-500"
                  >
                    <option value="Box">علبة (Box)</option>
                    <option value="Strip">شريط (Strip)</option>
                    <option value="Vial">فيال/حقنة (Vial)</option>
                    <option value="Bottle">زجاجة (Bottle)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">الفئة العلاجية</label>
                <input 
                  type="text" 
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="مثال: Antibiotic, Analgesic"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 relative">
                <label className="block text-[var(--text-secondary)] font-medium">الشركة المصنعة / المورد</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={supplierSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSupplierSearch(val);
                      setShowSupplierDropdown(true);
                      if (!val.trim()) {
                        setNewProduct(prev => ({ ...prev, supplierId: '' }));
                      }
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setShowSupplierDropdown(false), 200);
                    }}
                    placeholder="ابحث عن المورد أو الشركة المصنعة..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-emerald-500"
                  />
                  {newProduct.supplierId && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewProduct(prev => ({ ...prev, supplierId: '' }));
                        setSupplierSearch('');
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-rose-500 hover:text-rose-700 font-bold"
                    >
                      حذف الاختيار ×
                    </button>
                  )}
                </div>

                {showSupplierDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-[var(--border-color)]">
                    {suppliers.filter(s => 
                      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                      (s.companyName && s.companyName.toLowerCase().includes(supplierSearch.toLowerCase()))
                    ).length === 0 ? (
                      <div className="p-3 text-center text-xs text-[var(--text-secondary)]">لا توجد شركات/موردين مطابقين</div>
                    ) : (
                      suppliers.filter(s => 
                        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                        (s.companyName && s.companyName.toLowerCase().includes(supplierSearch.toLowerCase()))
                      ).map((s) => (
                        <div
                          key={s.id}
                          onMouseDown={() => {
                            setNewProduct(prev => ({ ...prev, supplierId: s.id }));
                            setSupplierSearch(`${s.name}${s.companyName ? ` (${s.companyName})` : ''}`);
                            setShowSupplierDropdown(false);
                          }}
                          className={`p-3 hover:bg-[var(--border-color)]/30 cursor-pointer transition-all flex flex-col justify-start text-right ${newProduct.supplierId === s.id ? 'bg-emerald-500/5' : ''}`}
                        >
                          <span className="font-bold text-sm text-[var(--text-primary)]">{s.name}</span>
                          {s.companyName && (
                            <span className="text-xs text-[var(--text-secondary)] mt-0.5">{s.companyName}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-start gap-3 pt-3">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium cursor-pointer"
                >
                  حفظ المنتج
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setSupplierSearch('');
                    setShowSupplierDropdown(false);
                  }}
                  className="px-4 py-2 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Batch */}
      {showBatchModal && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-batch max-w-md" dir="rtl">
            <div className="modal-glow-back" />
            <h3 className="text-xl font-bold text-[var(--text-primary)]">إضافة تشغيلة دواء (Batch Entry)</h3>
            
            <form onSubmit={handleAddBatch} className="space-y-3 text-sm">
              <div className="space-y-1 relative">
                <label className="block text-[var(--text-secondary)] font-medium">اختر المنتج الدوائي</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="ابحث بالاسم التجاري أو العلمي..."
                    value={batchProductSearch}
                    onChange={(e) => {
                      setBatchProductSearch(e.target.value);
                      setShowBatchProductDropdown(true);
                    }}
                    onFocus={() => setShowBatchProductDropdown(true)}
                    onBlur={() => {
                      // Slight delay to allow clicking suggestions before hiding
                      setTimeout(() => setShowBatchProductDropdown(false), 200);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-teal-500"
                  />
                  {newBatch.productId && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600">
                      ✓ تم الاختيار
                    </span>
                  )}
                </div>

                {showBatchProductDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-[var(--border-color)]">
                    {filteredProductsForBatch.length === 0 ? (
                      <div className="p-3 text-center text-xs text-[var(--text-secondary)]">لا توجد أدوية مطابقة</div>
                    ) : (
                      filteredProductsForBatch.map((p) => (
                        <div
                          key={p.id}
                          onMouseDown={() => {
                            setNewBatch({ ...newBatch, productId: p.id });
                            setBatchProductSearch(p.name);
                            setShowBatchProductDropdown(false);
                          }}
                          className={`p-3 hover:bg-[var(--border-color)]/30 cursor-pointer transition-all flex flex-col justify-start text-right ${newBatch.productId === p.id ? 'bg-teal-500/5' : ''}`}
                        >
                          <span className="font-bold text-sm text-[var(--text-primary)]">{p.name}</span>
                          {p.scientificName && (
                            <span className="text-xs text-[var(--text-secondary)] italic mt-0.5">{p.scientificName}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">رقم التشغيلة (Batch Number)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    value={newBatch.batchNumber}
                    onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                    placeholder="مثال: B2026-X12"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setNewBatch(prev => ({ ...prev, batchNumber: generateBatchNumber() }))}
                    className="px-3 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                    title="توليد تلقائي"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">الكمية المستلمة</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={newBatch.qty}
                    onChange={(e) => setNewBatch({ ...newBatch, qty: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">سعر التكلفة (SDG)</label>
                  <input 
                    type="number" 
                    required
                    min={0.1}
                    step="0.01"
                    value={newBatch.costPrice}
                    onChange={(e) => setNewBatch({ ...newBatch, costPrice: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">تاريخ الإنتاج</label>
                  <DatePicker
                    value={newBatch.manufactureDate}
                    onChange={(val) => setNewBatch({ ...newBatch, manufactureDate: val })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">تاريخ الانتهاء (Expiry)</label>
                  <DatePicker
                    value={newBatch.expiryDate}
                    onChange={(val) => setNewBatch({ ...newBatch, expiryDate: val })}
                  />
                </div>
              </div>

              <div className="flex justify-start gap-3 pt-3">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium cursor-pointer"
                >
                  إضافة التشغيلة
                </button>
                <button 
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Selected Product Details */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content-card max-w-2xl text-right animate-fade-in" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{selectedProduct.name}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 mt-1 inline-block">
                  {selectedProduct.category || 'عام'}
                </span>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-2 rounded-xl bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-[var(--text-secondary)]">
              <div>الاسم العلمي: <strong className="text-[var(--text-primary)]">{selectedProduct.scientificName || '---'}</strong></div>
              <div>الباركود: <strong className="text-[var(--text-primary)] font-mono">{selectedProduct.barcode || '---'}</strong></div>
              <div>الوحدة: <strong className="text-[var(--text-primary)]">{selectedProduct.unit}</strong></div>
              <div>الشركة / المورد: <strong className="text-teal-600 dark:text-teal-400 font-bold">🏢 {selectedProduct.supplier?.name || '---'}</strong></div>
              <div>إجمالي الكمية المتوفرة: <strong className="text-emerald-500 font-bold">{batches.filter(b => b.productId === selectedProduct.id).reduce((sum, b) => sum + b.qty, 0)} قطعة</strong></div>
            </div>

            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">التشغيلات المتاحة لهذا الدواء (مرتبة بنظام FEFO):</h4>
            {batches.filter(b => b.productId === selectedProduct.id).length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[var(--border-color)] rounded-2xl text-[var(--text-secondary)] text-xs">لا توجد تشغيلات مسجلة لهذا المنتج بعد.</div>
            ) : (
              <div className="border border-[var(--border-color)] rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                      <th className="p-3">رقم التشغيلة</th>
                      <th className="p-3 text-center">الكمية</th>
                      <th className="p-3 text-center">سعر التكلفة</th>
                      <th className="p-3 text-center">تاريخ الإنتاج</th>
                      <th className="p-3 text-left">تاريخ الانتهاء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {[...batches]
                      .filter(b => b.productId === selectedProduct.id)
                      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
                      .map((b) => (
                        <tr key={b.id} className="text-[var(--text-primary)]">
                          <td className="p-3 font-mono font-bold">{b.batchNumber}</td>
                          <td className="p-3 text-center font-bold font-mono">{b.qty}</td>
                          <td className="p-3 text-center font-mono">{b.costPrice} SDG</td>
                          <td className="p-3 text-center font-mono text-[var(--text-secondary)]">{new Date(b.manufactureDate).toLocaleDateString('en-US')}</td>
                          <td className="p-3 text-left font-mono text-[var(--text-secondary)]">{new Date(b.expiryDate).toLocaleDateString('en-US')}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 4: Selected Batch Details & Add Qty */}
      {selectedBatch && (
        <div className="modal-overlay" onClick={() => { setSelectedBatch(null); setAdditionalQty(0); }}>
          <div className="modal-content-card max-w-md text-right animate-fade-in" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">تشغيلة: {selectedBatch.batchNumber}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">المنتج: <strong className="text-[var(--text-primary)]">{products.find(p => p.id === selectedBatch.productId)?.name || 'غير معروف'}</strong></p>
              </div>
              <button onClick={() => { setSelectedBatch(null); setAdditionalQty(0); }} className="p-2 rounded-xl bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-[var(--text-secondary)] mb-6">
              <div className="flex justify-between"><span>الكمية المتوفرة حالياً:</span><strong className="text-[var(--text-primary)] font-bold font-mono text-base">{selectedBatch.qty} قطعة</strong></div>
              <div className="flex justify-between"><span>سعر التكلفة:</span><strong className="text-[var(--text-primary)] font-mono">{selectedBatch.costPrice} SDG</strong></div>
              <div className="flex justify-between"><span>تاريخ الإنتاج:</span><strong className="text-[var(--text-primary)] font-mono">{new Date(selectedBatch.manufactureDate).toLocaleDateString('ar-SA')}</strong></div>
              <div className="flex justify-between"><span>تاريخ الانتهاء:</span><strong className="text-[var(--text-primary)] font-mono">{new Date(selectedBatch.expiryDate).toLocaleDateString('ar-SA')}</strong></div>
              {(() => {
                const today = new Date(); today.setHours(0,0,0,0);
                const expiry = new Date(selectedBatch.expiryDate);
                const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
                return (
                  <div className="flex justify-between border-t border-[var(--border-color)] pt-2.5">
                    <span>حالة الصلاحية:</span>
                    <strong className={daysLeft <= 0 ? 'text-rose-500 font-bold' : daysLeft <= 180 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                      {daysLeft <= 0 ? 'منتهي الصلاحية ❌' : `متبقي ${daysLeft} يوم`}
                    </strong>
                  </div>
                );
              })()}
            </div>

            {/* Add Qty Form (Only visible to ADMIN & WAREHOUSE roles) */}
            {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') ? (
              <div className="border-t border-[var(--border-color)] pt-5 space-y-3">
                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-teal-500" />
                  <span>توريد كميات إضافية لنفس التشغيلة</span>
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)]">بصفتك مشرف مخزون أو مدير نظام، يمكنك تسجيل استلام كمية إضافية لهذا الـ Batch مباشرة، وسيقوم النظام تلقائياً بتوليد حركة مخزنية "داخل" (Stock Movement IN).</p>
                <form onSubmit={handleAddQtySubmit} className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    required
                    value={additionalQty || ''}
                    onChange={(e) => setAdditionalQty(Number(e.target.value))}
                    placeholder="الكمية الإضافية"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none"
                  />
                  <button
                    type="submit"
                    disabled={additionalQty <= 0 || addingQtyLoading}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    {addingQtyLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>تأكيد الإضافة</span>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="border-t border-[var(--border-color)] pt-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[11px] text-amber-600 text-center">
                إضافة كمية لهذه التشغيلة يتطلب صلاحية مشرف المخزون أو مدير النظام.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 5: Receive PO */}
      {showReceiveModal && selectedPO && (
        <div className="modal-overlay">
          <div className="modal-content-card max-w-3xl" dir="rtl">
            <div className="modal-glow-back" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-500" />
                <span>استلام مخزون - أمر الشراء {selectedPO.orderNumber}</span>
              </h3>
              <button onClick={() => setShowReceiveModal(false)} className="text-[var(--text-secondary)] hover:text-rose-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleReceivePO} className="space-y-4">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 max-h-[60vh] overflow-y-auto space-y-6">
                {receiveItemsForm.map((item, index) => (
                  <div key={item.purchaseItemId} className="p-4 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg space-y-3 shadow-sm">
                    <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-2">
                      <span className="font-bold text-teal-600 dark:text-teal-400">{item.productName}</span>
                      <span className="text-xs text-[var(--text-secondary)]">الكمية المطلوبة: {selectedPO.items.find((i: any) => i.id === item.purchaseItemId)?.qty}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs text-[var(--text-secondary)]">الكمية المستلمة الفعليا (Qty)</label>
                        <input 
                          type="number" required min="1"
                          value={item.qty}
                          onChange={(e) => {
                            const newForm = [...receiveItemsForm];
                            newForm[index].qty = Number(e.target.value);
                            setReceiveItemsForm(newForm);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs text-[var(--text-secondary)]">رقم التشغيلة (Batch No)</label>
                        <input 
                          type="text" required
                          value={item.batchNumber}
                          onChange={(e) => {
                            const newForm = [...receiveItemsForm];
                            newForm[index].batchNumber = e.target.value;
                            setReceiveItemsForm(newForm);
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs text-[var(--text-secondary)]">تاريخ الإنتاج (اختياري)</label>
                        <DatePicker 
                          value={item.manufactureDate}
                          onChange={(val) => {
                            const newForm = [...receiveItemsForm];
                            newForm[index].manufactureDate = val;
                            setReceiveItemsForm(newForm);
                          }}
                          placeholder="اختر تاريخ الإنتاج"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs text-[var(--text-secondary)]">تاريخ الانتهاء (إلزامي)</label>
                        <DatePicker 
                          value={item.expiryDate}
                          onChange={(val) => {
                            const newForm = [...receiveItemsForm];
                            newForm[index].expiryDate = val;
                            setReceiveItemsForm(newForm);
                          }}
                          placeholder="اختر تاريخ الانتهاء"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="submit"
                  disabled={receiveLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-medium cursor-pointer font-bold flex items-center justify-center gap-2"
                >
                  {receiveLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري الاعتماد...</span>
                    </>
                  ) : (
                    <span>تأكيد واعتماد دخول المخزون</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Printable Footer - Matching Invoices Template */}
      {settings?.invoiceFooter && (
        <div className="hidden print:block mt-12 pt-4 border-t border-dashed border-gray-200 text-center text-xs text-gray-500">
          {settings.invoiceFooter}
        </div>
      )}
    </div>

  );
}
