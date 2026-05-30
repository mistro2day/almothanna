import React, { useState } from 'react';
import { useInventoryStore, Product, Batch } from '../store/useInventoryStore';
import { 
  Search, 
  Plus, 
  Layers, 
  Calendar, 
  DollarSign, 
  Tag,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import DatePicker from '../components/DatePicker';

const generateBatchNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BAT-${dateStr}-${rand}`;
};

export default function Inventory() {
  const { products, batches, addOfflineProduct, addOfflineBatch } = useInventoryStore();
  const [search, setSearch] = useState('');
  
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

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.unit) return;
    
    const prod: Product = {
      id: crypto.randomUUID(),
      ...newProduct
    };

    addOfflineProduct(prod);
    setNewProduct({ name: '', scientificName: '', barcode: '', category: '', unit: 'Box' });
    setShowProductModal(false);
  };

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.batchNumber || !newBatch.productId || newBatch.qty <= 0) return;

    const batch: Batch = {
      id: crypto.randomUUID(),
      batchNumber: newBatch.batchNumber,
      productId: newBatch.productId,
      qty: Number(newBatch.qty),
      costPrice: Number(newBatch.costPrice),
      expiryDate: newBatch.expiryDate,
      manufactureDate: newBatch.manufactureDate
    };

    addOfflineBatch(batch);
    setNewBatch({ batchNumber: '', productId: '', qty: 0, costPrice: 0, expiryDate: '', manufactureDate: '' });
    setShowBatchModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-slide pb-20 lg:pb-0" dir="rtl">
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
              setNewBatch(prev => ({ ...prev, batchNumber: generateBatchNumber() }));
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
                  <div key={p.id} className="glass-card p-5 rounded-2xl space-y-4 border border-[var(--glass-border)] flex flex-col justify-between">
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
              {batches.map((b) => {
                const prod = products.find(p => p.id === b.productId);
                const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                const isNearExpiry = daysLeft <= 180;

                return (
                  <div key={b.id} className="glass-card p-4 rounded-xl space-y-2 border border-[var(--glass-border)] relative overflow-hidden">
                    {isNearExpiry && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
                    )}
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{prod?.name || 'منتج غير معروف'}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--border-color)] text-[var(--text-secondary)]">
                        {b.batchNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] pt-1">
                      <div>الكمية: <strong className="text-[var(--text-primary)]">{b.qty}</strong></div>
                      <div>سعر التكلفة: <strong className="text-[var(--text-primary)]">{b.costPrice} SDG</strong></div>
                      <div className="col-span-2 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-500" />
                        <span>الانتهاء: <strong>{new Date(b.expiryDate).toLocaleDateString('en-US')}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Add Product */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl space-y-4 border border-[var(--glass-border)] animate-fade-in-slide text-right" dir="rtl">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">إضافة منتج دوائي جديد</h3>
            
            <form onSubmit={handleAddProduct} className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">اسم المنتج (التجاري)</label>
                <input 
                  type="text" 
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="مثال: Paracetamol 500mg"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">الاسم العلمي</label>
                <input 
                  type="text" 
                  value={newProduct.scientificName}
                  onChange={(e) => setNewProduct({ ...newProduct, scientificName: e.target.value })}
                  placeholder="مثال: Paracetamol"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-emerald-500"
                />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl space-y-4 border border-[var(--glass-border)] animate-fade-in-slide text-right" dir="rtl">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">إضافة تشغيلة دواء (Batch Entry)</h3>
            
            <form onSubmit={handleAddBatch} className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">اختر المنتج الدوائي</label>
                <select 
                  required
                  value={newBatch.productId}
                  onChange={(e) => setNewBatch({ ...newBatch, productId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-teal-500"
                >
                  <option value="">-- اختر المنتج --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
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
    </div>
  );
}
