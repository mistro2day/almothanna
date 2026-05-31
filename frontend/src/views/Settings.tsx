import React, { useState, useEffect } from 'react';
import { useSettingsStore, CompanySettings, ManagedUser } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
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
  DollarSign
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

  const [activeSubTab, setActiveSubTab] = useState<'company' | 'users'>('company');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
      await deleteUser(id);
      showNotification('تم حذف المستخدم بنجاح');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      showNotification('فشل في حذف المستخدم', true);
    }
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
      <div className="flex border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveSubTab('company')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
            activeSubTab === 'company'
              ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>بيانات الشركة</span>
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
            activeSubTab === 'users'
              ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>المستخدمين والصلاحيات</span>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
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
