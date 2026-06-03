import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FundTransactionType, FundSource, PaymentMethod } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // Categories Management
  // ==========================================
  async createCategory(name: string) {
    return this.prisma.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  async listCategories() {
    return this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.expenseCategory.delete({
      where: { id },
    });
  }

  // ==========================================
  // Expenses Management
  // ==========================================
  // ==========================================
  // Expenses Management
  // ==========================================
  async createExpense(data: {
    amount: number;
    description?: string;
    date?: string;
    categoryId: string;
    userId?: string;
    documentNumber?: string;
    paymentMethod?: PaymentMethod;
  }) {
    const expenseDate = data.date ? new Date(data.date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Expense
      const expense = await tx.expense.create({
        data: {
          amount: data.amount,
          description: data.description,
          date: expenseDate,
          categoryId: data.categoryId,
          userId: data.userId,
          documentNumber: data.documentNumber,
          paymentMethod: data.paymentMethod ?? PaymentMethod.CASH,
        },
        include: {
          category: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      // Check if we should link this to the fund
      const settings = await tx.companySettings.findFirst();
      if (!settings || settings.linkExpensesToFund) {
        // 2. Add OUTFLOW to Fund
        const count = await tx.fundTransaction.count();
        const yearSuffix = new Date().getFullYear().toString().slice(-2);
        const code = `SF${yearSuffix}${String(count + 1).padStart(6, '0')}`;

        await tx.fundTransaction.create({
          data: {
            transactionCode: code,
            amount: data.amount,
            type: FundTransactionType.OUTFLOW,
            source: FundSource.EXPENSE,
            paymentMethod: data.paymentMethod ?? PaymentMethod.CASH,
            documentNumber: data.documentNumber,
            description: data.description || `صرف مصروفات: ${expense.category.name}`,
            date: expenseDate,
            expenseId: expense.id,
            userId: data.userId,
          },
        });
      }

      return expense;
    });
  }

  async listExpenses(filters?: { startDate?: string; endDate?: string; categoryId?: string }) {
    const whereClause: any = {};

    if (filters?.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.date = {};
      if (filters.startDate) {
        whereClause.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    return this.prisma.expense.findMany({
      where: whereClause,
      include: {
        category: true,
        user: {
          select: {
            name: true,
          },
        },
        fundTransactions: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async deleteExpense(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.prisma.$transaction(async (tx) => {
      // Delete associated fund transactions
      await tx.fundTransaction.deleteMany({
        where: { expenseId: id },
      });

      // Delete the expense itself
      return tx.expense.delete({
        where: { id },
      });
    });
  }

  async updateExpense(
    id: string,
    data: {
      amount?: number;
      description?: string;
      date?: string;
      categoryId?: string;
      documentNumber?: string;
      paymentMethod?: PaymentMethod;
    },
  ) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    const updateData: any = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.documentNumber !== undefined) updateData.documentNumber = data.documentNumber;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.date) updateData.date = new Date(data.date);

    return this.prisma.$transaction(async (tx) => {
      const updatedExpense = await tx.expense.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
        },
      });

      // Update associated fund transactions if any
      const fundTx = await tx.fundTransaction.findFirst({
        where: { expenseId: id },
      });

      if (fundTx) {
        await tx.fundTransaction.update({
          where: { id: fundTx.id },
          data: {
            amount: data.amount !== undefined ? data.amount : fundTx.amount,
            description: data.description !== undefined ? data.description : fundTx.description,
            date: data.date ? new Date(data.date) : fundTx.date,
            paymentMethod: data.paymentMethod ?? fundTx.paymentMethod,
            documentNumber: data.documentNumber ?? fundTx.documentNumber,
          },
        });
      }

      return updatedExpense;
    });
  }

  // ==========================================
  // Accounting & Financial Summary (Profit & Loss)
  // ==========================================
  async getFinancialSummary(startDate?: string, endDate?: string) {
    const dateQuery: any = {};
    if (startDate || endDate) {
      if (startDate) dateQuery.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.lte = end;
      }
    }

    const saleWhere: any = {};
    const purchaseWhere: any = {};
    const expenseWhere: any = {};

    if (startDate || endDate) {
      saleWhere.createdAt = dateQuery;
      purchaseWhere.createdAt = dateQuery;
      expenseWhere.date = dateQuery;
    }

    // 1. Incomes: Sales total & paid amounts
    const sales = await this.prisma.sale.findMany({
      where: saleWhere,
      select: {
        total: true,
        paid: true,
      },
    });

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalSalesPaid = sales.reduce((sum, s) => sum + s.paid, 0);
    const totalSalesUnpaid = totalSales - totalSalesPaid;

    // 2. Outcomes: Purchase Orders total & paid amounts
    const purchases = await this.prisma.purchaseOrder.findMany({
      where: purchaseWhere,
      select: {
        total: true,
        paid: true,
      },
    });

    const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
    const totalPurchasesPaid = purchases.reduce((sum, p) => sum + p.paid, 0);

    // 3. Outcomes: Expenses total amount
    const expenses = await this.prisma.expense.findMany({
      where: expenseWhere,
      select: {
        amount: true,
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Profit & Loss calculations
    const netProfitExpected = totalSales - (totalPurchases + totalExpenses);
    const netProfitActual = totalSalesPaid - (totalPurchasesPaid + totalExpenses);

    return {
      totalSales,
      totalSalesPaid,
      totalSalesUnpaid,
      totalPurchases,
      totalPurchasesPaid,
      totalExpenses,
      netProfitExpected,
      netProfitActual,
    };
  }
}
