import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FundService } from './fund.service';
import { FundTransactionType, FundSource, PaymentMethod } from '@prisma/client';

@Injectable()
export class RevenuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fundService: FundService,
  ) {}

  // ==========================================
  // Categories Management
  // ==========================================
  async createCategory(name: string) {
    return this.prisma.revenueCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  async listCategories() {
    return this.prisma.revenueCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.revenueCategory.delete({
      where: { id },
    });
  }

  // ==========================================
  // Revenues Management
  // ==========================================
  async createRevenue(data: {
    amount: number;
    description?: string;
    date?: string;
    categoryId: string;
    userId?: string;
    paymentMethod?: PaymentMethod;
    reference?: string;
    documentNumber?: string;
  }) {
    const revDate = data.date ? new Date(data.date) : new Date();
    
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Revenue record
      const revenue = await tx.revenue.create({
        data: {
          amount: data.amount,
          description: data.description,
          date: revDate,
          categoryId: data.categoryId,
          userId: data.userId,
        },
        include: {
          category: true,
          user: { select: { name: true } },
        },
      });

      // 2. Add INFLOW transaction to Fund
      const count = await tx.fundTransaction.count();
      const yearSuffix = new Date().getFullYear().toString().slice(-2);
      const code = `SF${yearSuffix}${String(count + 1).padStart(6, '0')}`;

      await tx.fundTransaction.create({
        data: {
          transactionCode: code,
          amount: data.amount,
          type: FundTransactionType.INFLOW,
          source: FundSource.REVENUE,
          paymentMethod: data.paymentMethod ?? PaymentMethod.CASH,
          reference: data.reference,
          documentNumber: data.documentNumber,
          description: data.description || `إيراد مقبوض: ${revenue.category.name}`,
          date: revDate,
          revenueId: revenue.id,
          userId: data.userId,
        },
      });

      return revenue;
    });
  }

  async listRevenues(filters?: { startDate?: string; endDate?: string; categoryId?: string }) {
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

    return this.prisma.revenue.findMany({
      where: whereClause,
      include: {
        category: true,
        user: { select: { name: true } },
        fundTransactions: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async deleteRevenue(id: string) {
    const revenue = await this.prisma.revenue.findUnique({
      where: { id },
    });
    if (!revenue) throw new NotFoundException('Revenue not found');

    return this.prisma.$transaction(async (tx) => {
      // Delete associated fund transactions
      await tx.fundTransaction.deleteMany({
        where: { revenueId: id },
      });

      // Delete revenue record
      return tx.revenue.delete({
        where: { id },
      });
    });
  }

  async updateRevenue(
    id: string,
    data: {
      amount?: number;
      description?: string;
      date?: string;
      categoryId?: string;
      paymentMethod?: PaymentMethod;
      reference?: string;
      documentNumber?: string;
    },
  ) {
    const revenue = await this.prisma.revenue.findUnique({
      where: { id },
    });
    if (!revenue) throw new NotFoundException('Revenue not found');

    const updateData: any = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.date) updateData.date = new Date(data.date);

    return this.prisma.$transaction(async (tx) => {
      const updatedRevenue = await tx.revenue.update({
        where: { id },
        data: updateData,
        include: { category: true },
      });

      // Update associated fund transaction
      const fundTx = await tx.fundTransaction.findFirst({
        where: { revenueId: id },
      });

      if (fundTx) {
        await tx.fundTransaction.update({
          where: { id: fundTx.id },
          data: {
            amount: data.amount !== undefined ? data.amount : fundTx.amount,
            description: data.description !== undefined ? data.description : fundTx.description,
            date: data.date ? new Date(data.date) : fundTx.date,
            paymentMethod: data.paymentMethod ?? fundTx.paymentMethod,
            reference: data.reference ?? fundTx.reference,
            documentNumber: data.documentNumber ?? fundTx.documentNumber,
          },
        });
      }

      return updatedRevenue;
    });
  }
}
