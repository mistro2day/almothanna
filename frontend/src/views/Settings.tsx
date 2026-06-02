import React, { useState, useEffect } from 'react';
import { useSettingsStore, CompanySettings, ManagedUser } from '../store/useSettingsStore';
import { useAuthStore, getDefaultPermissions } from '../store/useAuthStore';
import { useActivityStore } from '../store/useActivityStore';
import { 
  Building, 
  Users, 
  ShieldAlert, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  Key, 
  Check, 
  X,
  Upload,
  UserCheck,
  Building2,
  DollarSign,
  Activity
} from 'lucide-react';

export default function Settings() {
  const { user: currentUser } = useAuthStore();
  const { 
    settings, 
    users, 
    loadingSettings, 
    loadingUsers, 
    fetchSettings, 
    updateSettings, 
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser 
  } = useSettingsStore();

  const { activities, loadingActivities, fetchActivities } = useActivityStore();

  const [activeSubTab, setActiveSubTab] = useState<'company' | 'users' | 'activities' | 'permissions'>('company');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Pagination states for activities log
  const [activityCurrentPage, setActivityCurrentPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(10);

  const paginatedActivities = React.useMemo(() => {
    const startIndex = (activityCurrentPage - 1) * activityPageSize;
    return activities.slice(startIndex, startIndex + activityPageSize);
  }, [activities, activityCurrentPage, activityPageSize]);

  const totalActivityPages = Math.ceil(activities.length / activityPageSize);

  // Reset page to 1 when settings change
  useEffect(() => {
    setActivityCurrentPage(1);
  }, [activityPageSize, activities.length]);

  // Company Form State
  const [companyForm, setCompanyForm] = useState<Partial<CompanySettings>>({});
  
  // User Management State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const [userForm, setUserForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'SALES' as any
  });

  // Permissions State
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<any>(null);

  const roleLabels: Record<string, string> = {
    ADMIN: 'مدير النظام',
    SALES: 'فريق المبيعات',
    WAREHOUSE: 'مشرف المخزون',
    ACCOUNTANT: 'قسم المحاسبة',
  };

  useEffect(() => {
    fetchSettings().then(data => {
      setCompanyForm(data);
    });
    if (currentUser?.role === 'ADMIN') {
      fetchUsers();
    }
    fetchActivities();

    // Auto-refresh activities log every 5 seconds to display actions in real-time
    const interval = setInterval(() => {
      fetchActivities();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Logo Upload Handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification('حجم الشعار يجب ألا يتجاوز 2 ميجابايت', true);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyForm(prev => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'ADMIN') {
      showNotification('عذراً، صلاحية مدير النظام مطلوبة لتعديل الإعدادات', true);
      return;
    }

    try {
      await updateSettings(companyForm);
      showNotification('تم حفظ إعدادات الشركة بنجاح ✨');
      useActivityStore.getState().logActivity('تعديل إعدادات الشركة', `تم تعديل بيانات شركة ${companyForm.name || ''}`);
    } catch (err: any) {
      console.error(err);
      showNotification('فشل في حفظ الإعدادات، يرجى التحقق من المدخلات', true);
    }
  };

  // Add User Handler
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.phone) return;

    try {
      await createUser(userForm);
      useActivityStore.getState().logActivity('إضافة مستخدم جديد', `تم إنشاء حساب للمستخدم ${userForm.name} بدور ${roleLabels[userForm.role] || userForm.role}`);
      setUserForm({ name: '', phone: '', email: '', password: '', role: 'SALES' });
      setShowAddUserModal(false);
      showNotification('تم إضافة المستخدم الجديد بنجاح');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      showNotification(err.response?.data?.message || 'فشل في إضافة المستخدم', true);
    }
  };

  // Edit User Handler
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, {
        name: editingUser.name,
        phone: editingUser.phone,
        email: editingUser.email,
        role: editingUser.role,
        ...(userForm.password ? { password: userForm.password } : {})
      });
      useActivityStore.getState().logActivity('تحديث بيانات مستخدم', `تم تعديل بيانات حساب المستخدم ${editingUser.name}`);
      setUserForm(prev => ({ ...prev, password: '' }));
      setShowEditUserModal(false);
      setEditingUser(null);
      showNotification('تم تحديث بيانات المستخدم بنجاح');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      showNotification('فشل في تحديث بيانات المستخدم', true);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      showNotification('لا يمكنك حذف حسابك الحالي', true);
      return;
    }

    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائياً؟')) return;

    try {
      const userToDelete = users.find(u => u.id === id);
      const nameStr = userToDelete ? userToDelete.name : id;
      await deleteUser(id);
      useActivityStore.getState().logActivity('حذف مستخدم', `تم حذف حساب المستخدم ${nameStr}`);
      showNotification('تم حذف المستخدم بنجاح');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      showNotification('فشل في حذف المستخدم', true);
    }
  };

  // Load permissions when selected user changes
  useEffect(() => {
    if (!selectedUserId) {
      setUserPermissions(null);
      return;
    }
    const targetUser = users.find(u => u.id === selectedUserId);
    if (targetUser) {
      const perms = targetUser.permissions || getDefaultPermissions(targetUser.role);
      setUserPermissions(JSON.parse(JSON.stringify(perms))); // deep copy
    }
  }, [selectedUserId, users]);

  // Handle Save Permissions
  const handleSavePermissions = async () => {
    if (!selectedUserId || !userPermissions) return;
    try {
      const targetUser = users.find(u => u.id === selectedUserId);
      const nameStr = targetUser ? targetUser.name : selectedUserId;
      const updatedUser = await updateUser(selectedUserId, { permissions: userPermissions });
      
      // If the updated user is the currently logged-in user, refresh their session in real-time
      if (currentUser && currentUser.id === selectedUserId) {
        const currentToken = useAuthStore.getState().token;
        if (currentToken) {
          useAuthStore.getState().login(updatedUser as any, currentToken);
        }
      }

      useActivityStore.getState().logActivity('تعديل صلاحيات مستخدم', `تم تعديل صلاحيات المستخدم التفصيلية لـ ${nameStr}`);
      showNotification('تم تحديث صلاحيات المستخدم بنجاح ✨');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      showNotification('فشل في حفظ الصلاحيات المخصصة', true);
    }
  };

  // Toggle single permission key
  const handleTogglePermission = (path: 'pages' | 'buttons', section: string, key?: string) => {
    setUserPermissions((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (path === 'pages') {
        updated.pages = { ...updated.pages, [section]: !updated.pages[section] };
      } else if (path === 'buttons' && key) {
        updated.buttons = {
          ...updated.buttons,
          [section]: {
            ...updated.buttons[section],
            [key]: !updated.buttons[section]?.[key]
          }
        };
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-shake">
          <X className="w-5 h-5" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)]">إعدادات النظام</h1>
          <p className="mt-1 text-sm sm:text-base text-[var(--text-secondary)]">
            التحكم في بيانات الشركة الموحدة، وتعديل إعدادات المبيعات والمستخدمين وصلاحياتهم.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[var(--border-color)] scrollbar-none flex-nowrap overflow-x-auto" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => setActiveSubTab('company')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer shrink-0 flex-shrink-0 whitespace-nowrap ${
            activeSubTab === 'company'
              ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{ flexShrink: 0 }}
        >
          <Building className="w-4 h-4" />
          <span>بيانات الشركة</span>
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer shrink-0 flex-shrink-0 whitespace-nowrap ${
            activeSubTab === 'users'
              ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{ flexShrink: 0 }}
        >
          <Users className="w-4 h-4" />
          <span>المستخدمين</span>
        </button>
        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer shrink-0 flex-shrink-0 whitespace-nowrap ${
              activeSubTab === 'permissions'
                ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ flexShrink: 0 }}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>الصلاحيات التفصيلية</span>
          </button>
        )}
        <button
          onClick={() => setActiveSubTab('activities')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer shrink-0 flex-shrink-0 whitespace-nowrap ${
            activeSubTab === 'activities'
              ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{ flexShrink: 0 }}
        >
          <Activity className="w-4 h-4" />
          <span>النشاطات (Activities)</span>
        </button>
      </div>

      {/* Tab 1: Company Settings */}
      {activeSubTab === 'company' && (
        <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)] animate-fade-in">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Logo Section */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 border border-dashed border-[var(--border-color)] rounded-2xl text-center bg-[var(--bg-secondary)]/50">
                <span className="text-xs font-bold text-[var(--text-secondary)] mb-4">شعار الشركة</span>
                {companyForm.logo ? (
                  <div className="relative group w-32 h-32 rounded-2xl overflow-hidden border border-[var(--border-color)] mb-4">
                    <img src={companyForm.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                    {currentUser?.role === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => setCompanyForm(prev => ({ ...prev, logo: null }))}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5 text-rose-400" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-[var(--border-color)]/30 flex items-center justify-center mb-4 text-[var(--text-secondary)]">
                    <Building2 className="w-12 h-12 text-[var(--text-secondary)]/50" />
                  </div>
                )}
                {currentUser?.role === 'ADMIN' && (
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع شعار</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Data Fields */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">اسم الشركة</label>
                  <input
                    type="text"
                    required
                    disabled={currentUser?.role !== 'ADMIN'}
                    value={companyForm.name || ''}
                    onChange={e => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">رقم الهاتف</label>
                  <input
                    type="text"
                    required
                    disabled={currentUser?.role !== 'ADMIN'}
                    value={companyForm.phone || ''}
                    onChange={e => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">البريد الإلكتروني</label>
                  <input
                    type="email"
                    disabled={currentUser?.role !== 'ADMIN'}
                    value={companyForm.email || ''}
                    onChange={e => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">العنوان</label>
                  <input
                    type="text"
                    disabled={currentUser?.role !== 'ADMIN'}
                    value={companyForm.address || ''}
                    onChange={e => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">رقم السجل التجاري</label>
                  <input
                    type="text"
                    disabled={currentUser?.role !== 'ADMIN'}
                    value={companyForm.commercialReg || ''}
                    onChange={e => setCompanyForm(prev => ({ ...prev, commercialReg: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">الرقم الضريبي</label>
                  <input
                    type="text"
                    disabled={currentUser?.role !== 'ADMIN'}
                    value={companyForm.taxNumber || ''}
                    onChange={e => setCompanyForm(prev => ({ ...prev, taxNumber: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">العملة الافتراضية</label>
                  <select
                    disabled={currentUser?.role !== 'ADMIN'}
                    value={companyForm.currency || 'SDG'}
                    onChange={e => setCompanyForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                  >
                    <option value="SDG">جنيه سوداني (SDG)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-bold text-[var(--text-secondary)]">تذييل الفواتير المطبوعة</label>
              <textarea
                disabled={currentUser?.role !== 'ADMIN'}
                rows={3}
                value={companyForm.invoiceFooter || ''}
                onChange={e => setCompanyForm(prev => ({ ...prev, invoiceFooter: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50 resize-none"
              />
            </div>

            {currentUser?.role === 'ADMIN' && (
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التغييرات</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Users & Roles */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {currentUser?.role !== 'ADMIN' ? (
            <div className="glass-card p-10 rounded-3xl border border-[var(--glass-border)] text-center flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full">
                <ShieldAlert className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">أمان وصلاحيات النظام</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-md">
                عذراً، هذا القسم مخصص لمدير النظام فقط لتعديل صلاحيات الموظفين وإدارة المستخدمين الجدد.
              </p>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)] animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">إدارة مستخدمي النظام</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">تعديل أدوار الموظفين، تفعيل أو إيقاف الحسابات، أو توليد مستخدم جديد.</p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مستخدم جديد</span>
                </button>
              </div>

              {loadingUsers ? (
                <div className="text-center py-10">
                  <div className="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-3 text-[var(--text-secondary)]">جاري تحميل المستخدمين...</p>
                </div>
              ) : (
                <div className="overflow-x-auto whitespace-nowrap table-scroll-mobile">
                  <table className="w-full text-right text-xs sm:text-sm min-w-[750px] sm:min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                        <th className="pb-3 pr-2">الاسم</th>
                        <th className="pb-3 text-center">الهاتف</th>
                        <th className="pb-3 text-center">البريد الإلكتروني</th>
                        <th className="pb-3 text-center">الدور / الصلاحية</th>
                        <th className="pb-3 text-center">تاريخ الإنشاء</th>
                        <th className="pb-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {users.map((u: ManagedUser) => (
                        <tr key={u.id} className="hover:bg-[var(--border-color)]/20 transition-colors">
                          <td className="py-4 pr-2 font-semibold text-[var(--text-primary)]">{u.name}</td>
                          <td className="py-4 text-center font-mono text-[var(--text-primary)]">{u.phone}</td>
                          <td className="py-4 text-center text-[var(--text-secondary)]">{u.email || '---'}</td>
                          <td className="py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                              u.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-500' :
                              u.role === 'SALES' ? 'bg-emerald-500/10 text-emerald-500' :
                              u.role === 'WAREHOUSE' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-purple-500/10 text-purple-500'
                            }`}>
                              {roleLabels[u.role]}
                            </span>
                          </td>
                          <td className="py-4 text-center font-mono text-[var(--text-secondary)]">
                            {new Date(u.createdAt).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setUserForm(prev => ({ ...prev, password: '' }));
                                  setShowEditUserModal(true);
                                }}
                                className="p-1.5 hover:bg-emerald-500/10 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                title="تعديل المستخدم"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 hover:bg-rose-500/10 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="حذف المستخدم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Detailed Permissions Management */}
      {activeSubTab === 'permissions' && currentUser?.role === 'ADMIN' && (
        <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)] animate-fade-in text-right">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">إدارة الصلاحيات التفصيلية للمستخدمين</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              حدد بدقة متناهية أي صفحة، زر، تبويب، أو إجراء مسموح به لكل موظف على حدة بناءً على مسؤوليته.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* User Selection Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <span className="text-xs font-bold text-[var(--text-secondary)] block">اختر الموظف لتعديل صلاحياته:</span>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {users.map((u) => {
                  const isSelected = selectedUserId === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600/10 border-emerald-500 text-emerald-500 shadow-md shadow-emerald-500/5'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:bg-[var(--border-color)]/30 text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="text-right">
                        <p className="text-xs font-black">{u.name}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">{u.phone}</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--border-color)] font-bold">
                        {roleLabels[u.role] || u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permissions Grid Editor */}
            <div className="lg:col-span-3">
              {!selectedUserId || !userPermissions ? (
                <div className="h-full min-h-[300px] border border-dashed border-[var(--border-color)] rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-secondary)]/30">
                  <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-full mb-3 animate-pulse">
                    <ShieldAlert className="w-10 h-10" />
                  </div>
                  <h4 className="text-base font-bold text-[var(--text-primary)]">لم يتم اختيار موظف بعد</h4>
                  <p className="text-xs text-[var(--text-secondary)] max-w-xs mt-1">
                    يرجى تحديد أحد مستخدمي النظام من القائمة الجانبية لعرض وتعديل صلاحياته التفصيلية للأزرار والصفحات.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {/* Selected User Header Card */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-sm">
                        {users.find(u => u.id === selectedUserId)?.name.slice(0, 1)}
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-black text-[var(--text-primary)]">
                          {users.find(u => u.id === selectedUserId)?.name}
                        </h4>
                        <span className="inline-block text-[9px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-extrabold mt-1">
                          {roleLabels[users.find(u => u.id === selectedUserId)?.role || ''] || 'مستخدم'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleSavePermissions}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-all cursor-pointer self-stretch sm:self-auto justify-center"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ صلاحيات الموظف</span>
                    </button>
                  </div>

                  {/* 1. Pages Permissions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest border-b border-[var(--border-color)] pb-1.5">
                      1. صلاحيات رؤية الصفحات الرئيسية (Page Access)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { key: 'dashboard', label: 'لوحة التحكم (Dashboard)' },
                        { key: 'inventory', label: 'المخزون الدوائي (Inventory)' },
                        { key: 'sales', label: 'إصدار الفواتير والمبيعات (Sales)' },
                        { key: 'calendar', label: 'تقويم الدفعات (Calendar)' },
                        { key: 'customers', label: 'العملاء والشحن (Customers)' },
                        { key: 'suppliers', label: 'الموردين (Suppliers)' },
                        { key: 'reports', label: 'التقارير الذكية (Reports)' },
                        { key: 'settings', label: 'الإعدادات (Settings)' },
                      ].map((page) => (
                        <label
                          key={page.key}
                          className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/20 cursor-pointer hover:bg-[var(--border-color)]/30 transition-colors"
                        >
                          <span className="text-xs font-bold text-[var(--text-primary)]">{page.label}</span>
                          <input
                            type="checkbox"
                            checked={!!userPermissions.pages?.[page.key]}
                            onChange={() => handleTogglePermission('pages', page.key)}
                            className="w-4.5 h-4.5 rounded border-[var(--border-color)] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 2. Inventory Section Buttons */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest border-b border-[var(--border-color)] pb-1.5">
                      2. أزرار وإجراءات المخزون الدوائي
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { key: 'addProduct', label: 'إضافة منتج جديد' },
                        { key: 'editProduct', label: 'تعديل بيانات منتج' },
                        { key: 'deleteProduct', label: 'حذف منتج نهائياً' },
                        { key: 'addBatch', label: 'إضافة باتش (تشغيلة)' },
                        { key: 'editBatch', label: 'تعديل تشغيلة' },
                        { key: 'deleteBatch', label: 'حذف تشغيلة' },
                        { key: 'exportExcel', label: 'تصدير المخزون لملف Excel' },
                      ].map((btn) => (
                        <label
                          key={btn.key}
                          className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/20 cursor-pointer hover:bg-[var(--border-color)]/30 transition-colors"
                        >
                          <span className="text-xs font-bold text-[var(--text-primary)]">{btn.label}</span>
                          <input
                            type="checkbox"
                            checked={!!userPermissions.buttons?.inventory?.[btn.key]}
                            onChange={() => handleTogglePermission('buttons', 'inventory', btn.key)}
                            className="w-4.5 h-4.5 rounded border-[var(--border-color)] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 3. Sales & Invoicing Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest border-b border-[var(--border-color)] pb-1.5">
                      3. أزرار الفواتير والمبيعات
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { key: 'createInvoice', label: 'إنشاء وحفظ فاتورة مبيعات' },
                        { key: 'cancelInvoice', label: 'إلغاء فاتورة مبيعات معتمدة' },
                        { key: 'viewProfit', label: 'رؤية هوامش الأرباح وأسعار التكلفة' },
                      ].map((btn) => (
                        <label
                          key={btn.key}
                          className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/20 cursor-pointer hover:bg-[var(--border-color)]/30 transition-colors"
                        >
                          <span className="text-xs font-bold text-[var(--text-primary)]">{btn.label}</span>
                          <input
                            type="checkbox"
                            checked={!!userPermissions.buttons?.sales?.[btn.key]}
                            onChange={() => handleTogglePermission('buttons', 'sales', btn.key)}
                            className="w-4.5 h-4.5 rounded border-[var(--border-color)] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 4. Customers & Deliveries Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest border-b border-[var(--border-color)] pb-1.5">
                      4. أزرار العملاء وحركات الشحن
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { key: 'addCustomer', label: 'إضافة عميل جديد' },
                        { key: 'editCustomer', label: 'تعديل عميل' },
                        { key: 'deleteCustomer', label: 'حذف عميل' },
                        { key: 'manageReps', label: 'إدارة المناديب والعمولات' },
                        { key: 'manageDeliveries', label: 'تحديث حالات توصيل الشحنات' },
                      ].map((btn) => (
                        <label
                          key={btn.key}
                          className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/20 cursor-pointer hover:bg-[var(--border-color)]/30 transition-colors"
                        >
                          <span className="text-xs font-bold text-[var(--text-primary)]">{btn.label}</span>
                          <input
                            type="checkbox"
                            checked={!!userPermissions.buttons?.customers?.[btn.key]}
                            onChange={() => handleTogglePermission('buttons', 'customers', btn.key)}
                            className="w-4.5 h-4.5 rounded border-[var(--border-color)] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 5. Suppliers & Purchasing Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest border-b border-[var(--border-color)] pb-1.5">
                      5. أزرار الموردين والطلبيات الشراء
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { key: 'addSupplier', label: 'إضافة مورد جديد' },
                        { key: 'editSupplier', label: 'تعديل بيانات مورد' },
                        { key: 'deleteSupplier', label: 'حذف مورد' },
                        { key: 'manageOrders', label: 'إنشاء/استلام أوامر الشراء' },
                        { key: 'managePayments', label: 'إضافة مدفوعات الموردين' },
                      ].map((btn) => (
                        <label
                          key={btn.key}
                          className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/20 cursor-pointer hover:bg-[var(--border-color)]/30 transition-colors"
                        >
                          <span className="text-xs font-bold text-[var(--text-primary)]">{btn.label}</span>
                          <input
                            type="checkbox"
                            checked={!!userPermissions.buttons?.suppliers?.[btn.key]}
                            onChange={() => handleTogglePermission('buttons', 'suppliers', btn.key)}
                            className="w-4.5 h-4.5 rounded border-[var(--border-color)] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 6. Settings & Security Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest border-b border-[var(--border-color)] pb-1.5">
                      6. صلاحيات الإعدادات العامة والأمان
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { key: 'editCompany', label: 'تعديل بيانات الشركة والشعار' },
                        { key: 'manageUsers', label: 'إدارة وإضافة المستخدمين الجدد' },
                        { key: 'viewActivities', label: 'استعراض سجل نشاطات النظام' },
                        { key: 'managePermissions', label: 'التحكم بالصلاحيات التفصيلية' },
                      ].map((btn) => (
                        <label
                          key={btn.key}
                          className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/20 cursor-pointer hover:bg-[var(--border-color)]/30 transition-colors"
                        >
                          <span className="text-xs font-bold text-[var(--text-primary)]">{btn.label}</span>
                          <input
                            type="checkbox"
                            checked={!!userPermissions.buttons?.settings?.[btn.key]}
                            onChange={() => handleTogglePermission('buttons', 'settings', btn.key)}
                            className="w-4.5 h-4.5 rounded border-[var(--border-color)] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Activities Log */}
      {activeSubTab === 'activities' && (
        <div className="glass-card p-6 rounded-3xl border border-[var(--glass-border)] animate-fade-in text-right">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">سجل نشاطات النظام (Activities Log)</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                متابعة شاملة لكافة العمليات والأنشطة التي تتم داخل المشروع مع تحديد اسم المستخدم المسؤول.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-secondary)]">عرض:</span>
                <select
                  value={activityPageSize}
                  onChange={(e) => setActivityPageSize(Number(e.target.value))}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-bold px-3 py-2 rounded-xl outline-none cursor-pointer hover:border-emerald-500 transition-colors text-right"
                  dir="rtl"
                >
                  <option value={10}>10 نشاطات</option>
                  <option value={20}>20 نشاطاً</option>
                  <option value={50}>50 نشاطاً</option>
                  <option value={100}>100 نشاط</option>
                </select>
              </div>

              <button
                onClick={() => fetchActivities()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-500/20"
              >
                <span>تحديث السجل</span>
              </button>
            </div>
          </div>

          {loadingActivities ? (
            <div className="text-center py-10">
              <div className="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-3 text-[var(--text-secondary)]">جاري تحميل سجل الأنشطة...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              لا توجد نشاطات مسجلة حالياً في النظام.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto whitespace-nowrap table-scroll-mobile">
                <table className="w-full text-right text-xs sm:text-sm min-w-[750px] sm:min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                      <th className="pb-3 pr-2">المستخدم</th>
                      <th className="pb-3 text-center">العملية / النشاط</th>
                      <th className="pb-3 text-right">التفاصيل</th>
                      <th className="pb-3 text-left">الوقت والتاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {paginatedActivities.map((act) => (
                      <tr key={act.id} className="hover:bg-[var(--border-color)]/20 transition-colors">
                        <td className="py-4 pr-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                              {act.user?.name ? act.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '؟'}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-[var(--text-primary)]">{act.user?.name || 'مستخدم غير معروف'}</div>
                              <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--border-color)]/40 px-1.5 py-0.5 rounded">
                                {roleLabels[act.user?.role] || act.user?.role || '---'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center font-bold text-emerald-500">{act.action}</td>
                        <td className="py-4 text-right text-[var(--text-secondary)] max-w-xs sm:max-w-md whitespace-normal break-words">{act.details}</td>
                        <td className="py-4 text-left font-mono text-[var(--text-secondary)] whitespace-nowrap">
                          {new Date(act.createdAt).toLocaleString('ar-SA', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalActivityPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--border-color)]/30 pt-4 mt-2" dir="rtl">
                  <div className="text-xs text-[var(--text-secondary)] font-medium">
                    عرض {Math.min(activities.length, (activityCurrentPage - 1) * activityPageSize + 1)} إلى {Math.min(activities.length, activityCurrentPage * activityPageSize)} من أصل {activities.length} نشاط
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActivityCurrentPage(p => Math.max(1, p - 1))}
                      disabled={activityCurrentPage === 1}
                      className="p-1.5 px-3 bg-[var(--border-color)]/20 hover:bg-[var(--border-color)] disabled:opacity-40 text-xs font-bold rounded-xl transition-all cursor-pointer select-none text-[var(--text-primary)]"
                    >
                      السابق
                    </button>
                    <span className="text-xs font-bold text-[var(--text-primary)] px-2">
                      الصفحة {activityCurrentPage} من {totalActivityPages}
                    </span>
                    <button
                      onClick={() => setActivityCurrentPage(p => Math.min(totalActivityPages, p + 1))}
                      disabled={activityCurrentPage === totalActivityPages}
                      className="p-1.5 px-3 bg-[var(--border-color)]/20 hover:bg-[var(--border-color)] disabled:opacity-40 text-xs font-bold rounded-xl transition-all cursor-pointer select-none text-[var(--text-primary)]"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddUserModal(false)} />
          <div className="relative z-10 w-full max-w-md glass-card p-6 rounded-3xl border border-[var(--glass-border)] animate-zoom-in text-right">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setShowAddUserModal(false)} className="p-1 text-[var(--text-secondary)] hover:text-rose-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">إضافة مستخدم جديد</h3>
            </div>
            
            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">الاسم</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={e => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">رقم الهاتف</label>
                <input
                  type="text"
                  required
                  value={userForm.phone}
                  onChange={e => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">كلمة المرور (الافتراضية: 123456)</label>
                <input
                  type="password"
                  placeholder="اتركها فارغة للموثق الافتراضي"
                  value={userForm.password}
                  onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">دور الصلاحية</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                >
                  <option value="SALES">فريق المبيعات (SALES)</option>
                  <option value="ADMIN">مدير النظام (ADMIN)</option>
                  <option value="WAREHOUSE">مشرف المخزون (WAREHOUSE)</option>
                  <option value="ACCOUNTANT">قسم المحاسبة (ACCOUNTANT)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة المستخدم</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowEditUserModal(false); setEditingUser(null); }} />
          <div className="relative z-10 w-full max-w-md glass-card p-6 rounded-3xl border border-[var(--glass-border)] animate-zoom-in text-right">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => { setShowEditUserModal(false); setEditingUser(null); }} className="p-1 text-[var(--text-secondary)] hover:text-rose-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">تعديل بيانات المستخدم</h3>
            </div>
            
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">الاسم</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={e => setEditingUser(prev => ({ ...prev!, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">رقم الهاتف</label>
                <input
                  type="text"
                  required
                  value={editingUser.phone}
                  onChange={e => setEditingUser(prev => ({ ...prev!, phone: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={e => setEditingUser(prev => ({ ...prev!, email: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">إعادة تعيين كلمة المرور (جديدة)</label>
                <input
                  type="password"
                  placeholder="اتركها فارغة للاحتفاظ بكلمة المرور الحالية"
                  value={userForm.password}
                  onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">دور الصلاحية</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser(prev => ({ ...prev!, role: e.target.value as any }))}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50"
                >
                  <option value="SALES">فريق المبيعات (SALES)</option>
                  <option value="ADMIN">مدير النظام (ADMIN)</option>
                  <option value="WAREHOUSE">مشرف المخزون (WAREHOUSE)</option>
                  <option value="ACCOUNTANT">قسم المحاسبة (ACCOUNTANT)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>تحديث البيانات</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
