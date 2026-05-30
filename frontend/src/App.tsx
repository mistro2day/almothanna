import React, { useEffect, useState } from 'react';
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';
import { useInventoryStore } from './store/useInventoryStore';
import { useSalesStore } from './store/useSalesStore';
import { useSupplierStore } from './store/useSupplierStore';

// Views
import Dashboard from './views/Dashboard';
import Inventory from './views/Inventory';
import Sales from './views/Sales';
import Customers from './views/Customers';
import Suppliers from './views/Suppliers';
import Login from './views/Login';

// Icons
import { 
  LayoutDashboard, 
  PackageSearch, 
  Receipt, 
  UsersRound, 
  Building2,
  Sun, 
  Moon, 
  Wifi, 
  WifiOff, 
  HeartHandshake,
  LogOut,
  UserCircle2,
  Menu,
  X
} from 'lucide-react';

type ViewType = 'dashboard' | 'inventory' | 'sales' | 'customers' | 'suppliers';

export default function App() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const user = useAuthStore((state) => state.user);
  const isOffline = useAuthStore((state) => state.isOffline);
  const logout = useAuthStore((state) => state.logout);
  
  // Navigation state for desktop and mobile
  const [activeTab, setActiveTab] = useState<ViewType>('dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Stores Caches
  const loadInventory = useInventoryStore((state) => state.loadLocalCache);
  const products = useInventoryStore((state) => state.products);
  const batches = useInventoryStore((state) => state.batches);
  const setProducts = useInventoryStore((state) => state.setProducts);
  const setBatches = useInventoryStore((state) => state.setBatches);

  const customers = useSalesStore((state) => state.customers);
  const setCustomers = useSalesStore((state) => state.setCustomers);

  const loadSuppliers = useSupplierStore((state) => state.loadLocalCache);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const setSuppliers = useSupplierStore((state) => state.setSuppliers);
  const setPurchaseOrders = useSupplierStore((state) => state.setPurchaseOrders);
  const setPayments = useSupplierStore((state) => state.setPayments);
  const purchaseOrders = useSupplierStore((state) => state.purchaseOrders);

  const roleLabels: Record<string, string> = {
    ADMIN: 'مدير النظام',
    SALES: 'فريق المبيعات',
    WAREHOUSE: 'مشرف المخزون',
    ACCOUNTANT: 'قسم المحاسبة',
  };

  // Load local caches once session is available
  useEffect(() => {
    if (!user) return;
    loadInventory();
    loadSuppliers();
  }, [user, loadInventory, loadSuppliers]);

  // Hydrate with initial data if local storage cache is empty (Offline First bootstrap)
  useEffect(() => {
    if (products.length === 0) {
      setProducts([
        { id: '1', name: 'Amoxicillin 500mg', scientificName: 'Amoxicillin Trihydrate', barcode: '6251234567890', category: 'Antibiotics', unit: 'Box' },
        { id: '2', name: 'Paracetamol 500mg', scientificName: 'Paracetamol', barcode: '6251234567891', category: 'Analgesics', unit: 'Box' },
        { id: '3', name: 'Insulin Glargine 100 IU/ml', scientificName: 'Insulin Glargine', barcode: '6251234567893', category: 'Antidiabetics', unit: 'Vial' },
      ]);
    }

    if (batches.length === 0) {
      const today = new Date();
      
      const expiry1 = new Date();
      expiry1.setMonth(today.getMonth() + 2);
      
      const expiry2 = new Date();
      expiry2.setMonth(today.getMonth() + 10);

      const expiry3 = new Date();
      expiry3.setMonth(today.getMonth() + 4);

      setBatches([
        { id: 'b1', batchNumber: 'AMX-2026-01', productId: '1', qty: 250, costPrice: 4200, expiryDate: expiry1.toISOString().split('T')[0], manufactureDate: '2025-01-10', productName: 'Amoxicillin 500mg' },
        { id: 'b2', batchNumber: 'PCT-2026-05', productId: '2', qty: 1500, costPrice: 950, expiryDate: expiry2.toISOString().split('T')[0], manufactureDate: '2025-05-15', productName: 'Paracetamol 500mg' },
        { id: 'b3', batchNumber: 'INS-2026-11', productId: '3', qty: 85, costPrice: 18500, expiryDate: expiry3.toISOString().split('T')[0], manufactureDate: '2025-02-01', productName: 'Insulin Glargine 100 IU/ml' },
      ]);
    }

    if (customers.length === 0) {
      setCustomers([
        { id: 'c1', name: 'صيدلية الشفاء النموذجية', type: 'Pharmacy', state: 'الخرطوم', phone: '0912111111', creditLimit: 500000 },
        { id: 'c2', name: 'مستشفى ود مدني التعليمي', type: 'Hospital', state: 'الجزيرة', phone: '0912222222', creditLimit: 2000000 },
        { id: 'c3', name: 'صيدلية الميناء العسكرية', type: 'Pharmacy', state: 'البحر الأحمر', phone: '0912333333', creditLimit: 1000000 },
      ]);
    }

    if (suppliers.length === 0) {
      setSuppliers([
        {
          id: 's1', name: 'شركة أمجاد للأدوية', companyName: 'Amjad Pharmaceuticals Ltd.', type: 'pharma_company',
          phone: '0918100100', email: 'info@amjad-pharma.sd', country: 'السودان', city: 'الخرطوم',
          address: 'شارع المطار، الخرطوم', commercialReg: 'CR-2024-10234',
          contactPerson: 'أحمد محمد علي', contactPhone: '0912500500',
          creditLimit: 5000000, paymentTerms: 'NET_30', currency: 'SDG', isActive: true,
          createdAt: '2026-01-15T00:00:00Z',
        },
        {
          id: 's2', name: 'مصانع الدواء العربية', companyName: 'Arab Drug Industries', type: 'manufacturer',
          phone: '0918200200', email: 'sales@arabdrug.com', country: 'مصر', city: 'القاهرة',
          address: 'المنطقة الصناعية، العاشر من رمضان',
          contactPerson: 'محمود حسن', contactPhone: '01012345678',
          creditLimit: 10000000, paymentTerms: 'NET_60', currency: 'USD', isActive: true,
          createdAt: '2025-11-01T00:00:00Z',
        },
        {
          id: 's3', name: 'وكالة الشفاء للأدوية', type: 'wholesaler',
          phone: '0918300300', country: 'السودان', city: 'بورتسودان',
          contactPerson: 'عمر بابكر', contactPhone: '0912700700',
          creditLimit: 2000000, paymentTerms: 'CASH_ON_DELIVERY', currency: 'SDG', isActive: true,
          createdAt: '2026-03-20T00:00:00Z',
        },
      ]);

      setPurchaseOrders([
        {
          id: 'po1', orderNumber: 'PO-000001', supplierId: 's1', supplierName: 'شركة أمجاد للأدوية',
          total: 1050000, paid: 500000, status: 'PARTIAL',
          items: [
            { id: 'pi1', productId: '1', productName: 'Amoxicillin 500mg', qty: 100, unitCost: 4200 },
            { id: 'pi2', productId: '2', productName: 'Paracetamol 500mg', qty: 700, unitCost: 900 },
          ],
          createdAt: '2026-04-10T00:00:00Z',
        },
        {
          id: 'po2', orderNumber: 'PO-000002', supplierId: 's2', supplierName: 'مصانع الدواء العربية',
          total: 1572500, paid: 0, status: 'CONFIRMED',
          items: [
            { id: 'pi3', productId: '3', productName: 'Insulin Glargine 100 IU/ml', qty: 85, unitCost: 18500 },
          ],
          createdAt: '2026-05-01T00:00:00Z',
        },
      ]);

      setPayments([
        {
          id: 'pay1', supplierId: 's1', supplierName: 'شركة أمجاد للأدوية',
          amount: 500000, paymentMethod: 'BANK_TRANSFER', reference: 'TRF-20260420-001',
          notes: 'دفعة أولى من أمر الشراء PO-000001', paidAt: '2026-04-20T00:00:00Z',
        },
      ]);
    }
  }, [user, products, batches, customers, suppliers]);

  if (!user) {
    return <Login />;
  }

  const primaryContact = user.email ?? user.phone;
  const userRoleLabel = roleLabels[user.role] ?? 'مستخدم';

  // Navigation options
  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'inventory', label: 'المخزون الدوائي', icon: PackageSearch },
    { id: 'sales', label: 'إصدار الفواتير', icon: Receipt },
    { id: 'customers', label: 'العملاء والشحن', icon: UsersRound },
    { id: 'suppliers', label: 'الموردين', icon: Building2 },
  ];

  // Render active view
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'sales': return <Sales />;
      case 'customers': return <Customers />;
      case 'suppliers': return <Suppliers />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden bg-[var(--bg-primary)] transition-colors duration-300">
      {/* Glow backgrounds for aesthetics */}
      <div className="glow-bg top-[-10%] right-[-10%] w-[350px] h-[350px] bg-emerald-500/10" />
      <div className="glow-bg bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-teal-500/10" />

      {/* Desktop Sidebar (Arabic RTL layout) */}
      <aside className="hidden md:flex md:w-64 glass-card border-l border-[var(--border-color)] flex-col justify-between z-10 p-5 md:sticky md:top-0 md:h-screen text-right" dir="rtl">
        <div className="space-y-6">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 py-2 border-b border-[var(--border-color)] justify-end">
            <div>
              <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">المثنى للأدوية</h2>
              <span className="text-[10px] text-emerald-500 font-semibold block uppercase tracking-wider">نظام التوزيع ERP</span>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <HeartHandshake className="w-6 h-6" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ViewType)}
                  className={`w-full flex items-center justify-end gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/30 hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{item.label}</span>
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Theme Switch & Network info) */}
        <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
          <div className="glass-card rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--text-primary)]">{user.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {primaryContact}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
                <UserCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-400">
              <span>{userRoleLabel}</span>
              <span>جلسة فعالة</span>
            </div>
            <button
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-500 transition-all hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              {isOffline ? (
                <>
                  <WifiOff className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="text-rose-500 font-bold">دون اتصال</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">متصل بالشبكة</span>
                </>
              )}
            </span>
            <span>حالة الخدمة</span>
          </div>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] text-sm font-semibold transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>الوضع النهاري</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>الوضع الليلي</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Header with Drawer Toggle */}
      <header className="md:hidden glass-card border-b border-[var(--border-color)] p-4 flex items-center justify-between z-20" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display text-[var(--text-primary)]">المثنى للأدوية</h2>
            <span className="text-[9px] text-emerald-500 uppercase tracking-wider">نظام التوزيع</span>
          </div>
        </div>
        
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="p-3 rounded-xl bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Full-Screen Navigation Overlay */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col" onClick={() => setMobileDrawerOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          {/* Full-screen content */}
          <div 
            className="relative z-10 flex flex-col w-full h-full glass-card overflow-y-auto"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2.5 rounded-xl bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] transition-colors"
                aria-label="إغلاق القائمة"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h2 className="text-base font-bold font-display text-[var(--text-primary)]">المثنى للأدوية</h2>
                  <span className="text-[9px] text-emerald-500 uppercase tracking-wider">نظام التوزيع ERP</span>
                </div>
              </div>
            </div>

            {/* Navigation Grid - centered */}
            <div className="flex-1 flex flex-col justify-center px-6 py-8">
              {/* User Info Card */}
              <div className="glass-card rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] p-4 mb-8 max-w-md mx-auto w-full">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{user.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{primaryContact}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
                    <UserCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-400">
                  <span>{userRoleLabel}</span>
                  <span>جلسة فعالة</span>
                </div>
              </div>

              {/* 2-column grid of navigation items */}
              <nav className="grid grid-cols-2 gap-4 max-w-md mx-auto w-full">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as ViewType); setMobileDrawerOpen(false); }}
                      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105 border-2 border-emerald-400/50' 
                          : 'text-[var(--text-secondary)] glass-card border border-[var(--border-color)] hover:bg-[var(--border-color)]/30 hover:text-[var(--text-primary)] hover:border-emerald-500/30'
                      }`}
                    >
                      <Icon className="w-9 h-9" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border-color)] p-4 space-y-3 max-w-md mx-auto w-full">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  {isOffline ? (
                    <>
                      <WifiOff className="w-4 h-4 text-rose-500 animate-pulse" />
                      <span className="text-rose-500 font-bold">دون اتصال</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500 font-bold">متصل بالشبكة</span>
                    </>
                  )}
                </span>
                <span>حالة الخدمة</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] text-sm font-semibold transition-all cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>الوضع النهاري</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <span>الوضع الليلي</span>
                    </>
                  )}
                </button>

                <button
                  onClick={logout}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-500 transition-all hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Desktop */}
      <main className="hidden md:block flex-1 p-6 md:p-10 z-10 overflow-y-auto max-h-screen">
        {renderView()}
      </main>

      {/* Main Content Area - Mobile */}
      <main className="md:hidden flex-1 p-4 sm:p-5 z-10 overflow-y-auto pb-28 sm:pb-32 safe-area-bottom">
        {renderView()}
      </main>

      {/* Mobile Bottom Navigation - fixed at bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="glass-card border border-[var(--border-color)] rounded-2xl h-20 sm:h-24 flex items-center justify-around px-2 pointer-events-auto shadow-lg shadow-emerald-500/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ViewType)}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all duration-200 flex-1 min-w-0 touch-target ${
                  isActive ? 'bg-emerald-500/10' : ''
                }`}
              >
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${isActive ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`} />
                <span className={`text-[11px] sm:text-xs font-semibold truncate w-full text-center ${isActive ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}