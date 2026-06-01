import React, { useEffect, useState } from 'react';
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';
import { useInventoryStore } from './store/useInventoryStore';
import { useSalesStore } from './store/useSalesStore';
import { useSupplierStore } from './store/useSupplierStore';
import { useSettingsStore } from './store/useSettingsStore';


// Views
import Dashboard from './views/Dashboard';
import Inventory from './views/Inventory';
import Sales from './views/Sales';
import Customers from './views/Customers';
import Suppliers from './views/Suppliers';
import Login from './views/Login';
import SettingsView from './views/Settings';
import Reports from './views/Reports';
import NotificationsCenter from './components/NotificationsCenter';


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
  X,
  Settings,
  BarChart3
} from 'lucide-react';

type ViewType = 'dashboard' | 'inventory' | 'sales' | 'customers' | 'suppliers' | 'settings' | 'reports';

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
  const fetchProducts = useInventoryStore((state) => state.fetchProducts);
  const fetchBatches = useInventoryStore((state) => state.fetchBatches);

  const customers = useSalesStore((state) => state.customers);
  const setCustomers = useSalesStore((state) => state.setCustomers);
  const fetchCustomers = useSalesStore((state) => state.fetchCustomers);

  const loadSuppliers = useSupplierStore((state) => state.loadLocalCache);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const setSuppliers = useSupplierStore((state) => state.setSuppliers);
  const setPurchaseOrders = useSupplierStore((state) => state.setPurchaseOrders);
  const setPayments = useSupplierStore((state) => state.setPayments);
  const purchaseOrders = useSupplierStore((state) => state.purchaseOrders);
  const fetchSuppliers = useSupplierStore((state) => state.fetchSuppliers);
  const fetchPurchaseOrders = useSupplierStore((state) => state.fetchPurchaseOrders);
  const fetchPayments = useSupplierStore((state) => state.fetchPayments);

  const loadSettings = useSettingsStore((state) => state.loadLocalCache);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  const fetchUsers = useSettingsStore((state) => state.fetchUsers);

  const roleLabels: Record<string, string> = {
    ADMIN: 'مدير النظام',
    SALES: 'فريق المبيعات',
    WAREHOUSE: 'مشرف المخزون',
    ACCOUNTANT: 'قسم المحاسبة',
  };

  // Load local caches and fetch from backend once session is available
  useEffect(() => {
    if (!user) return;
    loadInventory();
    loadSuppliers();
    loadSettings();
    
    // Fetch live data from backend
    fetchProducts();
    fetchBatches();
    fetchCustomers();
    fetchSuppliers();
    fetchPurchaseOrders();
    fetchPayments();
    fetchSettings();
    
    // ADMIN can fetch the list of managed users
    if (user.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user, loadInventory, loadSuppliers, loadSettings, fetchProducts, fetchBatches, fetchCustomers, fetchSuppliers, fetchPurchaseOrders, fetchPayments, fetchSettings, fetchUsers]);


  // Hydrate with initial data if local storage cache is empty (Offline First bootstrap)
  useEffect(() => {
    // Only hydrate if we are offline and have no data, otherwise rely on backend
    if (isOffline) {
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
    { id: 'reports', label: 'التقارير الذكية', icon: BarChart3 },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  // Render active view
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'sales': return <Sales />;
      case 'customers': return <Customers />;
      case 'suppliers': return <Suppliers />;
      case 'reports': return <Reports />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row relative overflow-hidden bg-[var(--bg-primary)] transition-colors duration-300">
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
      <header className="md:hidden sticky top-0 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-color)] p-4 flex items-center justify-between z-30" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display text-[var(--text-primary)]">المثنى للأدوية</h2>
            <span className="text-[9px] text-emerald-500 uppercase tracking-wider">نظام التوزيع</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationsCenter />
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-3 rounded-xl bg-[var(--border-color)]/50 hover:bg-[var(--border-color)] text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
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
      <main className="hidden md:block flex-1 z-10 overflow-y-auto max-h-screen">
        {/* Top Header Bar for Desktop */}
        <div className="sticky top-0 bg-[var(--bg-primary)]/80 backdrop-blur-lg z-30 flex justify-between items-center py-4 px-6 md:px-10 border-b border-[var(--border-color)]" dir="rtl">
          <div className="text-right">
            <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">
              {navItems.find(n => n.id === activeTab)?.label || 'لوحة التحكم'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsCenter />
          </div>
        </div>
        
        <div className="p-6 md:p-10">
          {renderView()}
        </div>
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
                className={`flex flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all duration-150 active:scale-90 flex-1 min-w-0 touch-target cursor-pointer ${
                  isActive ? 'bg-emerald-500/10 text-emerald-500' : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/20'
                }`}
              >
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${isActive ? 'text-emerald-500 scale-105' : 'text-[var(--text-secondary)]'} transition-transform`} />
                <span className={`text-[11px] sm:text-xs font-bold truncate w-full text-center ${isActive ? 'text-emerald-500' : 'text-[var(--text-secondary)]'}`}>
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