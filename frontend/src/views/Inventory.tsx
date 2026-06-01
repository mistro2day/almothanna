import React, { useState } from 'react';
import { useInventoryStore, Product, Batch } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import { useActivityStore } from '../store/useActivityStore';
import { 
  Search, 
  Plus, 
  Layers, 
  Calendar, 
  DollarSign, 
  Tag,
  AlertCircle,
  RefreshCw,
  X
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
  const { products, batches, addProduct, addBatch, addBatchQty } = useInventoryStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  
  // Detail Modals State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [additionalQty, setAdditionalQty] = useState<number>(0);
  const [addingQtyLoading, setAddingQtyLoading] = useState(false);

  // Autocomplete UI States
  const [productSuggestions, setProductSuggestions] = useState<typeof COMMON_MEDICINES_DICTIONARY>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  const [scientificSuggestions, setScientificSuggestions] = useState<typeof COMMON_MEDICINES_DICTIONARY>([]);
  const [showScientificSuggestions, setShowScientificSuggestions] = useState(false);

  const [batchProductSearch, setBatchProductSearch] = useState('');
  const [showBatchProductDropdown, setShowBatchProductDropdown] = useState(false);

  // Modals visibility
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    scientificName: '',
    barcode: '',
    category: '',
    unit: 'Box'
  });

  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    productId: '',
    qty: 0,
    costPrice: 0,
    expiryDate: '',
    manufactureDate: ''
  });

  // Filtered products list
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.scientificName?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  // Filtered products list for Batch Selection autocomplete
  const filteredProductsForBatch = products.filter(p =>
    p.name.toLowerCase().includes(batchProductSearch.toLowerCase()) ||
    p.scientificName?.toLowerCase().includes(batchProductSearch.toLowerCase())
  );

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.unit) return;
    
    try {
      await addProduct(newProduct);
      useActivityStore.getState().logActivity(
        'إضافة منتج جديد',
        `تم إضافة المنتج الدوائي ${newProduct.name} (الاسم العلمي: ${newProduct.scientificName || '---'}) للفئة ${newProduct.category || 'عام'}`
      );
      setNewProduct({ name: '', scientificName: '', barcode: '', category: '', unit: 'Box' });
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

  return (
    <div className="space-y-6 pb-20 lg:pb-0" dir="rtl">
      <div className="space-y-6 animate-fade-in-slide">
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
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-teal-500/10 cursor-pointer touch-target w-full sm:w-auto"
          >
            <Layers className="w-4 h-4" />
            <span>إضافة تشغيلة (Batch)</span>
          </button>
          <button 
            onClick={() => setShowProductModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer touch-target w-full sm:w-auto"
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
        
        <div className="flex items-center gap-2 bg-[var(--border-color)]/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-[var(--glass-border)] text-xs text-[var(--text-secondary)] self-end md:self-auto shrink-0 relative z-10">
          <Calendar className="w-4 h-4 text-teal-500" />
          <span>تاريخ اليوم: <strong>{new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card flex items-center gap-3 px-4 py-3 rounded-2xl">
        <Search className="w-5 h-5 text-[var(--text-secondary)]" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم، الاسم العلمي، أو الباركود..."
          className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
        />
      </div>

      {/* Main Inventory Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">قائمة الأدوية والمستلزمات</h2>
          {filteredProducts.length === 0 ? (
            <div className="glass-card text-center py-12 rounded-2xl text-[var(--text-secondary)] text-sm">
              لم يتم العثور على أي منتجات مطابقة.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((p) => {
                const productBatches = batches.filter(b => b.productId === p.id);
                const totalQty = productBatches.reduce((sum, b) => sum + b.qty, 0);

                return (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedProduct(p)}
                    className="glass-card p-5 rounded-2xl space-y-4 border border-[var(--glass-border)] flex flex-col justify-between hover:border-teal-500/25 transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                          {p.category || 'عام'}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)] font-mono">{p.barcode}</span>
                      </div>
                      <h3 className="text-base font-bold text-[var(--text-primary)] mt-2">{p.name}</h3>
                      {p.scientificName && (
                        <p className="text-xs text-[var(--text-secondary)] italic mt-1">{p.scientificName}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-center text-xs">
                      <span className="text-[var(--text-secondary)]">الوحدة: <strong className="text-[var(--text-primary)]">{p.unit}</strong></span>
                      <span className={`font-semibold ${totalQty > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {totalQty > 0 ? `${totalQty} قطعة متوفرة` : 'نفذ من المخزن'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Batches Tracker (Right 1 Column) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">التشغيلات النشطة (Batches)</h2>
          {batches.length === 0 ? (
            <div className="glass-card text-center py-12 rounded-2xl text-[var(--text-secondary)] text-sm">
              لا توجد أي تشغيلات مدخلة حتى الآن.
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                // FEFO: Sort batches by expiryDate ascending
                const sortedBatches = [...batches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

                // Helper to check FEFO Priority for each product
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
                    return { label: 'منتهي الصلاحية ❌', colorClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse font-bold' };
                  }
                  if (isTopPriority) {
                    return { label: 'أولوية الصرف (FEFO) ⭐', colorClass: 'bg-amber-500/20 text-amber-500 border-amber-500/30 font-bold shadow-sm shadow-amber-500/10' };
                  }
                  if (isNearExpiry) {
                    return { label: 'قريب الانتهاء ⚠️', colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
                  }
                  return { label: 'صلاحية آمنة ✅', colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
                };

                return sortedBatches.map((b) => {
                  const prod = products.find(p => p.id === b.productId);
                  const status = getFefoStatus(b);
                  
                  const today = new Date(); today.setHours(0,0,0,0);
                  const expiry = new Date(b.expiryDate);
                  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
                  const isNearOrExpired = daysLeft <= 180;

                  return (
                    <div 
                      key={b.id} 
                      onClick={() => setSelectedBatch(b)}
                      className="glass-card p-4 rounded-xl space-y-2 border border-[var(--glass-border)] relative overflow-hidden hover:border-teal-500/25 transition-all cursor-pointer"
                    >
                      {isNearOrExpired && (
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${daysLeft <= 0 ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      )}
                      
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{prod?.name || 'منتج غير معروف'}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--border-color)] text-[var(--text-secondary)] shrink-0">
                          {b.batchNumber}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status.colorClass}`}>
                          {status.label}
                        </span>
                        {daysLeft > 0 ? (
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            متبقي: <strong className="text-[var(--text-primary)]">{daysLeft} يوم</strong>
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-bold">
                            تالف / منتهي
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-color)]">
                        <div>الكمية: <strong className="text-[var(--text-primary)]">{b.qty}</strong></div>
                        <div>سعر التكلفة: <strong className="text-[var(--text-primary)]">{b.costPrice} SDG</strong></div>
                        <div className="col-span-2 flex items-center gap-1 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-500" />
                          <span>الانتهاء: <strong>{new Date(b.expiryDate).toLocaleDateString('en-US')}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
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
                            barcode: newProduct.barcode
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

              <div className="flex justify-start gap-3 pt-3">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium cursor-pointer"
                >
                  حفظ المنتج
                </button>
                <button 
                  type="button"
                  onClick={() => setShowProductModal(false)}
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
    </div>
  );
}
