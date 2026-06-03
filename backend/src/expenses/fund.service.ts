import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FundTransactionType, FundSource, PaymentMethod } from '@prisma/client';

@Injectable()
export class FundService {
  constructor(private readonly prisma: PrismaService) {}

  async generateTransactionCode(): Promise<string> {
    const count = await this.prisma.fundTransaction.count();
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    return `SF${yearSuffix}${String(count + 1).padStart(6, '0')}`;
  }

  async recordTransaction(data: {
    amount: number;
    type: FundTransactionType;
    source: FundSource;
    paymentMethod?: PaymentMethod;
    reference?: string;
    documentNumber?: string;
    description?: string;
    date?: string;
    saleId?: string;
    purchaseOrderId?: string;
    expenseId?: string;
    revenueId?: string;
    supplierPaymentId?: string;
    returnId?: string;
    userId?: string;
  }) {
    if (data.amount <= 0) return; // Don't record zero or negative amounts

    const code = await this.generateTransactionCode();
    const txDate = data.date ? new Date(data.date) : new Date();

    return this.prisma.fundTransaction.create({
      data: {
        transactionCode: code,
        amount: data.amount,
        type: data.type,
        source: data.source,
        paymentMethod: data.paymentMethod ?? PaymentMethod.CASH,
        reference: data.reference,
        documentNumber: data.documentNumber,
        description: data.description,
        date: txDate,
        saleId: data.saleId,
        purchaseOrderId: data.purchaseOrderId,
        expenseId: data.expenseId,
        revenueId: data.revenueId,
        supplierPaymentId: data.supplierPaymentId,
        returnId: data.returnId,
        userId: data.userId,
      },
    });
  }

  async getFundLedger(filters?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: PaymentMethod;
    source?: FundSource;
    type?: FundTransactionType;
  }) {
    const where: any = {};

    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }
    if (filters?.source) {
      where.source = filters.source;
    }
    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const transactions = await this.prisma.fundTransaction.findMany({
      where,
      include: {
        user: { select: { name: true } },
        sale: { select: { customer: { select: { name: true } } } },
        purchaseOrder: { select: { supplier: { select: { name: true } } } },
        expense: { select: { category: { select: { name: true } } } },
        revenue: { select: { category: { select: { name: true } } } },
        supplierPayment: { select: { supplier: { select: { name: true } } } },
        return: { select: { sale: { select: { customer: { select: { name: true } } } } } },
      },
      orderBy: { date: 'desc' },
    });

    return transactions.map(tx => {
      // Generate clean description based on entity relations if manual description is empty
      let displayDescription = tx.description || '';
      if (!displayDescription) {
        if (tx.source === FundSource.SALE && tx.sale) {
          displayDescription = `تحصيل مبيعات عميل: ${tx.sale.customer.name}`;
        } else if (tx.source === FundSource.PURCHASE && tx.purchaseOrder) {
          displayDescription = `سداد فاتورة مشتريات للمورد: ${tx.purchaseOrder.supplier.name}`;
        } else if (tx.source === FundSource.EXPENSE && tx.expense) {
          displayDescription = `صرف مصروفات: ${tx.expense.category.name}`;
        } else if (tx.source === FundSource.REVENUE && tx.revenue) {
          displayDescription = `تحصيل إيرادات: ${tx.revenue.category.name}`;
        } else if (tx.source === FundSource.SUPPLIER_PAYMENT && tx.supplierPayment) {
          displayDescription = `دفعة نقدية للمورد: ${tx.supplierPayment.supplier.name}`;
        } else if (tx.source === FundSource.RETURN && tx.return) {
          displayDescription = `مرتجع مبيعات عميل: ${tx.return.sale.customer.name}`;
        } else {
          displayDescription = 'عملية نقدية عامة';
        }
      }

      return {
        id: tx.id,
        transactionCode: tx.transactionCode,
        amount: tx.amount,
        type: tx.type,
        source: tx.source,
        paymentMethod: tx.paymentMethod,
        reference: tx.reference,
        documentNumber: tx.documentNumber,
        description: displayDescription,
        date: tx.date.toISOString(),
        user: tx.user?.name || 'مدير النظام',
      };
    });
  }

  async getFundSummary(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // 1. Calculate overall balance (always lifetime, ignoring date filters for final vault balance)
    const allTransactions = await this.prisma.fundTransaction.findMany({
      select: {
        amount: true,
        type: true,
      },
    });

    let currentBalance = 0;
    allTransactions.forEach(tx => {
      if (tx.type === FundTransactionType.INFLOW) {
        currentBalance += tx.amount;
      } else {
        currentBalance -= tx.amount;
      }
    });

    // 2. Calculate inflow/outflow during filtered period
    const filteredTx = await this.prisma.fundTransaction.findMany({
      where,
      select: {
        amount: true,
        type: true,
      },
    });

    let totalInflow = 0;
    let totalOutflow = 0;
    filteredTx.forEach(tx => {
      if (tx.type === FundTransactionType.INFLOW) {
        totalInflow += tx.amount;
      } else {
        totalOutflow += tx.amount;
      }
    });

    return {
      currentBalance,
      totalInflow,
      totalOutflow,
    };
  }

  async deleteManualTransaction(id: string) {
    // Only allow deleting manual transactions to preserve integrity of auto-linked ones
    const tx = await this.prisma.fundTransaction.findUnique({
      where: { id },
    });
    if (!tx) throw new Error('Transaction not found');
    if (tx.source !== FundSource.MANUAL) {
      throw new Error('لا يمكن حذف الحركات التلقائية حفاظاً على تكامل الحسابات');
    }
    return this.prisma.fundTransaction.delete({
      where: { id },
    });
  }
}
