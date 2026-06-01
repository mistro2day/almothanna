import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertTriangle, Phone, Receipt, User, FileText, Landmark } from 'lucide-react';
import { useSalesStore } from '../store/useSalesStore';
import { apiClient } from '../api/apiClient';

interface Installment {
  id: string;
  saleId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paidAmountSale: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | string;
  notes?: string;
}

export default function InstallmentsCalendar() {
  const setSelectedInvoiceIdForDetails = useSalesStore((state) => state.setSelectedInvoiceIdForDetails);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateInstallments, setSelectedDateInstallments] = useState<Installment[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paying, setPaying] = useState(false);

  // Fetch installments
  const fetchInstallmentsData = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<Installment[]>('/sales/installments');
      setInstallments(data);
    } catch (err) {
      console.error('Failed to fetch installments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallmentsData();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate calendar days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth();
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const getDayInstallments = (date: Date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return installments.filter(inst => inst.dueDate.startsWith(dateStr));
  };

  const handleDateClick = (date: Date) => {
    if (!date) return;
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDateStr(dateStr);
    setSelectedDateInstallments(getDayInstallments(date));
  };

  const openPayModal = (inst: Installment) => {
    setSelectedInstallment(inst);
    setPayAmount(inst.amount - inst.paidAmount);
    setShowPayModal(true);
  };

  const handlePayInstallment = async () => {
    if (!selectedInstallment) return;
    try {
      setPaying(true);
      await apiClient.post(`/sales/installments/${selectedInstallment.id}/pay`, { amount: Number(payAmount) });
      setShowPayModal(false);
      setSelectedInstallment(null);
      await fetchInstallmentsData();
      // Refresh selected date list if open
      if (selectedDateStr) {
        setTimeout(() => {
          const updated = installments.map(i => {
            if (i.id === selectedInstallment.id) {
              return { ...i, paidAmount: i.paidAmount + payAmount, status: i.paidAmount + payAmount >= i.amount ? 'PAID' : 'PARTIAL' };
            }
            return i;
          });
          setSelectedDateInstallments(updated.filter(inst => inst.dueDate.startsWith(selectedDateStr)));
        }, 500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  // Determine status style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">مدفوع</span>;
      case 'OVERDUE':
        return <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">متأخر</span>;
      default:
        return <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">مستحق</span>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 border border-[var(--border-color)] rounded-2xl flex items-center justify-between">
          <div className="text-right space-y-1">
            <span className="text-xs text-[var(--text-secondary)] font-semibold">إجمالي الأقساط المتبقية</span>
            <h3 className="text-2xl font-black text-amber-500">
              {installments.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + (i.amount - i.paidAmount), 0).toLocaleString()} <span className="text-sm font-normal">SDG</span>
            </h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 border border-[var(--border-color)] rounded-2xl flex items-center justify-between">
          <div className="text-right space-y-1">
            <span className="text-xs text-[var(--text-secondary)] font-semibold">الأقساط المستحقة المتأخرة</span>
            <h3 className="text-2xl font-black text-rose-500">
              {installments.filter(i => i.status === 'OVERDUE' || (new Date(i.dueDate) < new Date() && i.status !== 'PAID')).reduce((sum, i) => sum + (i.amount - i.paidAmount), 0).toLocaleString()} <span className="text-sm font-normal">SDG</span>
            </h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 border border-[var(--border-color)] rounded-2xl flex items-center justify-between">
          <div className="text-right space-y-1">
            <span className="text-xs text-[var(--text-secondary)] font-semibold">أقساط تم تحصيلها</span>
            <h3 className="text-2xl font-black text-emerald-500">
              {installments.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.paidAmount, 0).toLocaleString()} <span className="text-sm font-normal">SDG</span>
            </h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass-card p-6 border border-[var(--border-color)] rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
              <CalendarIcon className="w-5 h-5 text-emerald-500" />
              <span>جدول الدفعات الشهري</span>
            </h3>
            <div className="flex items-center gap-2 bg-[var(--border-color)]/20 p-1.5 rounded-xl border border-[var(--border-color)]/45">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-[var(--border-color)] rounded-lg transition-colors text-[var(--text-primary)] cursor-pointer">
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="text-sm font-bold px-4 text-[var(--text-primary)] select-none">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-[var(--border-color)] rounded-lg transition-colors text-[var(--text-primary)] cursor-pointer">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[var(--text-secondary)] pb-2 border-b border-[var(--border-color)]">
            <div>الأحد</div>
            <div>الإثنين</div>
            <div>الثلاثاء</div>
            <div>الأربعاء</div>
            <div>الخميس</div>
            <div>الجمعة</div>
            <div>السبت</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="h-24 bg-[var(--border-color)]/5 rounded-xl border border-[var(--border-color)]/10" />;
              
              const dayInsts = getDayInstallments(day);
              const isSelected = selectedDateStr === day.toISOString().split('T')[0];
              const isToday = new Date().toISOString().split('T')[0] === day.toISOString().split('T')[0];

              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDateClick(day)}
                  className={`h-24 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500'
                      : isToday
                      ? 'border-emerald-500/50 bg-[var(--border-color)]/10'
                      : 'border-[var(--border-color)] hover:border-emerald-500/40 hover:bg-[var(--border-color)]/10'
                  }`}
                >
                  <span className={`text-xs font-bold self-start w-6 h-6 flex items-center justify-center rounded-lg ${
                    isToday ? 'bg-emerald-500 text-white' : 'text-[var(--text-primary)]'
                  }`}>
                    {day.getDate()}
                  </span>
                  
                  {dayInsts.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] text-right font-black truncate max-w-full text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/10">
                        {dayInsts.reduce((sum, i) => sum + i.amount, 0).toLocaleString()} SDG
                      </div>
                      <div className="text-[8px] text-[var(--text-secondary)] text-right">
                        {dayInsts.length} دفعة
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="glass-card p-6 border border-[var(--border-color)] rounded-2xl flex flex-col h-full space-y-4">
          <div className="border-b border-[var(--border-color)] pb-3">
            <h4 className="text-md font-bold text-[var(--text-primary)]">
              {selectedDateStr ? `دفعات تاريخ: ${selectedDateStr}` : 'اختر تاريخاً من التقويم'}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              عرض الفواتير المستحقة وخيارات السداد والتنبيه
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[480px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-sm">جاري تحميل البيانات...</div>
            ) : selectedDateInstallments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-8 border-2 border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--border-color)]/5">
                <FileText className="w-10 h-10 text-[var(--text-secondary)]/40" />
                <p className="text-xs text-[var(--text-secondary)]">لا توجد أقساط أو دفعات مستحقة في هذا اليوم</p>
              </div>
            ) : (
              selectedDateInstallments.map((inst) => (
                <div key={inst.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--border-color)]/10 space-y-3 hover:border-[var(--border-color)]/80 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-sm font-bold text-[var(--text-primary)]">{inst.customerName}</h5>
                      <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {inst.customerPhone}
                      </span>
                    </div>
                    {getStatusBadge(inst.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-color)] pt-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] block">رقم الفاتورة</span>
                      <span className="font-bold text-[var(--text-primary)]">{inst.saleId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] block">المبلغ المستحق</span>
                      <span className="font-bold text-amber-500">{inst.amount.toLocaleString()} SDG</span>
                    </div>
                  </div>

                  {inst.notes && (
                    <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--border-color)]/25 p-2 rounded-lg border border-[var(--border-color)]/30">
                      {inst.notes}
                    </p>
                  )}

                  <div className="flex gap-2 mt-2 pt-2 border-t border-[var(--border-color)]/30">
                    {inst.status !== 'PAID' && (
                      <button
                        onClick={() => openPayModal(inst)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        تسجيل سداد
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedInvoiceIdForDetails(inst.saleId);
                      }}
                      className="flex-1 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      عرض الفاتورة 📄
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pay Installment Modal */}
      {showPayModal && selectedInstallment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full border border-[var(--border-color)] rounded-3xl p-6 space-y-5 animate-scaleUp text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-500" />
                <span>سداد الدفعة المستحقة</span>
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 bg-[var(--border-color)]/20 p-4 rounded-2xl border border-[var(--border-color)]/40 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">العميل:</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedInstallment.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">رقم الفاتورة:</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedInstallment.saleId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">مبلغ القسط الكلي:</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedInstallment.amount.toLocaleString()} SDG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">المسدد سابقاً:</span>
                <span className="font-bold text-emerald-500">{selectedInstallment.paidAmount.toLocaleString()} SDG</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--text-secondary)]">المبلغ المراد سداده الآن (SDG)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-bold text-lg text-center"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePayInstallment}
                disabled={paying || payAmount <= 0}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                {paying ? 'جاري السداد...' : 'تأكيد السداد'}
              </button>
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-3 bg-[var(--border-color)]/40 hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded-xl font-semibold transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
