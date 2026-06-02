import React, { useEffect, useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertTriangle, Phone, Receipt, User, FileText, Landmark, Printer, Download, ExternalLink } from 'lucide-react';
import { useSalesStore } from '../store/useSalesStore';
import { useSettingsStore } from '../store/useSettingsStore';
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
  const settings = useSettingsStore((state) => state.settings);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateInstallments, setSelectedDateInstallments] = useState<Installment[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paying, setPaying] = useState(false);

  // Sorting and Pagination for Upcoming Table
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const upcomingInstallments = useMemo(() => {
    const list = installments.filter(i => i.status !== 'PAID');
    
    list.sort((a, b) => {
      let valA: any = a[sortField as keyof Installment];
      let valB: any = b[sortField as keyof Installment];
      
      if (sortField === 'remaining') {
        valA = a.amount - a.paidAmount;
        valB = b.amount - b.paidAmount;
      } else if (sortField === 'isOverdue') {
        valA = new Date(a.dueDate) < new Date() ? 1 : 0;
        valB = new Date(b.dueDate) < new Date() ? 1 : 0;
      }
      
      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc'
          ? (valA > valB ? 1 : -1)
          : (valB > valA ? 1 : -1);
      }
    });
    
    return list;
  }, [installments, sortField, sortDirection]);

  const paginatedInstallments = useMemo(() => {
    const startIndex = (currentPage - 1) * 10;
    return upcomingInstallments.slice(startIndex, startIndex + 10);
  }, [upcomingInstallments, currentPage]);

  const totalPages = Math.ceil(upcomingInstallments.length / 10);

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
    fetchSettings();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Safe helper to format Date object into local YYYY-MM-DD string without timezone shifts
  const formatDateToLocal = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const dateStr = formatDateToLocal(date);
    return installments.filter(inst => inst.dueDate.startsWith(dateStr) && inst.status !== 'PAID');
  };

  const handleDateClick = (date: Date) => {
    if (!date) return;
    const dateStr = formatDateToLocal(date);
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

  // Function to print specific installment
  const handlePrintInstallment = (inst: Installment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <title>سند قسط - ${inst.customerName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .receipt-box { max-width: 600px; margin: auto; border: 2px solid #10b981; border-radius: 15px; padding: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
          .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #10b981; }
          .title { font-size: 20px; font-weight: bold; color: #2d3748; margin-top: 10px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f7fafc; padding-bottom: 8px; }
          .label { color: #718096; font-weight: 600; }
          .value { color: #2d3748; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          @media print {
            body { padding: 0; }
            .receipt-box { box-shadow: none; border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div class="logo">${settings?.name || 'مجموعة الأنصار للمشروعات والخدمات الطبية'}</div>
            <div style="font-size: 12px; color: #718096; margin-top: 5px;">
              ${settings?.address ? `العنوان: ${settings.address}` : ''} 
              ${settings?.phone ? ` | هاتف: ${settings.phone}` : ''}
              ${settings?.email ? ` | بريد: ${settings.email}` : ''}
            </div>
            <div class="title">سند تفاصيل قسط مستحق</div>
          </div>
          <div class="row"><span class="label">اسم العميل:</span><span class="value">${inst.customerName}</span></div>
          <div class="row"><span class="label">رقم الهاتف:</span><span class="value">${inst.customerPhone}</span></div>
          <div class="row"><span class="label">رقم الفاتورة:</span><span class="value">${inst.saleId}</span></div>
          <div class="row"><span class="label">تاريخ الاستحقاق:</span><span class="value">${new Date(inst.dueDate).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</span></div>
          <div class="row"><span class="label">مبلغ القسط:</span><span class="value">${inst.amount.toLocaleString()} SDG</span></div>
          <div class="row"><span class="label">المبلغ المدفوع:</span><span class="value">${inst.paidAmount.toLocaleString()} SDG</span></div>
          <div class="row"><span class="label">المبلغ المتبقي:</span><span class="value" style="color: #d69e2e;">${(inst.amount - inst.paidAmount).toLocaleString()} SDG</span></div>
          <div class="row"><span class="label">حالة القسط:</span><span class="value" style="color: #e53e3e;">${new Date(inst.dueDate) < new Date() ? 'متأخر' : 'مستحق'}</span></div>
          <div class="footer">
            <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-EG', { numberingSystem: 'latn' })}</p>
            <p>برمجيات الأنصار لإدارة وتوزيع الأدوية</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Function to download specific installment as PDF
  const handlePDFInstallment = (inst: Installment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <title>تفاصيل_قسط_${inst.customerName.replace(/\s+/g, '_')}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .receipt-box { max-width: 600px; margin: auto; border: 2px dashed #a0aec0; border-radius: 10px; padding: 30px; }
          .header { text-align: center; border-bottom: 2px solid #4a5568; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 26px; font-weight: bold; color: #2b6cb0; }
          .title { font-size: 20px; font-weight: bold; color: #2d3748; margin-top: 10px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #edf2f7; padding-bottom: 8px; }
          .label { color: #4a5568; font-weight: 600; }
          .value { color: #2d3748; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          @media print {
            body { padding: 0; }
            .receipt-box { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div class="logo">${settings?.name || 'مجموعة الأنصار للمشروعات والخدمات الطبية'}</div>
            <div style="font-size: 12px; color: #4a5568; margin-top: 5px;">
              ${settings?.address ? `العنوان: ${settings.address}` : ''} 
              ${settings?.phone ? ` | هاتف: ${settings.phone}` : ''}
              ${settings?.email ? ` | بريد: ${settings.email}` : ''}
            </div>
            <div class="title">تقرير استحقاق قسط (ملف PDF)</div>
          </div>
          <div class="row"><span class="label">اسم العميل:</span><span class="value">${inst.customerName}</span></div>
          <div class="row"><span class="label">رقم الهاتف:</span><span class="value">${inst.customerPhone}</span></div>
          <div class="row"><span class="label">رقم الفاتورة:</span><span class="value">${inst.saleId}</span></div>
          <div class="row"><span class="label">تاريخ الاستحقاق:</span><span class="value">${new Date(inst.dueDate).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</span></div>
          <div class="row"><span class="label">مبلغ القسط:</span><span class="value">${inst.amount.toLocaleString()} SDG</span></div>
          <div class="row"><span class="label">المبلغ المدفوع:</span><span class="value">${inst.paidAmount.toLocaleString()} SDG</span></div>
          <div class="row"><span class="label">المبلغ المتبقي:</span><span class="value">${(inst.amount - inst.paidAmount).toLocaleString()} SDG</span></div>
          <div class="row"><span class="label">حالة القسط:</span><span class="value">${new Date(inst.dueDate) < new Date() ? 'متأخر' : 'مستحق'}</span></div>
          <div class="footer">
            <p>تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG', { numberingSystem: 'latn' })}</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Function to download formatted Excel for single installment
  const handleExcelInstallment = (inst: Installment) => {
    const remaining = inst.amount - inst.paidAmount;
    const isOverdue = new Date(inst.dueDate) < new Date() ? 'متأخر' : 'مستحق';
    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>تفاصيل القسط</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; direction: rtl; }
          th { background-color: #10b981; color: white; font-weight: bold; border: 1px solid #cbd5e1; text-align: center; height: 30px; font-family: 'Segoe UI', Arial, sans-serif; }
          td { border: 1px solid #cbd5e1; text-align: right; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; }
          .header-row { font-size: 16px; font-weight: bold; color: #1e293b; text-align: center; border: none; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="8" class="header-row" style="text-align: center; font-size: 16px; font-weight: bold;">${settings?.name || 'مجموعة الأنصار للمشروعات والخدمات الطبية'}</td></tr>
          <tr><td colspan="8" class="header-row" style="text-align: center; font-size: 10px; color: #64748b; font-weight: normal;">
            ${settings?.address ? `العنوان: ${settings.address}` : ''} 
            ${settings?.phone ? ` | هاتف: ${settings.phone}` : ''}
            ${settings?.email ? ` | بريد: ${settings.email}` : ''}
          </td></tr>
          <tr><td colspan="8" class="header-row" style="text-align: center; font-size: 13px; color: #4b5563;">تفاصيل الدفعة المستحقة للعميل ${inst.customerName}</td></tr>
          <tr><td colspan="8"></td></tr>
          <tr>
            <th>العميل</th>
            <th>الهاتف</th>
            <th>رقم الفاتورة</th>
            <th>تاريخ الاستحقاق</th>
            <th>قيمة القسط</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>الحالة</th>
          </tr>
          <tr>
            <td>${inst.customerName}</td>
            <td style="mso-number-format:'\\@';">${inst.customerPhone}</td>
            <td style="mso-number-format:'\\@';">${inst.saleId}</td>
            <td>${new Date(inst.dueDate).toLocaleDateString('en-US')}</td>
            <td>${inst.amount}</td>
            <td>${inst.paidAmount}</td>
            <td>${remaining}</td>
            <td>${isOverdue}</td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `قسط_${inst.customerName.replace(/\s+/g, '_')}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Function to export all upcoming installments to Excel
  const handleExportAllExcel = () => {
    const activeInsts = installments.filter(i => i.status !== 'PAID');
    let rowsHtml = '';
    activeInsts.forEach(inst => {
      const remaining = inst.amount - inst.paidAmount;
      const isOverdue = new Date(inst.dueDate) < new Date() ? 'متأخر' : 'مستحق';
      rowsHtml += `
        <tr>
          <td>${inst.customerName}</td>
          <td style="mso-number-format:'\\@';">${inst.customerPhone}</td>
          <td style="mso-number-format:'\\@';">${inst.saleId}</td>
          <td>${new Date(inst.dueDate).toLocaleDateString('en-US')}</td>
          <td>${inst.amount}</td>
          <td>${inst.paidAmount}</td>
          <td>${remaining}</td>
          <td>${isOverdue}</td>
        </tr>
      `;
    });

    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>كشف الأقساط القادمة</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; direction: rtl; }
          th { background-color: #10b981; color: white; font-weight: bold; border: 1px solid #cbd5e1; text-align: center; height: 30px; font-family: 'Segoe UI', Arial, sans-serif; }
          td { border: 1px solid #cbd5e1; text-align: right; padding: 8px; font-family: 'Segoe UI', Arial, sans-serif; }
          .header-row { font-size: 18px; font-weight: bold; color: #1e293b; text-align: center; border: none; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="8" class="header-row" style="font-size: 18px; font-weight: bold;">${settings?.name || 'مجموعة الأنصار للمشروعات والخدمات الطبية'}</td></tr>
          <tr><td colspan="8" class="header-row" style="font-size: 10px; color: #64748b; font-weight: normal;">
            ${settings?.address ? `العنوان: ${settings.address}` : ''} 
            ${settings?.phone ? ` | هاتف: ${settings.phone}` : ''}
            ${settings?.email ? ` | بريد: ${settings.email}` : ''}
          </td></tr>
          <tr><td colspan="8" class="header-row" style="font-size: 14px; color: #4b5563; font-weight: bold;">كشف الأقساط والدفعات المستحقة والقادمة</td></tr>
          <tr><td colspan="8">تاريخ التصدير: ${new Date().toLocaleString('en-US')}</td></tr>
          <tr><td colspan="8"></td></tr>
          <tr>
            <th>العميل</th>
            <th>الهاتف</th>
            <th>رقم الفاتورة</th>
            <th>تاريخ الاستحقاق</th>
            <th>قيمة القسط</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>الحالة</th>
          </tr>
          ${rowsHtml}
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `كشف_الأقساط_القادمة_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Function to export all upcoming installments as PDF
  const handleExportAllPDF = () => {
    const activeInsts = installments.filter(i => i.status !== 'PAID');
    let rowsHtml = '';
    activeInsts.forEach((inst, index) => {
      const remaining = inst.amount - inst.paidAmount;
      const isOverdue = new Date(inst.dueDate) < new Date();
      const statusText = isOverdue ? 'متأخر' : 'مستحق';
      rowsHtml += `
        <tr style="background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="border: 1px solid #e2e8f0; padding: 12px 10px; text-align: right; color: #1e293b;">
            <strong style="color: #0f172a; font-size: 13px;">${inst.customerName}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">📞 ${inst.customerPhone}</span>
          </td>
          <td style="border: 1px solid #e2e8f0; padding: 12px 10px; text-align: center; font-family: monospace; font-weight: bold; color: #475569;">${inst.saleId}</td>
          <td style="border: 1px solid #e2e8f0; padding: 12px 10px; text-align: center; font-weight: bold; color: #334155;">${new Date(inst.dueDate).toLocaleDateString('en-US')}</td>
          <td style="border: 1px solid #e2e8f0; padding: 12px 10px; text-align: center; font-weight: bold; color: #0f766e;">${inst.amount.toLocaleString()} SDG</td>
          <td style="border: 1px solid #e2e8f0; padding: 12px 10px; text-align: center; color: #16a34a; font-weight: bold;">${inst.paidAmount.toLocaleString()} SDG</td>
          <td style="border: 1px solid #e2e8f0; padding: 12px 10px; text-align: center; color: #ea580c; font-weight: bold;">${remaining.toLocaleString()} SDG</td>
          <td style="border: 1px solid #e2e8f0; padding: 12px 10px; text-align: center;">
            <span style="padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; 
              background-color: ${isOverdue ? '#fee2e2' : '#fef3c7'}; 
              color: ${isOverdue ? '#ef4444' : '#d97706'};
              border: 1px solid ${isOverdue ? '#fca5a5' : '#fde047'};
              display: inline-block;">
              ${statusText}
            </span>
          </td>
        </tr>
      `;
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <title>كشف_الأقساط_المستحقة_والقادمة</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
          @page {
            size: landscape;
            margin: 15mm;
          }
          body { 
            font-family: 'Tajawal', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 10px; 
            color: #1e293b; 
            direction: rtl; 
            background-color: #ffffff;
          }
          .header-box { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 25px; 
            border-bottom: 2px solid #e2e8f0; 
            padding-bottom: 15px; 
          }
          .company-name { 
            font-size: 26px; 
            font-weight: 900; 
            color: #0f766e; 
            text-align: right; 
          }
          .company-details { 
            font-size: 12px; 
            color: #475569; 
            line-height: 1.6; 
            margin-top: 5px;
          }
          .report-title { 
            font-size: 22px; 
            font-weight: bold; 
            color: #0f172a; 
            text-align: center; 
            margin-top: 20px; 
            margin-bottom: 10px; 
            position: relative;
          }
          .report-title::after {
            content: '';
            display: block;
            width: 80px;
            height: 4px;
            background: linear-gradient(90deg, #0f766e, #14b8a6);
            margin: 8px auto 0;
            border-radius: 2px;
          }
          .meta-text { 
            font-size: 12px; 
            color: #64748b; 
            text-align: left; 
            vertical-align: top; 
            line-height: 1.6;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 25px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            border-radius: 8px;
            overflow: hidden;
          }
          th { 
            background: linear-gradient(135deg, #0f766e, #0d9488) !important; 
            color: white !important; 
            font-weight: 700; 
            border: 1px solid #0f766e; 
            padding: 14px 12px; 
            text-align: center; 
            font-size: 13px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          td { 
            border: 1px solid #e2e8f0; 
            padding: 12px; 
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .footer { 
            text-align: center; 
            margin-top: 50px; 
            font-size: 12px; 
            color: #94a3b8; 
            border-top: 1px dashed #cbd5e1; 
            padding-top: 20px; 
          }
        </style>
      </head>
      <body>
        <table class="header-box" style="border: none; margin-bottom: 20px;">
          <tr style="border: none;">
            <td style="border: none; text-align: right; padding: 0;" colspan="3">
              <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 5px;">
                ${settings?.logo 
                  ? `<img src="${settings.logo}" style="height: 65px; max-width: 180px; object-fit: contain;" />` 
                  : `<svg width="65" height="65" viewBox="0 0 120 120" style="vertical-align: middle;">
                       <defs>
                         <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                           <stop offset="0%" stop-color="#0f766e" />
                           <stop offset="100%" stop-color="#14b8a6" />
                         </linearGradient>
                         <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                           <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.1" />
                         </filter>
                       </defs>
                       <circle cx="60" cy="60" r="52" fill="#ffffff" filter="url(#shadow)" />
                       <circle cx="60" cy="60" r="46" fill="none" stroke="url(#logoGrad)" stroke-width="4" />
                       <!-- Stylized letter M for Mothanna + Medical Cross -->
                       <path d="M35 80 L35 40 L50 62 L60 52 L70 62 L85 40 L85 80" stroke="url(#logoGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                       <circle cx="60" cy="80" r="8" fill="#14b8a6" />
                       <path d="M60 28 L60 40 M54 34 L66 34" stroke="#0f766e" stroke-width="4" stroke-linecap="round" />
                     </svg>`
                }
                <div>
                  <div class="company-name" style="margin: 0; line-height: 1.2;">${settings?.name || 'صيدلية المثنى الحديثة'}</div>
                  <div class="company-details" style="margin-top: 5px;">
                    🏢 العنوان: ${settings?.address || 'العنوان غير محدد'}<br>
                    📞 الهاتف: ${settings?.phone || '---'} ${settings?.email ? ` | 📧 البريد: ${settings.email}` : ''}
                  </div>
                </div>
              </div>
            </td>
            <td style="border: none; text-align: left; padding: 0; vertical-align: top;" colspan="4" class="meta-text">
              تاريخ استخراج التقرير: ${new Date().toLocaleString('ar-EG', { numberingSystem: 'latn' })}<br>
              ${settings?.taxNumber ? `الرقم الضريبي: ${settings.taxNumber}` : ''}
            </td>
          </tr>
        </table>

        <div class="report-title">كشف الأقساط والدفعات المستحقة والقادمة للعملاء</div>

        <table>
          <thead>
            <tr>
              <th>العميل</th>
              <th>رقم الفاتورة</th>
              <th>تاريخ الاستحقاق</th>
              <th>مبلغ القسط</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <p>${settings?.invoiceFooter || 'تم توليد هذا التقرير تلقائياً بواسطة نظام إدارة صيدلية المثنى الحديثة'}</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
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

          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-semibold text-[var(--text-secondary)] pb-2 border-b border-[var(--border-color)]">
            <div><span className="hidden sm:inline">الأحد</span><span className="sm:hidden">أحد</span></div>
            <div><span className="hidden sm:inline">الإثنين</span><span className="sm:hidden">إثن</span></div>
            <div><span className="hidden sm:inline">الثلاثاء</span><span className="sm:hidden">ثلا</span></div>
            <div><span className="hidden sm:inline">الأربعاء</span><span className="sm:hidden">أرب</span></div>
            <div><span className="hidden sm:inline">الخميس</span><span className="sm:hidden">خميس</span></div>
            <div><span className="hidden sm:inline">الجمعة</span><span className="sm:hidden">جمع</span></div>
            <div><span className="hidden sm:inline">السبت</span><span className="sm:hidden">سبت</span></div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="h-16 sm:h-[82px] bg-[var(--border-color)]/5 rounded-xl border border-[var(--border-color)]/10" />;
              
              const dayInsts = getDayInstallments(day);
              const isSelected = selectedDateStr === formatDateToLocal(day);
              const isToday = formatDateToLocal(new Date()) === formatDateToLocal(day);
              
              const tooltipText = dayInsts.length > 0
                ? dayInsts.map(inst => 
                    `👤 العميل: ${inst.customerName}\n💰 المبلغ: ${inst.amount.toLocaleString()} SDG\n📄 فاتورة: ${inst.saleId}`
                  ).join('\n---\n')
                : '';

              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDateClick(day)}
                  title={tooltipText}
                  className={`h-16 sm:h-[82px] p-1 sm:p-1.5 rounded-lg sm:rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500'
                      : isToday
                      ? 'border-emerald-500/50 bg-[var(--border-color)]/10'
                      : 'border-[var(--border-color)] hover:border-emerald-500/40 hover:bg-[var(--border-color)]/10'
                  }`}
                >
                  <span className={`text-xs sm:text-[14px] font-black self-start w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center rounded ${
                    isToday ? 'bg-emerald-500 text-white' : 'text-[var(--text-primary)]'
                  }`}>
                    {day.getDate()}
                  </span>
                  
                  {dayInsts.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="text-[8px] sm:text-xs text-right font-black truncate max-w-full text-emerald-500 bg-emerald-500/10 px-0.5 sm:px-1 py-0.5 rounded border border-emerald-500/10">
                        {dayInsts.reduce((sum, i) => sum + i.amount, 0).toLocaleString()} <span className="hidden sm:inline">SDG</span>
                      </div>
                      <div className="text-[7px] sm:text-[11px] text-[var(--text-secondary)] font-black text-right leading-none">
                        {dayInsts.length} <span className="hidden sm:inline">دفعة</span><span className="sm:hidden">د</span>
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

      {/* Upcoming Installments Table Section */}
      <div className="glass-card p-6 border border-[var(--border-color)] rounded-2xl space-y-4 mt-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)] pb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
              <Landmark className="w-5 h-5 text-emerald-500" />
              <span>جدول الدفعات القادمة والمستحقة</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              فرز، تنقل وتصدير الأقساط القادمة للعملاء والمندوبين
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExportAllPDF()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-rose-500/10"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>تصدير الكل PDF 📄</span>
            </button>
            <button
              onClick={() => handleExportAllExcel()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-500/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير الكل إكسل 📊</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-[var(--text-secondary)]">جاري تحميل جدول الأقساط...</div>
        ) : upcomingInstallments.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-secondary)]">لا توجد أقساط مستحقة حالياً.</div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto whitespace-nowrap table-scroll-mobile">
              <table className="w-full text-right text-xs sm:text-sm min-w-[950px] sm:min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                    <th onClick={() => handleSort('customerName')} className="pb-3 pr-2 cursor-pointer hover:text-[var(--text-primary)] select-none">
                      العميل {sortField === 'customerName' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('saleId')} className="pb-3 text-center cursor-pointer hover:text-[var(--text-primary)] select-none">
                      رقم الفاتورة {sortField === 'saleId' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('dueDate')} className="pb-3 text-center cursor-pointer hover:text-[var(--text-primary)] select-none">
                      تاريخ الاستحقاق {sortField === 'dueDate' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('amount')} className="pb-3 text-center cursor-pointer hover:text-[var(--text-primary)] select-none">
                      قيمة القسط {sortField === 'amount' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('paidAmount')} className="pb-3 text-center cursor-pointer hover:text-[var(--text-primary)] select-none">
                      المدفوع {sortField === 'paidAmount' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('remaining')} className="pb-3 text-center cursor-pointer hover:text-[var(--text-primary)] select-none">
                      المتبقي {sortField === 'remaining' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('isOverdue')} className="pb-3 text-center cursor-pointer hover:text-[var(--text-primary)] select-none">
                      الحالة {sortField === 'isOverdue' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th className="pb-3 pl-2 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {paginatedInstallments.map((inst) => {
                    const remaining = inst.amount - inst.paidAmount;
                    const isOverdue = new Date(inst.dueDate) < new Date();
                    return (
                      <tr key={inst.id} className="hover:bg-[var(--border-color)]/30 transition-colors">
                        <td className="py-3 pr-2 font-medium text-[var(--text-primary)]">
                          <div>{inst.customerName}</div>
                          <div className="text-[10px] text-[var(--text-secondary)]">{inst.customerPhone}</div>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => setSelectedInvoiceIdForDetails(inst.saleId)}
                            className="text-indigo-500 hover:underline font-mono text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            {inst.saleId}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="py-3 text-center font-mono text-[var(--text-secondary)]">
                          {new Date(inst.dueDate).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}
                        </td>
                        <td className="py-3 text-center font-semibold text-[var(--text-primary)]">
                          {inst.amount.toLocaleString()} SDG
                        </td>
                        <td className="py-3 text-center text-emerald-500 font-semibold">
                          {inst.paidAmount.toLocaleString()} SDG
                        </td>
                        <td className="py-3 text-center text-amber-500 font-semibold">
                          {remaining.toLocaleString()} SDG
                        </td>
                        <td className="py-3 text-center">
                          {isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20">متأخر</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20">مستحق</span>
                          )}
                        </td>
                        <td className="py-3 pl-2 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handlePrintInstallment(inst)}
                              className="p-1 px-2 text-[11px] bg-sky-500/10 hover:bg-sky-500 text-sky-500 hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="طباعة القسط"
                            >
                              <Printer className="w-3 h-3" />
                              <span>طباعة</span>
                            </button>
                            <button
                              onClick={() => handlePDFInstallment(inst)}
                              className="p-1 px-2 text-[11px] bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="تحميل PDF"
                            >
                              <FileText className="w-3 h-3" />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => handleExcelInstallment(inst)}
                              className="p-1 px-2 text-[11px] bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="تحميل إكسل منسق"
                            >
                              <Download className="w-3 h-3" />
                              <span>إكسل</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--border-color)]/30 pt-4">
                <div className="text-xs text-[var(--text-secondary)] font-medium">
                  عرض {Math.min(upcomingInstallments.length, (currentPage - 1) * 10 + 1)} إلى {Math.min(upcomingInstallments.length, currentPage * 10)} من أصل {upcomingInstallments.length} دفعة
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 px-3 bg-[var(--border-color)]/20 hover:bg-[var(--border-color)] disabled:opacity-40 text-xs font-bold rounded-xl transition-all cursor-pointer select-none text-[var(--text-primary)]"
                  >
                    السابق
                  </button>
                  <span className="text-xs font-bold text-[var(--text-primary)] px-2">
                    الصفحة {currentPage} من {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
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
