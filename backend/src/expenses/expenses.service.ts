import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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
  async createExpense(data: { amount: number; description?: string; date?: string; categoryId: string; userId?: string }) {
    const expenseDate = data.date ? new Date(data.date) : new Date();
    return this.prisma.expense.create({
      data: {
        amount: data.amount,
        description: data.description,
        date: expenseDate,
        categoryId: data.categoryId,
        userId: data.userId,
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
        // Set to end of the day
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
      },
      orderBy: { date: 'desc' },
    });
  }

  async deleteExpense(id: string) {
    return this.prisma.expense.delete({
      where: { id },
    });
  }

  async updateExpense(id: string, data: { amount?: number; description?: string; date?: string; categoryId?: string }) {
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    return this.prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
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
