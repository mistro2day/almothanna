import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesReport(startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const sales = await this.prisma.sale.findMany({
      where: {
        ...dateFilter,
        status: { not: 'CANCELLED' },
      },
      include: {
        customer: true,
        representative: true,
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    const statusCounts = {
      PAID: 0,
      PARTIAL: 0,
      PENDING: 0,
    };

    // Sales by product/item (التقارير حسب الصنف)
    const productSalesMap: Record<string, {
      productId: string;
      productName: string;
      scientificName: string;
      category: string;
      qtySold: number;
      revenue: number;
      cost: number;
      profit: number;
    }> = {};

    // Representatives sales & commission map
    const representativesSalesMap: Record<string, {
      id: string;
      name: string;
      phone: string;
      commissionRate: number;
      totalSales: number;
      totalPaid: number;
      totalCommission: number;
      salesCount: number;
    }> = {};

    let totalRepresentativeCommissions = 0;

    for (const sale of sales) {
      totalRevenue += sale.total;
      totalPaid += sale.paid;
      totalUnpaid += Math.max(0, sale.total - sale.paid);

      if (sale.status in statusCounts) {
        statusCounts[sale.status as keyof typeof statusCounts]++;
      }

      for (const item of sale.items) {
        const itemCostPrice = item.batch?.costPrice ?? 0;
        const itemRevenue = item.qty * item.price;
        const itemCost = item.qty * itemCostPrice;
        const itemProfit = itemRevenue - itemCost;

        totalCost += itemCost;

        const pid = item.productId;
        if (!productSalesMap[pid]) {
          productSalesMap[pid] = {
            productId: pid,
            productName: item.product.name,
            scientificName: item.product.scientificName ?? '',
            category: item.product.category ?? 'عام',
            qtySold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
        }

        productSalesMap[pid].qtySold += item.qty;
        productSalesMap[pid].revenue += itemRevenue;
        productSalesMap[pid].cost += itemCost;
        productSalesMap[pid].profit += itemProfit;
      }

      // Populate representative report
      if (sale.representative) {
        const rep = sale.representative;
        if (!representativesSalesMap[rep.id]) {
          representativesSalesMap[rep.id] = {
            id: rep.id,
            name: rep.name,
            phone: rep.phone,
            commissionRate: rep.commissionRate,
            totalSales: 0,
            totalPaid: 0,
            totalCommission: 0,
            salesCount: 0,
          };
        }
        representativesSalesMap[rep.id].totalSales += sale.total;
        representativesSalesMap[rep.id].totalPaid += sale.paid;
        const commissionForThisSale = (sale.paid * rep.commissionRate) / 100;
        representativesSalesMap[rep.id].totalCommission += commissionForThisSale;
        representativesSalesMap[rep.id].salesCount += 1;
        totalRepresentativeCommissions += commissionForThisSale;
      }
    }

    const totalProfit = totalRevenue - totalCost;
    const itemsSalesReport = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);
    const representativesSalesReport = Object.values(representativesSalesMap).map(rep => ({
      ...rep,
      totalSales: Math.round(rep.totalSales),
      totalPaid: Math.round(rep.totalPaid),
      totalCommission: Math.round(rep.totalCommission),
    })).sort((a, b) => b.totalSales - a.totalSales);

    // Monthly trends for chart
    const monthlyMap: Record<string, { month: string; sales: number; profit: number }> = {};
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    for (const sale of sales) {
      const d = new Date(sale.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: label, sales: 0, profit: 0 };
      }

      monthlyMap[key].sales += sale.total;
      
      for (const item of sale.items) {
        const cost = item.qty * (item.batch?.costPrice ?? 0);
        const revenue = item.qty * item.price;
        monthlyMap[key].profit += (revenue - cost);
      }
    }

    const monthlyTrends = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        name: v.month,
        sales: Math.round(v.sales),
        profit: Math.round(v.profit),
      }));

    return {
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalCost: Math.round(totalCost),
        totalProfit: Math.round(totalProfit),
        totalPaid: Math.round(totalPaid),
        totalUnpaid: Math.round(totalUnpaid),
        profitMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0,
        invoiceCount: sales.length,
        totalRepresentativeCommissions: Math.round(totalRepresentativeCommissions),
      },
      statusDistribution: [
        { name: 'مدفوعة بالكامل', value: statusCounts.PAID, color: '#10b981' },
        { name: 'مدفوعة جزئياً', value: statusCounts.PARTIAL, color: '#f59e0b' },
        { name: 'معلقة', value: statusCounts.PENDING, color: '#ef4444' },
      ],
      itemsSalesReport,
      monthlyTrends,
      representativesSalesReport,
    };
  }

  async getInventoryReport() {
    const products = await this.prisma.product.findMany({
      include: {
        batches: {
          orderBy: { expiryDate: 'asc' },
        },
      },
    });

    let totalStockValueCost = 0;
    let totalItemsInStock = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    
    const today = new Date();
    const threeMonthsAgo = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    const nearExpiryBatchesList: any[] = [];
    const expiredBatchesList: any[] = [];
    const categoryDistributionMap: Record<string, { category: string; qty: number; value: number }> = {};

    for (const p of products) {
      let productTotalQty = 0;

      for (const batch of p.batches) {
        productTotalQty += batch.qty;
        const batchValueCost = batch.qty * batch.costPrice;
        totalStockValueCost += batchValueCost;

        const expiryDate = new Date(batch.expiryDate);

        // Check if expired or near expiry
        if (expiryDate <= today) {
          expiredBatchesList.push({
            id: batch.id,
            batchNumber: batch.batchNumber,
            productName: p.name,
            qty: batch.qty,
            costPrice: batch.costPrice,
            expiryDate: batch.expiryDate.toISOString().split('T')[0],
          });
        } else if (expiryDate <= threeMonthsFromNow) {
          nearExpiryBatchesList.push({
            id: batch.id,
            batchNumber: batch.batchNumber,
            productName: p.name,
            qty: batch.qty,
            costPrice: batch.costPrice,
            expiryDate: batch.expiryDate.toISOString().split('T')[0],
            daysRemaining: Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
          });
        }

        const cat = p.category ?? 'عام';
        if (!categoryDistributionMap[cat]) {
          categoryDistributionMap[cat] = { category: cat, qty: 0, value: 0 };
        }
        categoryDistributionMap[cat].qty += batch.qty;
        categoryDistributionMap[cat].value += batchValueCost;
      }

      totalItemsInStock += productTotalQty;

      if (productTotalQty === 0) {
        outOfStockCount++;
      } else if (productTotalQty < 50) {
        lowStockCount++;
      }
    }

    const categoryDistribution = Object.values(categoryDistributionMap)
      .map((c, i) => ({
        ...c,
        value: Math.round(c.value),
        color: ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'][i % 7],
      }));

    // Fetch last 15 stock movements for reference
    const recentMovements = await this.prisma.stockMovement.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: {
        batch: {
          include: {
            product: true,
          },
        },
      },
    });

    const movementsReport = recentMovements.map(m => ({
      id: m.id,
      productName: m.batch.product.name,
      batchNumber: m.batch.batchNumber,
      type: m.type === 'IN' ? 'وارد' : 'صادر',
      typeCode: m.type,
      qty: m.qty,
      reason: m.reason,
      date: m.createdAt.toISOString().split('T')[0],
    }));

    return {
      summary: {
        totalStockValueCost: Math.round(totalStockValueCost),
        totalItemsInStock,
        totalProductsCount: products.length,
        outOfStockCount,
        lowStockCount,
        nearExpiryCount: nearExpiryBatchesList.length,
        expiredCount: expiredBatchesList.length,
      },
      categoryDistribution,
      nearExpiryBatches: nearExpiryBatchesList.slice(0, 15),
      expiredBatches: expiredBatchesList.slice(0, 15),
      movements: movementsReport,
    };
  }

  async getSupplierReport(startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const suppliers = await this.prisma.supplier.findMany({
      include: {
        purchaseOrders: {
          where: dateFilter,
        },
        payments: {
          where: startDate || endDate ? {
            paidAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            }
          } : {},
        },
      },
    });

    let grandTotalPurchases = 0;
    let grandTotalPaid = 0;
    let grandTotalDebt = 0;

    const suppliersReport = suppliers.map((sup) => {
      const totalPurchases = sup.purchaseOrders.reduce((sum, po) => sum + po.total, 0);
      const totalPaid = sup.payments.reduce((sum, pay) => sum + pay.amount, 0);
      const remainingDebt = Math.max(0, totalPurchases - totalPaid);

      grandTotalPurchases += totalPurchases;
      grandTotalPaid += totalPaid;
      grandTotalDebt += remainingDebt;

      return {
        id: sup.id,
        name: sup.name,
        companyName: sup.companyName ?? '-',
        type: sup.type === 'pharma_company' ? 'شركة أدوية' : sup.type === 'wholesaler' ? 'تاجر جملة' : 'مصنع',
        phone: sup.phone,
        totalPurchases: Math.round(totalPurchases),
        totalPaid: Math.round(totalPaid),
        remainingDebt: Math.round(remainingDebt),
        orderCount: sup.purchaseOrders.length,
        notes: sup.notes ?? '',
      };
    }).sort((a, b) => b.totalPurchases - a.totalPurchases);

    return {
      summary: {
        grandTotalPurchases: Math.round(grandTotalPurchases),
        grandTotalPaid: Math.round(grandTotalPaid),
        grandTotalDebt: Math.round(grandTotalDebt),
        supplierCount: suppliers.length,
      },
      suppliers: suppliersReport,
    };
  }

  async getCustomerReport(startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const customers = await this.prisma.customer.findMany({
      include: {
        sales: {
          where: {
            ...dateFilter,
            status: { not: 'CANCELLED' },
          },
        },
      },
    });

    let grandTotalSales = 0;
    let grandTotalPaid = 0;
    let grandTotalDebt = 0;

    const customersReport = customers.map((c) => {
      const totalSales = c.sales.reduce((sum, s) => sum + s.total, 0);
      const totalPaid = c.sales.reduce((sum, s) => sum + s.paid, 0);
      const remainingDebt = Math.max(0, totalSales - totalPaid);

      grandTotalSales += totalSales;
      grandTotalPaid += totalPaid;
      grandTotalDebt += remainingDebt;

      const creditUsagePercent = c.creditLimit > 0 ? Math.round((remainingDebt / c.creditLimit) * 100) : 0;

      return {
        id: c.id,
        name: c.name,
        type: c.type === 'Pharmacy' ? 'صيدلية' : c.type === 'Hospital' ? 'مستشفى' : 'موزع',
        state: c.state,
        phone: c.phone,
        totalSales: Math.round(totalSales),
        totalPaid: Math.round(totalPaid),
        remainingDebt: Math.round(remainingDebt),
        creditLimit: Math.round(c.creditLimit),
        creditUsagePercent,
        invoiceCount: c.sales.length,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    // Distribution of sales by state (الولايات الأكثر شراءً)
    const stateSalesMap: Record<string, { name: string; sales: number; customers: number }> = {};
    for (const c of customersReport) {
      const st = c.state || 'غير محدد';
      if (!stateSalesMap[st]) {
        stateSalesMap[st] = { name: st, sales: 0, customers: 0 };
      }
      stateSalesMap[st].sales += c.totalSales;
      stateSalesMap[st].customers += 1;
    }

    const stateSales = Object.values(stateSalesMap)
      .sort((a, b) => b.sales - a.sales)
      .map((s, i) => ({
        ...s,
        color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5],
      }));

    return {
      summary: {
        grandTotalSales: Math.round(grandTotalSales),
        grandTotalPaid: Math.round(grandTotalPaid),
        grandTotalDebt: Math.round(grandTotalDebt),
        customerCount: customers.length,
      },
      customers: customersReport,
      stateSales,
    };
  }

  async getShippingReport(startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const deliveryOrders = await this.prisma.deliveryOrder.findMany({
      where: dateFilter,
      include: {
        sale: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const statusCounts = {
      PENDING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    const stateDistributionMap: Record<string, { state: string; count: number }> = {};

    for (const order of deliveryOrders) {
      if (order.status in statusCounts) {
        statusCounts[order.status as keyof typeof statusCounts]++;
      }

      const st = order.state || 'غير محدد';
      if (!stateDistributionMap[st]) {
        stateDistributionMap[st] = { state: st, count: 0 };
      }
      stateDistributionMap[st].count++;
    }

    const stateDistribution = Object.values(stateDistributionMap)
      .sort((a, b) => b.count - a.count)
      .map((st, i) => ({
        ...st,
        color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5],
      }));

    const statusReport = [
      { name: 'قيد الانتظار', value: statusCounts.PENDING, color: '#f59e0b', code: 'PENDING' },
      { name: 'تم الشحن', value: statusCounts.SHIPPED, color: '#3b82f6', code: 'SHIPPED' },
      { name: 'تم التوصيل', value: statusCounts.DELIVERED, color: '#10b981', code: 'DELIVERED' },
      { name: 'ملغي', value: statusCounts.CANCELLED, color: '#ef4444', code: 'CANCELLED' },
    ];

    const ordersList = deliveryOrders.map(order => ({
      id: order.id,
      invoiceId: order.saleId,
      customerName: order.sale.customer.name,
      state: order.state,
      city: order.city,
      status: order.status === 'DELIVERED' ? 'تم التوصيل' : order.status === 'SHIPPED' ? 'تم الشحن' : order.status === 'PENDING' ? 'قيد الانتظار' : 'ملغي',
      statusCode: order.status,
      driverName: order.driverName ?? 'لم يحدد',
      date: order.createdAt.toISOString().split('T')[0],
    }));

    return {
      summary: {
        totalOrders: deliveryOrders.length,
        pendingCount: statusCounts.PENDING,
        shippedCount: statusCounts.SHIPPED,
        deliveredCount: statusCounts.DELIVERED,
        cancelledCount: statusCounts.CANCELLED,
      },
      statusDistribution: statusReport,
      stateDistribution,
      orders: ordersList,
    };
  }
}
