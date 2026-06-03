import React, { useState } from 'react';
import { useSalesStore, Customer } from '../store/useSalesStore';
import { useActivityStore } from '../store/useActivityStore';
import { useRepresentativesStore, Representative } from '../store/useRepresentativesStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { apiClient } from '../api/apiClient';
import { 
  Users, 
  MapPin, 
  Truck, 
  Plus, 
  Search, 
  ShieldCheck,
  TrendingDown,
  Briefcase,
  Edit3,
  Trash2,
  UserCheck,
  Phone,
  Percent,
  ToggleLeft,
  ToggleRight,
  UserCog,
  Download,
  X,
  FileText,
  ExternalLink,
  ArrowRight,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

type TabType = 'customers' | 'shipping' | 'representatives';

export default function Customers() {
  const { customers, addCustomer, updateCustomer } = useSalesStore();
  const { representatives, addRepresentative, updateRepresentative, deleteRepresentative } = useRepresentativesStore();
  const { settings, fetchSettings } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Statement View state
  const [selectedCustomerForView, setSelectedCustomerForView] = useState<Customer | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  React.useEffect(() => {
    if (!selectedCustomerForView) {
      setCustomerInvoices([]);
      return;
    }
    const fetchCustomerInvoices = async () => {
      setLoadingInvoices(true);
      try {
        const { data } = await apiClient.get<any[]>('/sales');
        // Filter invoices for this customer
        const filtered = data.filter(inv => inv.customerId === selectedCustomerForView.id);
        setCustomerInvoices(filtered);
      } catch (err) {
        console.error('Error fetching customer invoices:', err);
      } finally {
        setLoadingInvoices(false);
      }
    };
    fetchCustomerInvoices();
  }, [selectedCustomerForView]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedState]);

  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [showCustomerDetailsModal, setShowCustomerDetailsModal] = useState(false);
  const [customerForDetails, setCustomerForDetails] = useState<Customer | null>(null);
  
  const [showAddRepModal, setShowAddRepModal] = useState(false);
  const [showEditRepModal, setShowEditRepModal] = useState(false);
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);

  // Customer Form inputs
  const [custForm, setCustForm] = useState({
    name: '',
    type: 'Pharmacy',
    state: 'الخرطوم',
    phone: '',
    creditLimit: 500000,
    representativeId: ''
  });

  // Representative Form inputs
  const [repForm, setRepForm] = useState({
    name: '',
    phone: '',
    commissionRate: 3.0
  });

  const [deliveryOrders] = useState([
    { id: 'DO-102', customerName: 'صيدلية الشفاء', state: 'الخرطوم', city: 'أمدرمان', status: 'DELIVERED', driverName: 'محمد أحمد', date: '2026-05-28' },
    { id: 'DO-103', customerName: 'مستشفى ود مدني التعليمي', state: 'الجزيرة', city: 'ود مدني', status: 'SHIPPED', driverName: 'أحمد صديق', date: '2026-05-29' },
    { id: 'DO-104', customerName: 'صيدلية الميناء العسكرية', state: 'البحر الأحمر', city: 'بورتسودان', status: 'PENDING', driverName: 'بكري صالح', date: '2026-05-30' },
  ]);

  // Sudan states list
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

  // Actions for Customers
  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name || !custForm.phone) return;

    try {
      const created = await addCustomer({
        name: custForm.name,
        type: custForm.type,
        state: custForm.state,
        phone: custForm.phone,
        creditLimit: Number(custForm.creditLimit),
        representativeId: custForm.representativeId || undefined
      });

      const repName = representatives.find(r => r.id === custForm.representativeId)?.name;

      useActivityStore.getState().logActivity(
        'إضافة عميل جديد',
        `تم تسجيل العميل ${custForm.name} (ولاية ${custForm.state}) بسقف ائتمان ${custForm.creditLimit.toLocaleString()} SDG` + 
        (repName ? ` ومندوبه الافتراضي هو ${repName}` : '')
      );

      setCustForm({ name: '', type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000, representativeId: '' });
      setShowAddCustomerModal(false);
    } catch (err) {
      console.error(err);
      alert('فشل في إضافة العميل');
    }
  };

  const handleEditCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustForm({
      name: customer.name,
      type: customer.type,
      state: customer.state,
      phone: customer.phone,
      creditLimit: customer.creditLimit,
      representativeId: customer.representativeId || ''
    });
    setShowEditCustomerModal(true);
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !custForm.name || !custForm.phone) return;

    try {
      await updateCustomer(selectedCustomer.id, {
        name: custForm.name,
        type: custForm.type,
        state: custForm.state,
        phone: custForm.phone,
        creditLimit: Number(custForm.creditLimit),
        representativeId: custForm.representativeId || ''
      });

      useActivityStore.getState().logActivity(
        'تعديل عميل',
        `تم تعديل بيانات العميل ${custForm.name} بنجاح`
      );

      setCustForm({ name: '', type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000, representativeId: '' });
      setShowEditCustomerModal(false);
      setSelectedCustomer(null);
    } catch (err) {
      console.error(err);
      alert('فشل في تعديل بيانات العميل');
    }
  };

  // Actions for Representatives
  const handleAddRepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repForm.name || !repForm.phone) return;

    try {
      await addRepresentative({
        name: repForm.name,
        phone: repForm.phone,
        commissionRate: Number(repForm.commissionRate)
      });

      useActivityStore.getState().logActivity(
        'إضافة مندوب جديد',
        `تم تسجيل المندوب ${repForm.name} بنسبة عمولة ${repForm.commissionRate}%`
      );

      setRepForm({ name: '', phone: '', commissionRate: 3.0 });
      setShowAddRepModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'فشل في إضافة المندوب');
    }
  };

  const handleEditRepClick = (rep: Representative) => {
    setSelectedRep(rep);
    setRepForm({
      name: rep.name,
      phone: rep.phone,
      commissionRate: rep.commissionRate
    });
    setShowEditRepModal(true);
  };

  const handleEditRepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep || !repForm.name || !repForm.phone) return;

    try {
      await updateRepresentative(selectedRep.id, {
        name: repForm.name,
        phone: repForm.phone,
        commissionRate: Number(repForm.commissionRate)
      });

      useActivityStore.getState().logActivity(
        'تعديل بيانات مندوب',
        `تم تعديل بيانات المندوب ${repForm.name} بنجاح`
      );

      setRepForm({ name: '', phone: '', commissionRate: 3.0 });
      setShowEditRepModal(false);
      setSelectedRep(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'فشل في تعديل المندوب');
    }
  };

  const handleToggleRepActive = async (rep: Representative) => {
    try {
      await updateRepresentative(rep.id, { isActive: !rep.isActive });
      useActivityStore.getState().logActivity(
        'تغيير حالة مندوب',
        `تم ${!rep.isActive ? 'تنشيط' : 'تعطيل'} حساب المندوب ${rep.name}`
      );
    } catch (err) {
      console.error(err);
      alert('فشل في تعديل حالة المندوب');
    }
  };

  const handleDeleteRep = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المندوب "${name}"؟ إذا كان لديه مبيعات سابقة فسيتم تعطيل حسابه فقط بدلاً من حذفه بالكامل.`)) return;
    try {
      await deleteRepresentative(id);
      useActivityStore.getState().logActivity(
        'حذف/تعطيل مندوب',
        `تم حذف أو إيقاف المندوب ${name}`
      );
    } catch (err) {
      console.error(err);
      alert('فشل في حذف المندوب');
    }
  };

  // Filter lists
  const filteredCustomers = customers.filter(c => {
    const matchesState = selectedState ? c.state === selectedState : true;
    const matchesSearch = search ? (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.state.includes(search)
    ) : true;
    return matchesState && matchesSearch;
  });

  const totalRecords = filteredCustomers.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const filteredReps = representatives.filter(r => {
    return search ? (
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search)
    ) : true;
  });

  // Active representatives list for selects
  const activeRepresentatives = representatives.filter(r => r.isActive);

  // Export to CSV Function
  const exportToCSV = (dataList: Customer[], filename: string) => {
    const headers = ['اسم العميل', 'النوع', 'الولاية', 'رقم الهاتف', 'سقف الائتمان (SDG)', 'المندوب الافتراضي'];
    const csvContent = [
      headers.join(','),
      ...dataList.map(c => [
        c.name,
        c.type === 'Pharmacy' ? 'صيدلية' : c.type === 'Hospital' ? 'مستشفى' : 'موزع',
        c.state,
        c.phone,
        c.creditLimit.toString(),
        c.representative ? c.representative.name : 'بيع مباشر'
      ].map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel Function (Premium XML)
  const exportToExcel = (dataList: Customer[]) => {
    const headers = ['اسم العميل', 'النوع', 'الولاية', 'رقم الهاتف', 'سقف الائتمان (SDG)', 'المندوب الافتراضي'];
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:CharSet="178" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Color="#059669" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Cell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Customers">
  <Table>
   <Row ss:Height="30">
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="Title"><Data ss:Type="String">سجل العملاء والصيدليات المعتمدين</Data></Cell>
   </Row>
   <Row ss:Height="25">
`;
    headers.forEach(h => {
      xml += `    <Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>\n`;
    });
    xml += '   </Row>\n';

    dataList.forEach(c => {
      xml += '   <Row ss:Height="20">\n';
      const rowData = [
        c.name,
        c.type === 'Pharmacy' ? 'صيدلية' : c.type === 'Hospital' ? 'مستشفى' : 'موزع',
        c.state,
        c.phone,
        c.creditLimit.toString(),
        c.representative ? c.representative.name : 'بيع مباشر'
      ];
      rowData.forEach((val, index) => {
        const type = index === 4 ? 'Number' : 'String';
        xml += `    <Cell ss:StyleID="Cell"><Data ss:Type="${type}">${val}</Data></Cell>\n`;
      });
      xml += '   </Row>\n';
    });

    xml += `  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <DisplayRightToLeft/>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers_report.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStatementToExcel = (customer: Customer, invoicesList: any[]) => {
    const companyName = settings?.name || "المثنى للأدوية";
    const companyAddress = settings?.address || "";
    const companyPhone = settings?.phone || "";
    let contactInfo = "";
    if (companyAddress) contactInfo += "العنوان: " + companyAddress;
    if (companyPhone) contactInfo += (contactInfo ? " | " : "") + "الهاتف: " + companyPhone;

    const headers = ['رقم الفاتورة', 'تاريخ الفاتورة', 'إجمالي الفاتورة (SDG)', 'المسدد (SDG)', 'المتبقي (SDG)', 'الحالة', 'المندوب'];
    const totalSales = invoicesList.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoicesList.reduce((sum, inv) => sum + inv.paid, 0);
    const totalDebt = Math.max(0, totalSales - totalPaid);

    let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:CharSet="178" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="CompanyHeader">
   <Font ss:FontName="Calibri" ss:Size="18" ss:Color="#059669" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#1f2937" ss:Bold="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Subtitle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#4b5563" ss:Italic="1"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Cell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#374151"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaValue">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#111827"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SummaryCell">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#059669"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Interior ss:Color="#ecfdf5" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Statement">
  <Table>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="130"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="130"/>
   
   <Row ss:Height="35">
    <Cell ss:MergeAcross="6" ss:StyleID="CompanyHeader"><Data ss:Type="String">${companyName}</Data></Cell>
   </Row>`;

    if (contactInfo) {
      xml += `\n   <Row ss:Height="20">
    <Cell ss:MergeAcross="6" ss:StyleID="Subtitle"><Data ss:Type="String">${contactInfo}</Data></Cell>
   </Row>`;
    }

    xml += `\n   <Row ss:Height="25">
    <Cell ss:MergeAcross="6" ss:StyleID="Title"><Data ss:Type="String">كشف حساب عميل تفصيلي</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="6" ss:StyleID="Subtitle"><Data ss:Type="String">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</Data></Cell>
   </Row>
   <Row ss:Height="15"></Row>
   
   <Row ss:Height="20">
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">اسم العميل:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${customer.name}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">الولاية:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">ولاية ${customer.state}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">رقم الهاتف:</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaValue"><Data ss:Type="String">${customer.phone}</Data></Cell>
   </Row>
   
   <Row ss:Height="20">
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">سقف الائتمان:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="Number">${customer.creditLimit}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">المندوب:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${customer.representative ? customer.representative.name : 'بيع مباشر'}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">نوع المنشأة:</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="MetaValue"><Data ss:Type="String">${customer.type === 'Pharmacy' ? 'صيدلية' : customer.type === 'Hospital' ? 'مستشفى' : 'موزع'}</Data></Cell>
   </Row>
   
   <Row ss:Height="15"></Row>
   
   <Row ss:Height="22">
    <Cell ss:StyleID="SummaryCell"><Data ss:Type="String">إجمالي الفواتير:</Data></Cell>
    <Cell ss:StyleID="SummaryCell"><Data ss:Type="Number">${totalSales}</Data></Cell>
    <Cell ss:StyleID="SummaryCell"><Data ss:Type="String">إجمالي المدفوع:</Data></Cell>
    <Cell ss:StyleID="SummaryCell"><Data ss:Type="Number">${totalPaid}</Data></Cell>
    <Cell ss:StyleID="SummaryCell"><Data ss:Type="String">الرصيد المتبقي:</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="SummaryCell"><Data ss:Type="Number">${totalDebt}</Data></Cell>
   </Row>
   
   <Row ss:Height="20"></Row>
   
   <Row ss:Height="25">`;
   
    headers.forEach(h => {
      xml += `\n    <Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`;
    });
    
    xml += `\n   </Row>`;

    invoicesList.forEach(inv => {
      const statusLabel = inv.status === 'PAID' ? 'خالصة' : inv.status === 'PARTIAL' ? 'مدفوعة جزئياً' : inv.status === 'PENDING' ? 'آجلة' : 'مسودة';
      xml += `\n   <Row ss:Height="20">
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${inv.id}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${new Date(inv.createdAt).toLocaleDateString('ar-SA')}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="Number">${inv.total}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="Number">${inv.paid}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="Number">${Math.max(0, inv.total - inv.paid)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${statusLabel}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${inv.representative ? inv.representative.name : 'بيع مباشر'}</Data></Cell>
   </Row>`;
    });

    xml += `\n  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <DisplayRightToLeft/>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `statement_${customer.name}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStatementToPDF = (customer: Customer, invoicesList: any[]) => {
    const companyName = settings?.name || "المثنى للأدوية";
    const companyPhone = settings?.phone || "غير محدد";
    const companyAddress = settings?.address || "السودان";
    const companyLogo = settings?.logo; // Base64 image
    
    const totalSales = invoicesList.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoicesList.reduce((sum, inv) => sum + inv.paid, 0);
    const totalDebt = Math.max(0, totalSales - totalPaid);

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) return;

    const rowsHTML = invoicesList.map((inv, idx) => {
      const rem = Math.max(0, inv.total - inv.paid);
      const statusLabel = inv.status === 'PAID' ? 'خالصة' : inv.status === 'PARTIAL' ? 'جزئية' : 'آجلة';
      const statusColor = inv.status === 'PAID' ? '#059669' : inv.status === 'PARTIAL' ? '#d97706' : '#dc2626';
      
      return `
        <tr>
          <td style="text-align: center; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; font-family: monospace;">${inv.id}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${new Date(inv.createdAt).toLocaleDateString('ar-SA')}</td>
          <td style="text-align: left; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${inv.total.toLocaleString()} SDG</td>
          <td style="text-align: left; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #059669;">${inv.paid.toLocaleString()} SDG</td>
          <td style="text-align: left; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #d97706;">${rem.toLocaleString()} SDG</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: ${statusColor};">${statusLabel}</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #e2e8f0;">${inv.representative ? inv.representative.name : 'بيع مباشر'}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>كشف حساب عميل - ${customer.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <style>
    @page { 
      size: A4 portrait; 
      margin: 15mm 12mm 15mm 12mm; 
    }
    * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
    body { background: #fff; color: #1e293b; line-height: 1.4; padding: 0; margin: 0; }
    
    table.print-layout {
      width: 100%;
      border-collapse: collapse;
      border: none !important;
    }
    table.print-layout > thead > tr > td,
    table.print-layout > tbody > tr > td,
    table.print-layout > tfoot > tr > td {
      border: none !important;
      padding: 0 !important;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #059669;
      padding-bottom: 12px;
      margin-bottom: 15px;
    }
    .company-logo {
      max-height: 60px;
      max-width: 150px;
      object-fit: contain;
    }
    .company-details h1 { font-size: 20px; color: #065f46; margin: 0 0 4px 0; font-weight: 800; }
    .company-details p { font-size: 11px; color: #475569; margin: 0; }
    .doc-title { text-align: left; }
    .doc-title h2 { font-size: 18px; color: #059669; margin: 0; font-weight: 700; }
    .doc-title p { font-size: 11px; color: #64748b; margin-top: 2px; }
    
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
      font-size: 12px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-label { color: #64748b; font-weight: 500; }
    .meta-value { color: #0f172a; font-weight: 700; }

    .kpi-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .kpi-title { font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 4px; }
    .kpi-value { font-size: 16px; font-weight: 900; font-family: monospace; }

    table.data-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 20px; 
    }
    table.data-table th { 
      background-color: #059669; 
      color: white; 
      padding: 8px 6px; 
      border: 1px solid #059669; 
      font-size: 12px; 
      font-weight: 700;
      text-align: center;
    }
    table.data-table td { 
      font-size: 11px; 
      border: 1px solid #e2e8f0; 
      padding: 8px 6px;
    }
    table.data-table tr:nth-child(even) { background: #f8fafc; }
    
    .footer-section { 
      border-top: 2px dashed #e2e8f0; 
      padding-top: 10px; 
      display: flex; 
      justify-content: space-between; 
      font-size: 10px; 
      color: #64748b; 
      margin-top: 15px;
    }
    .stamp { 
      border: 2px dashed #cbd5e1; 
      border-radius: 6px; 
      padding: 4px 12px; 
      font-size: 11px; 
      font-weight: 700; 
      color: #059669; 
    }
    
    @media print { 
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
    }
  </style>
</head>
<body>
  <table class="print-layout">
    <thead>
      <tr>
        <td>
          <div class="header-section">
            <div class="company-details" style="display: flex; align-items: center; gap: 15px;">
              ${companyLogo ? `<img src="${companyLogo}" class="company-logo" alt="Logo" />` : ''}
              <div>
                <h1>${companyName}</h1>
                <p>🏢 ${companyAddress} &nbsp;|&nbsp; 📞 هاتف: ${companyPhone}</p>
              </div>
            </div>
            <div class="doc-title">
              <h2>كشف حساب عميل تفصيلي</h2>
              <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>
            </div>
          </div>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="meta-grid">
            <div class="meta-box">
              <div class="meta-row">
                <span class="meta-label">العميل:</span>
                <span class="meta-value">${customer.name}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">رقم الهاتف:</span>
                <span class="meta-value" style="font-family: monospace;">${customer.phone}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">الولاية الجغرافية:</span>
                <span class="meta-value">ولاية ${customer.state}</span>
              </div>
            </div>
            <div class="meta-box">
              <div class="meta-row">
                <span class="meta-label">سقف الائتمان المعتمد:</span>
                <span class="meta-value" style="font-family: monospace;">${customer.creditLimit.toLocaleString()} SDG</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">المندوب المسؤول:</span>
                <span class="meta-value">${customer.representative ? customer.representative.name : 'بيع مباشر'}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">نوع العميل:</span>
                <span class="meta-value">${customer.type === 'Pharmacy' ? 'صيدلية' : customer.type === 'Hospital' ? 'مستشفى' : 'موزع جملة'}</span>
              </div>
            </div>
          </div>

          <div class="kpi-row">
            <div class="kpi-card" style="background-color: #ecfdf5; border-color: #a7f3d0;">
              <div class="kpi-title" style="color: #065f46;">إجمالي الفواتير</div>
              <div class="kpi-value" style="color: #065f46;">${totalSales.toLocaleString()} SDG</div>
            </div>
            <div class="kpi-card" style="background-color: #eff6ff; border-color: #bfdbfe;">
              <div class="kpi-title" style="color: #1e40af;">إجمالي المدفوع نقداً</div>
              <div class="kpi-value" style="color: #1e40af;">${totalPaid.toLocaleString()} SDG</div>
            </div>
            <div class="kpi-card" style="background-color: #fffbeb; border-color: #fde68a;">
              <div class="kpi-title" style="color: #92400e;">المديونية المتبقية</div>
              <div class="kpi-value" style="color: #b45309;">${totalDebt.toLocaleString()} SDG</div>
            </div>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">رقم الفاتورة</th>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">تاريخ الإصدار</th>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">قيمة الفاتورة</th>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">المسدد</th>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">المتبقي الآجل</th>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">حالة الفاتورة</th>
                <th style="background-color: #059669; color: white; border: 1px solid #059669;">المندوب</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td>
          <div class="footer-section">
            <div>تم توليد المستند تلقائياً عبر نظام إدارة التوزيع ERP لـ <strong>${companyName}</strong>.</div>
            <div class="stamp">ختم الحسابات</div>
          </div>
        </td>
      </tr>
    </tfoot>
  </table>

  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
        window.onafterprint = function() {
          window.close();
        };
      }, 500);
    };
  </script>
</body>
</html>
    `);
    printWindow.document.close();
  };

  const handleOpenDetails = (customer: Customer) => {
    setCustomerForDetails(customer);
    setShowCustomerDetailsModal(true);
  };

  if (selectedCustomerForView) {
    const c = selectedCustomerForView;
    const totalSales = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = customerInvoices.reduce((sum, inv) => sum + inv.paid, 0);
    const totalDebt = Math.max(0, totalSales - totalPaid);
    const creditUsagePercent = c.creditLimit > 0 ? Math.min(100, Math.round((totalDebt / c.creditLimit) * 100)) : 0;

    return (
      <div className="space-y-6 pb-20 lg:pb-0 text-right animate-fade-in" dir="rtl">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedCustomerForView(null)}
              className="p-2 hover:bg-[var(--border-color)]/50 text-[var(--text-primary)] rounded-xl transition-colors cursor-pointer"
              title="رجوع للقائمة"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">{c.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  c.type === 'Pharmacy' 
                    ? 'bg-emerald-500/10 text-emerald-600' 
                    : c.type === 'Hospital' 
                    ? 'bg-indigo-500/10 text-indigo-600' 
                    : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {c.type === 'Pharmacy' ? 'صيدلية' : c.type === 'Hospital' ? 'مستشفى' : 'موزع جملة'}
                </span>
              </div>
              <p className="text-[var(--text-secondary)] mt-1 text-sm">تفاصيل كشف الحساب المالي للفواتير والأقساط</p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => exportStatementToExcel(c, customerInvoices)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel كشف الحساب</span>
            </button>
            <button 
              onClick={() => exportStatementToPDF(c, customerInvoices)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--border-color)]/30 hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] font-medium rounded-xl text-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>تصدير PDF كشف الحساب</span>
            </button>
          </div>
        </div>

        {/* Customer Quick Profile Info */}
        <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-secondary)]">معلومات الاتصال والموقع</h3>
            <div className="space-y-2 text-sm text-[var(--text-primary)]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>ولاية {c.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span className="font-mono">{c.phone}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-secondary)]">المندوب المسؤول</h3>
            <div className="space-y-2 text-sm text-[var(--text-primary)]">
              {c.representative ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-500" />
                    <strong>{c.representative.name}</strong>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">نسبة العمولة: {c.representative.commissionRate}%</div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <UserCheck className="w-4 h-4" />
                  <span>بيع مباشر (مسؤول شركة - بدون عمولات)</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] font-bold">
              <span>نسبة استخدام الائتمان:</span>
              <span className={creditUsagePercent >= 90 ? 'text-rose-500 font-extrabold' : 'text-emerald-500 font-extrabold'}>
                {creditUsagePercent}%
              </span>
            </div>
            <div className="w-full h-3 bg-[var(--border-color)]/30 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  creditUsagePercent >= 90 
                    ? 'bg-rose-500' 
                    : creditUsagePercent >= 75 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${creditUsagePercent}%` }} 
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
              <span>سقف الائتمان: {c.creditLimit.toLocaleString()} SDG</span>
              <span>المتبقي المتاح: {Math.max(0, c.creditLimit - totalDebt).toLocaleString()} SDG</span>
            </div>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/10 flex justify-between items-center">
            <div>
              <span className="text-xs text-[var(--text-secondary)] block font-semibold mb-1">إجمالي الفواتير</span>
              <h2 className="text-2xl font-black text-[var(--text-primary)] font-mono">{totalSales.toLocaleString()} <span className="text-xs">SDG</span></h2>
              <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">إجمالي المبيعات المسجلة للعميل</span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/10 flex justify-between items-center">
            <div>
              <span className="text-xs text-[var(--text-secondary)] block font-semibold mb-1">إجمالي التحصيلات</span>
              <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{totalPaid.toLocaleString()} <span className="text-xs">SDG</span></h2>
              <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">المبالغ المسددة بالفعل</span>
            </div>
          </div>

          <div className={`glass-card p-5 rounded-2xl border flex justify-between items-center ${
            totalDebt > c.creditLimit ? 'border-rose-500/30 bg-rose-500/5' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]/10'
          }`}>
            <div>
              <span className="text-xs text-[var(--text-secondary)] block font-semibold mb-1">المديونية المتبقية</span>
              <h2 className={`text-2xl font-black font-mono ${totalDebt > c.creditLimit ? 'text-rose-500' : 'text-amber-500'}`}>
                {totalDebt.toLocaleString()} <span className="text-xs">SDG</span>
              </h2>
              {totalDebt > c.creditLimit && (
                <span className="text-[10px] text-rose-500 font-bold mt-1 block flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>تجاوز سقف الائتمان!</span>
                </span>
              )}
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/10 flex justify-between items-center">
            <div>
              <span className="text-xs text-[var(--text-secondary)] block font-semibold mb-1">عدد الفواتير</span>
              <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{customerInvoices.length} <span className="text-xs">فاتورة</span></h2>
              <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">مسددة وآجلة ومسودات</span>
            </div>
          </div>
        </div>

        {/* Invoices List Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-display flex items-center gap-2 text-[var(--text-primary)]">
            <FileText className="w-5 h-5 text-emerald-500" />
            <span>كشف الفواتير المصدرة للعميل ({customerInvoices.length} فاتورة)</span>
          </h2>

          {loadingInvoices ? (
            <div className="glass-card text-center py-12 rounded-2xl text-[var(--text-secondary)] text-sm">
              جاري تحميل تفاصيل كشف الحساب...
            </div>
          ) : customerInvoices.length === 0 ? (
            <div className="glass-card text-center py-12 rounded-2xl text-[var(--text-secondary)] text-sm">
              لم تصدر أي فواتير لهذا العميل حتى الآن.
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden border border-[var(--glass-border)]">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/40 text-[var(--text-secondary)]">
                      <th className="py-3.5 px-4 font-bold">رقم الفاتورة</th>
                      <th className="py-3.5 px-4 font-bold">تاريخ الإصدار</th>
                      <th className="py-3.5 px-4 font-bold text-left">قيمة الفاتورة</th>
                      <th className="py-3.5 px-4 font-bold text-left">المسدد نقداً</th>
                      <th className="py-3.5 px-4 font-bold text-left">المتبقي الآجل</th>
                      <th className="py-3.5 px-4 font-bold">حالة الفاتورة</th>
                      <th className="py-3.5 px-4 font-bold">المندوب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]/40 text-[var(--text-primary)]">
                    {customerInvoices.map((inv) => {
                      const rem = Math.max(0, inv.total - inv.paid);
                      return (
                        <tr key={inv.id} className="hover:bg-[var(--border-color)]/10 transition-all">
                          <td className="py-3.5 px-4 font-bold font-mono text-emerald-600">{inv.id}</td>
                          <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)]">
                            {new Date(inv.createdAt).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="py-3.5 px-4 text-left font-bold font-mono">{inv.total.toLocaleString()} SDG</td>
                          <td className="py-3.5 px-4 text-left font-bold font-mono text-emerald-600">{inv.paid.toLocaleString()} SDG</td>
                          <td className="py-3.5 px-4 text-left font-bold font-mono text-amber-500">{rem.toLocaleString()} SDG</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID' 
                                ? 'bg-emerald-500/10 text-emerald-600' 
                                : inv.status === 'PARTIAL' 
                                ? 'bg-amber-500/10 text-amber-600' 
                                : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {inv.status === 'PAID' ? 'خالصة' : inv.status === 'PARTIAL' ? 'مدفوعة جزئياً' : 'آجلة'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                            {inv.representative ? inv.representative.name : 'بيع مباشر'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0 text-right" dir="rtl">
      <div className="space-y-6 animate-fade-in-slide">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">إدارة الشركاء والمناديب</h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm sm:text-base">إدارة بيانات العملاء المعتمدين، خطوط الشحن للولايات، ومناديب المبيعات والعمولات</p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {activeTab === 'customers' && (
              <button 
                onClick={() => {
                  setCustForm({ name: '', type: 'Pharmacy', state: 'الخرطوم', phone: '', creditLimit: 500000, representativeId: '' });
                  setShowAddCustomerModal(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer touch-target"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عميل جديد</span>
              </button>
            )}

            {activeTab === 'representatives' && (
              <button 
                onClick={() => {
                  setRepForm({ name: '', phone: '', commissionRate: 3.0 });
                  setShowAddRepModal(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer touch-target"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مندوب جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 border-b border-[var(--border-color)] scrollbar-none flex-nowrap" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => { setActiveTab('customers'); setSearch(''); }}
            className={`shrink-0 flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'customers' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]'
            }`}
            style={{ flexShrink: 0 }}
          >
            👥 سجل العملاء والصيدليات
          </button>
          
          <button
            onClick={() => { setActiveTab('representatives'); setSearch(''); }}
            className={`shrink-0 flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'representatives' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]'
            }`}
            style={{ flexShrink: 0 }}
          >
            💼 مناديب المبيعات والعمولات
          </button>

          <button
            onClick={() => { setActiveTab('shipping'); setSearch(''); }}
            className={`shrink-0 flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'shipping' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40 hover:text-[var(--text-primary)]'
            }`}
            style={{ flexShrink: 0 }}
          >
            🚚 شحن وتوزيع الولايات
          </button>
        </div>

        {/* Global Filter Bar */}
        <div className="glass-card flex flex-col md:flex-row items-center gap-4 px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-3 w-full md:border-l md:border-[var(--border-color)] md:pl-4">
            <Search className="w-5 h-5 text-[var(--text-secondary)]" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'representatives' ? "ابحث باسم المندوب أو رقم الهاتف..." : "ابحث بالاسم، الولاية، أو رقم الهاتف..."}
              className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-right"
              dir="rtl"
            />
          </div>
          
          {activeTab === 'customers' && (
            <div className="w-full md:w-64 text-right">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-transparent text-sm w-full outline-none text-[var(--text-primary)] cursor-pointer pr-2"
                dir="rtl"
              >
                <option value="" className="bg-[var(--bg-secondary)]">كل الولايات السودانية</option>
                {sudanStates.map((s, idx) => (
                  <option key={idx} value={s} className="bg-[var(--bg-secondary)]">ولاية {s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: CUSTOMERS VIEW */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-secondary)]/10 p-3 rounded-2xl border border-[var(--border-color)]/30">
              <h2 className="text-lg font-bold font-display flex items-center gap-2 text-[var(--text-primary)]">
                <Users className="w-5 h-5 text-emerald-500" />
                <span>سجل العملاء المعتمدين ({filteredCustomers.length} عميل)</span>
              </h2>

              {filteredCustomers.length > 0 && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => exportToExcel(filteredCustomers)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير Excel</span>
                  </button>
                  <button 
                    onClick={() => exportToCSV(filteredCustomers, 'customers_list')}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 bg-[var(--border-color)]/30 hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير CSV</span>
                  </button>
                </div>
              )}
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="glass-card text-center py-12 rounded-2xl text-[var(--text-secondary)] text-sm">
                لم يتم العثور على أي عملاء مسجلين.
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden border border-[var(--glass-border)] hover:border-emerald-500/20 transition-all shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/40 text-[var(--text-secondary)]">
                        <th className="py-3.5 px-4 font-bold">الاسم والمنشأة</th>
                        <th className="py-3.5 px-4 font-bold">النوع</th>
                        <th className="py-3.5 px-4 font-bold">الولاية الجغرافية</th>
                        <th className="py-3.5 px-4 font-bold">رقم الهاتف</th>
                        <th className="py-3.5 px-4 font-bold">المندوب الافتراضي</th>
                        <th className="py-3.5 px-4 font-bold text-left">سقف الائتمان</th>
                        <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]/40">
                      {paginatedCustomers.map((c) => (
                        <tr 
                          key={c.id} 
                          onClick={() => setSelectedCustomerForView(c)}
                          className="hover:bg-[var(--border-color)]/10 cursor-pointer text-[var(--text-primary)] transition-all group"
                        >
                          <td className="py-3.5 px-4 font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors">
                            {c.name}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.type === 'Pharmacy' 
                                ? 'bg-emerald-500/10 text-emerald-600' 
                                : c.type === 'Hospital' 
                                ? 'bg-indigo-500/10 text-indigo-600' 
                                : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {c.type === 'Pharmacy' ? 'صيدلية' : c.type === 'Hospital' ? 'مستشفى' : 'موزع جملة'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                              <span>ولاية {c.state}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)]">{c.phone}</td>
                          <td className="py-3.5 px-4">
                            {c.representative ? (
                              <span className="text-indigo-600 font-bold">
                                {c.representative.name}
                              </span>
                            ) : (
                              <span className="text-[var(--text-secondary)]">بيع مباشر</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold font-mono text-left text-emerald-600">
                            {c.creditLimit.toLocaleString()} SDG
                          </td>
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center gap-1.5">
                              <button 
                                onClick={() => handleEditCustomerClick(c)}
                                className="p-1.5 bg-[var(--border-color)]/30 hover:bg-emerald-500 hover:text-white rounded-lg text-[var(--text-secondary)] transition-all cursor-pointer"
                                title="تعديل العميل"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-3 bg-[var(--bg-secondary)]/20 border-t border-[var(--border-color)]/30 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)]">سجلات لكل صفحة:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-2 py-1 outline-none cursor-pointer"
                    >
                      {[5, 10, 20, 50, 100].map((size) => (
                        <option key={size} value={size}>
                          {size} سجل
                        </option>
                      ))}
                    </select>
                    <span className="text-[var(--text-secondary)] mr-2">
                      عرض {startRecord} - {endRecord} من إجمالي {totalRecords} عميل
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-color)]/40 disabled:opacity-40 disabled:hover:bg-transparent text-[var(--text-primary)] font-bold transition-all cursor-pointer"
                    >
                      السابق
                    </button>
                    <span className="text-[var(--text-primary)] font-semibold px-2">
                      صفحة {currentPage} من {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-color)]/40 disabled:opacity-40 disabled:hover:bg-transparent text-[var(--text-primary)] font-bold transition-all cursor-pointer"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REPRESENTATIVES VIEW */}
        {activeTab === 'representatives' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-display flex items-center gap-2 text-[var(--text-primary)]">
              <UserCog className="w-5 h-5 text-emerald-500" />
              <span>إدارة مناديب المبيعات والعمولات</span>
            </h2>

            {filteredReps.length === 0 ? (
              <div className="glass-card text-center py-12 rounded-2xl text-[var(--text-secondary)] text-sm">
                لم يتم العثور على أي مناديب مبيعات مسجلين.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReps.map((r) => (
                  <div key={r.id} className={`glass-card p-5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-lg relative group ${
                    r.isActive ? 'border-emerald-500/25' : 'border-rose-500/10 opacity-70'
                  }`}>
                    
                    {/* Header Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-bold text-[var(--text-primary)]">{r.name}</h3>
                          <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {r.isActive ? 'نشط ومصرح له' : 'معطل وموقوف'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-xl">
                          <Percent className="w-3.5 h-3.5" />
                          <strong className="text-sm font-black font-mono">{r.commissionRate}%</strong>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>رقم الاتصال:</span>
                        <strong className="text-[var(--text-primary)] font-mono">{r.phone}</strong>
                      </div>
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="pt-4 mt-4 border-t border-[var(--border-color)]/70 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleRepActive(r)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          r.isActive 
                            ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white' 
                            : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {r.isActive ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            <span>تعطيل</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            <span>تنشيط</span>
                          </>
                        )}
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditRepClick(r)}
                          className="p-2 bg-[var(--border-color)]/30 hover:bg-emerald-500 hover:text-white rounded-lg text-[var(--text-secondary)] transition-all cursor-pointer"
                          title="تعديل المندوب"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteRep(r.id, r.name)}
                          className="p-2 bg-[var(--border-color)]/30 hover:bg-rose-500 hover:text-white rounded-lg text-rose-500 transition-all cursor-pointer"
                          title="حذف المندوب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SHIPPING VIEW */}
        {activeTab === 'shipping' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-display flex items-center gap-2 text-[var(--text-primary)]">
              <Truck className="w-5 h-5 text-teal-500" />
              <span>أوامر شحن الولايات</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliveryOrders.map((d) => (
                <div key={d.id} className="glass-card p-4 rounded-2xl border border-[var(--glass-border)] space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-mono text-[var(--text-secondary)]">{d.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.status === 'DELIVERED' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : d.status === 'SHIPPED' 
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {d.status === 'DELIVERED' ? 'تم التسليم' : d.status === 'SHIPPED' ? 'في الطريق' : 'جاري التحضير'}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-[var(--text-primary)]">{d.customerName}</div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
                    <div>الوجهة: <strong>{d.state} - {d.city}</strong></div>
                    <div>السائق: <strong>{d.driverName}</strong></div>
                    <div className="col-span-2 text-[10px] text-[var(--text-secondary)] mt-1">تاريخ الإرسال: {d.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ==========================================
          ADD/EDIT CUSTOMER MODALS
          ========================================== */}
      {(showAddCustomerModal || showEditCustomerModal) && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-customer max-w-md" dir="rtl">
            <div className="modal-glow-back" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {showAddCustomerModal ? 'إضافة عميل معتمد جديد' : 'تعديل بيانات العميل'}
            </h3>
            
            <form onSubmit={showAddCustomerModal ? handleAddCustomerSubmit : handleEditCustomerSubmit} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">اسم الجهة (الصيدلية / المستشفى / الموزع)</label>
                <input 
                  type="text" 
                  required
                  value={custForm.name}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  placeholder="اسم الصيدلية أو المستودع المعتمد"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">نوع العميل</label>
                  <select 
                    value={custForm.type}
                    onChange={(e) => setCustForm({ ...custForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  >
                    <option value="Pharmacy">صيدلية (Pharmacy)</option>
                    <option value="Hospital">مستشفى (Hospital)</option>
                    <option value="Distributor">موزع جملة (Distributor)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">الولاية الجغرافية</label>
                  <select 
                    value={custForm.state}
                    onChange={(e) => setCustForm({ ...custForm, state: e.target.value })}
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
                    value={custForm.phone}
                    onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                    placeholder="رقم الهاتف الفريد"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">سقف الائتمان (SDG)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={custForm.creditLimit}
                    onChange={(e) => setCustForm({ ...custForm, creditLimit: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              {/* Default representative selection */}
              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                  <span>المندوب الافتراضي للعميل (تلقائي للفواتير)</span>
                </label>
                <select 
                  value={custForm.representativeId}
                  onChange={(e) => setCustForm({ ...custForm, representativeId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                >
                  <option value="">بيع مباشر (مسؤول شركة - بدون عمولة)</option>
                  {activeRepresentatives.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (عمولة {r.commissionRate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-start gap-2.5 pt-3">
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                >
                  {showAddCustomerModal ? 'تسجيل العميل' : 'حفظ التعديلات'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setShowEditCustomerModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="px-5 py-2.5 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-bold cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          ADD/EDIT REPRESENTATIVE MODALS
          ========================================== */}
      {(showAddRepModal || showEditRepModal) && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-customer max-w-md" dir="rtl">
            <div className="modal-glow-back" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              {showAddRepModal ? 'إضافة مندوب مبيعات جديد' : 'تعديل بيانات المندوب'}
            </h3>
            
            <form onSubmit={showAddRepModal ? handleAddRepSubmit : handleEditRepSubmit} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="block text-[var(--text-secondary)] font-medium">اسم المندوب ثلاثي</label>
                <input 
                  type="text" 
                  required
                  value={repForm.name}
                  onChange={(e) => setRepForm({ ...repForm, name: e.target.value })}
                  placeholder="الاسم الكامل للمندوب"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">رقم الهاتف</label>
                  <input 
                    type="text" 
                    required
                    value={repForm.phone}
                    onChange={(e) => setRepForm({ ...repForm, phone: e.target.value })}
                    placeholder="رقم الجوال الخاص بالمندوب"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[var(--text-secondary)] font-medium">نسبة العمولة (%)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    max={100}
                    step={0.1}
                    value={repForm.commissionRate}
                    onChange={(e) => setRepForm({ ...repForm, commissionRate: Number(e.target.value) })}
                    placeholder="نسبة العمولة من التحصيل"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-start gap-2.5 pt-3">
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                >
                  {showAddRepModal ? 'تسجيل المندوب' : 'حفظ التعديلات'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddRepModal(false);
                    setShowEditRepModal(false);
                    setSelectedRep(null);
                  }}
                  className="px-5 py-2.5 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-bold cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==========================================
          CUSTOMER DETAILS MODAL
          ========================================== */}
      {showCustomerDetailsModal && customerForDetails && (
        <div className="modal-overlay">
          <div className="modal-content-card modal-customer max-w-lg relative" dir="rtl">
            <div className="modal-glow-back" />
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  customerForDetails.type === 'Pharmacy' 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : customerForDetails.type === 'Hospital' 
                    ? 'bg-indigo-500/10 text-indigo-500' 
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {customerForDetails.type === 'Pharmacy' ? 'صيدلية' : customerForDetails.type === 'Hospital' ? 'مستشفى' : 'موزع جملة'}
                </span>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-2">{customerForDetails.name}</h3>
              </div>
              <button 
                onClick={() => {
                  setShowCustomerDetailsModal(false);
                  setCustomerForDetails(null);
                }}
                className="p-2 hover:bg-[var(--border-color)]/30 rounded-xl text-[var(--text-secondary)] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-6 text-sm text-[var(--text-primary)]">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--border-color)]/10 p-4 rounded-xl space-y-1">
                  <span className="text-xs text-[var(--text-secondary)] block">الولاية الجغرافية</span>
                  <strong className="text-base font-bold flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>ولاية {customerForDetails.state}</span>
                  </strong>
                </div>

                <div className="bg-[var(--border-color)]/10 p-4 rounded-xl space-y-1">
                  <span className="text-xs text-[var(--text-secondary)] block">رقم الهاتف للاتصال</span>
                  <strong className="text-base font-bold font-mono flex items-center gap-1">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>{customerForDetails.phone}</span>
                  </strong>
                </div>
              </div>

              {/* Credit Limit & Profile */}
              <div className="bg-[var(--border-color)]/10 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">سقف الائتمان المعتمد</span>
                  <strong className="text-lg font-bold font-mono text-emerald-500">
                    {customerForDetails.creditLimit.toLocaleString()} SDG
                  </strong>
                </div>

                {/* Simulated Credit Usage */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                    <span>الائتمان المستخدم (تقديري)</span>
                    <span>سقف الائتمان المتبقي</span>
                  </div>
                  <div className="w-full h-2.5 bg-[var(--border-color)]/30 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '40%' }} />
                  </div>
                  <div className="flex justify-between text-xs font-semibold mt-1">
                    <span className="text-amber-500">40% من السقف</span>
                    <span className="text-[var(--text-secondary)]">60% متاح</span>
                  </div>
                </div>
              </div>

              {/* Representative details */}
              <div className="bg-[var(--border-color)]/10 p-5 rounded-2xl space-y-3">
                <h4 className="font-bold flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <Briefcase className="w-4 h-4 text-emerald-500" />
                  <span>تفاصيل المندوب والعمولات</span>
                </h4>
                {customerForDetails.representative ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">اسم المندوب:</span>
                      <strong className="font-bold text-[var(--text-primary)]">{customerForDetails.representative.name}</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">رقم هاتف المندوب:</span>
                      <strong className="font-mono text-[var(--text-primary)]">{customerForDetails.representative.phone}</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">نسبة عمولته من التحصيل:</span>
                      <strong className="text-indigo-600 font-bold">{customerForDetails.representative.commissionRate}%</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-[var(--text-secondary)] font-medium text-xs">
                    هذا العميل يتعامل بنظام البيع المباشر (مسؤول شركة - بدون عمولات مناديب).
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[var(--border-color)]/40">
              <button 
                onClick={() => {
                  setShowCustomerDetailsModal(false);
                  handleEditCustomerClick(customerForDetails);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>تعديل البيانات</span>
              </button>
              <button 
                onClick={() => {
                  setShowCustomerDetailsModal(false);
                  setCustomerForDetails(null);
                }}
                className="px-5 py-2.5 bg-[var(--border-color)] hover:bg-[var(--border-color)]/70 text-[var(--text-primary)] rounded-xl font-bold cursor-pointer transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
