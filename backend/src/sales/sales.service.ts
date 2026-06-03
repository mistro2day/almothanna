import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateInvoiceNumber(): Promise<string> {
    const counter = await this.prisma.invoiceCounter.upsert({
      where: { id: 1 },
      update: {
        nextVal: {
          increment: 1,
        },
      },
      create: {
        id: 1,
        nextVal: 1,
      },
    });
    const num = Number(counter.nextVal);
    return `IN-${String(num).padStart(5, '0')}`;
  }

  async createSale(dto: CreateSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Sale must include at least one item');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const batchRecords = await Promise.all(
      dto.items.map((item) =>
        this.prisma.batch.findUnique({
          where: { id: item.batchId },
        }),
      ),
    );

    dto.items.forEach((item, index) => {
      const batch = batchRecords[index];
      if (!batch) {
        throw new NotFoundException(`Batch not found: ${item.batchId}`);
      }
      if (dto.status !== 'DRAFT' && item.qty > batch.qty) {
        throw new BadRequestException(`Not enough stock in batch ${batch.batchNumber}`);
      }
    });

    const status = dto.status === 'DRAFT'
      ? 'DRAFT'
      : dto.paid >= dto.total ? 'PAID' : dto.paid > 0 ? 'PARTIAL' : 'PENDING';
    const invoiceNumber = await this.generateInvoiceNumber();

    const saleCreate = this.prisma.sale.create({
      data: {
        id: invoiceNumber,
        customerId: dto.customerId,
        total: dto.total,
        paid: dto.paid,
        status: status as any,
        representativeId: dto.representativeId || null,
        createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            batchId: item.batchId,
            qty: item.qty,
            price: item.price,
          })),
        },
        installments: dto.installments && dto.installments.length > 0 ? {
          create: dto.installments.map((inst) => ({
            dueDate: new Date(inst.dueDate),
            amount: inst.amount,
            notes: inst.notes,
            status: 'PENDING',
          })),
        } : undefined,
      },
      include: {
        customer: true,
        representative: true,
        installments: true,
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
      },
    });

    let sale;
    if (dto.status === 'DRAFT') {
      sale = await saleCreate;
    } else {
      const batchUpdates = dto.items.map((item) =>
        this.prisma.batch.update({
          where: { id: item.batchId },
          data: {
            qty: {
              decrement: item.qty,
            },
          },
        }),
      );

      const stockMovements = dto.items.map((item) =>
        this.prisma.stockMovement.create({
          data: {
            batchId: item.batchId,
            type: 'OUT',
            qty: item.qty,
            reason: 'Sale',
          },
        }),
      );

      const [createdSale] = await this.prisma.$transaction([
        saleCreate,
        ...batchUpdates,
        ...stockMovements,
      ]);
      sale = createdSale;
    }

    return {
      id: sale.id,
      customerName: sale.customer.name,
      customerId: sale.customerId,
      total: sale.total,
      paid: sale.paid,
      status: sale.status,
      createdAt: sale.createdAt.toISOString(),
      representative: sale.representative ? {
        id: sale.representative.id,
        name: sale.representative.name,
        commissionRate: sale.representative.commissionRate,
      } : null,
      items: sale.items.map((item: any) => ({
        productName: item.product.name,
        productId: item.productId,
        batchId: item.batchId,
        batchNumber: item.batch.batchNumber,
        qty: item.qty,
        price: item.price,
      })),
      installments: (sale as any).installments?.map((inst: any) => ({
        id: inst.id,
        dueDate: inst.dueDate.toISOString(),
        amount: inst.amount,
        paidAmount: inst.paidAmount,
        status: inst.status,
        notes: inst.notes,
      })) || [],
    };
  }

  async listSales() {
    const sales = await this.prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        representative: true,
        installments: true,
      },
    });

    return sales.map((sale) => {
      // For old invoices with UUID ids, generate a display id
      const displayId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sale.id)
        ? `IN-${String(sale.createdAt.getTime().toString().slice(-5))}`
        : sale.id;

      return {
        id: displayId,
        realId: sale.id,
        customerName: sale.customer.name,
        customerId: sale.customerId,
        total: sale.total,
        paid: sale.paid,
        status: sale.status,
        createdAt: sale.createdAt.toISOString(),
        representative: sale.representative ? {
          id: sale.representative.id,
          name: sale.representative.name,
          commissionRate: sale.representative.commissionRate,
        } : null,
        items: [],
        installments: (sale as any).installments?.map((inst: any) => ({
          id: inst.id,
          dueDate: inst.dueDate.toISOString(),
          amount: inst.amount,
          paidAmount: inst.paidAmount,
          status: inst.status,
          notes: inst.notes,
        })) || [],
      };
    });
  }

  async getSaleById(id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        OR: [
          { id },
        ]
      },
      include: {
        customer: true,
        representative: true,
        installments: true,
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    const displayId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sale.id)
      ? `IN-${String(sale.createdAt.getTime().toString().slice(-5))}`
      : sale.id;

    return {
      id: displayId,
      realId: sale.id,
      customerName: sale.customer.name,
      customerId: sale.customerId,
      total: sale.total,
      paid: sale.paid,
      status: sale.status,
      createdAt: sale.createdAt.toISOString(),
      representative: sale.representative ? {
        id: sale.representative.id,
        name: sale.representative.name,
        commissionRate: sale.representative.commissionRate,
      } : null,
      items: sale.items.map((item: any) => ({
        productName: item.product.name,
        productId: item.productId,
        batchId: item.batchId,
        batchNumber: item.batch.batchNumber,
        qty: item.qty,
        price: item.price,
      })),
      installments: (sale as any).installments?.map((inst: any) => ({
        id: inst.id,
        dueDate: inst.dueDate.toISOString(),
        amount: inst.amount,
        paidAmount: inst.paidAmount,
        status: inst.status,
        notes: inst.notes,
      })) || [],
    };
  }

  async deleteSale(id: string) {
    // Find the sale first with its items to restore the batches
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    // Restore batch quantities
    const batchUpdates = sale.items.map((item) =>
      this.prisma.batch.update({
        where: { id: item.batchId },
        data: {
          qty: {
            increment: item.qty,
          },
        },
      }),
    );

    // Create corrective StockMovements (IN type for cancellation)
    const stockMovements = sale.items.map((item) =>
      this.prisma.stockMovement.create({
        data: {
          batchId: item.batchId,
          type: 'IN',
          qty: item.qty,
          reason: 'Sale Cancelled',
        },
      }),
    );

    // Delete the sale (Prisma cascade delete handles SaleItems)
    const deleteSale = this.prisma.sale.delete({
      where: { id },
    });

    await this.prisma.$transaction([
      ...batchUpdates,
      ...stockMovements,
      deleteSale,
    ]);

    return { success: true };
  }

  async updateSaleDate(id: string, createdAt: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
    });
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    return this.prisma.sale.update({
      where: { id },
      data: { createdAt: new Date(createdAt) },
    });
  }

  async updateSaleAndInstallments(id: string, dto: {
    createdAt?: string;
    paid: number;
    installments?: any[];
    items?: any[];
    status?: string;
    representativeId?: string;
  }) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    const itemsProvided = !!(dto.items && dto.items.length > 0);
    const newTotal = itemsProvided && dto.items
      ? dto.items.reduce((sum, item) => sum + (item.qty * item.price), 0)
      : sale.total;

    const newPaid = dto.paid;
    const targetStatus = dto.status === 'DRAFT'
      ? 'DRAFT'
      : newPaid >= newTotal ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'PENDING';

    return this.prisma.$transaction(async (tx) => {
      // 1. Revert old stock if old sale was not a DRAFT
      if ((sale.status as any) !== 'DRAFT') {
        for (const item of sale.items) {
          await tx.batch.update({
            where: { id: item.batchId },
            data: {
              qty: {
                increment: item.qty,
              },
            },
          });
          await tx.stockMovement.create({
            data: {
              batchId: item.batchId,
              type: 'IN',
              qty: item.qty,
              reason: `Reverted for Edit: ${sale.id}`,
            },
          });
        }
      }

      // 2. Deduct new stock if new status is not a DRAFT
      if (targetStatus !== 'DRAFT') {
        const finalItems = itemsProvided && dto.items ? dto.items : sale.items;
        for (const item of finalItems) {
          const batch = await tx.batch.findUnique({
            where: { id: item.batchId },
          });
          if (!batch) {
            throw new NotFoundException(`Batch not found: ${item.batchId}`);
          }
          if (item.qty > batch.qty) {
            throw new BadRequestException(`Not enough stock in batch ${batch.batchNumber}`);
          }
          await tx.batch.update({
            where: { id: item.batchId },
            data: {
              qty: {
                decrement: item.qty,
              },
            },
          });
          await tx.stockMovement.create({
            data: {
              batchId: item.batchId,
              type: 'OUT',
              qty: item.qty,
              reason: `Sale Edit: ${sale.id}`,
            },
          });
        }
      }

      // 3. Update items in DB
      if (itemsProvided) {
        await tx.saleItem.deleteMany({
          where: { saleId: id },
        });
        await tx.saleItem.createMany({
          data: dto.items!.map((item: any) => ({
            saleId: id,
            productId: item.productId,
            batchId: item.batchId,
            qty: item.qty,
            price: item.price,
          })),
        });
      }

      // 4. Update the sale details
      const updatedSale = await tx.sale.update({
        where: { id },
        data: {
          total: newTotal,
          paid: newPaid,
          status: targetStatus as any,
          representativeId: dto.representativeId === undefined ? undefined : (dto.representativeId || null),
          createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
        },
      });

      // 5. Clear old installments
      await tx.installment.deleteMany({
        where: { saleId: id },
      });

      // 6. Insert newly scheduled installments
      if (dto.installments && dto.installments.length > 0) {
        await tx.installment.createMany({
          data: dto.installments.map((inst: any) => ({
            saleId: id,
            dueDate: new Date(inst.dueDate),
            amount: inst.amount,
            paidAmount: inst.paidAmount || 0,
            status: inst.paidAmount >= inst.amount ? 'PAID' : 'PENDING',
            notes: inst.notes,
          })),
        });
      }

      return updatedSale;
    });
  }

  async paySale(id: string, amount: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
    });
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    const newPaid = sale.paid + amount;
    const status = newPaid >= sale.total ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'PENDING';
    return this.prisma.sale.update({
      where: { id },
      data: {
        paid: newPaid,
        status,
      },
    });
  }

  async getDashboardStats() {
    // Get all sales with items for calculation
    const sales = (await this.prisma.sale.findMany({
      where: { status: { notIn: ['CANCELLED', 'DRAFT'] as any } },
      include: {
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })) as any[];

    // Build monthly sales & profit grouped by month
    const monthlyMap: Record<string, { sales: number; profit: number }> = {};
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    for (const sale of sales) {
      const d = new Date(sale.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = monthNames[d.getMonth()];

      if (!monthlyMap[key]) {
        monthlyMap[key] = { sales: 0, profit: 0 };
      }

      monthlyMap[key].sales += sale.total;

      // Calculate cost and profit per item
      for (const item of sale.items) {
        const costPrice = item.batch?.costPrice ?? 0;
        const revenue = item.qty * item.price;
        const cost = item.qty * costPrice;
        monthlyMap[key].profit += (revenue - cost);
      }

      (monthlyMap[key] as any)._label = label;
    }

    const salesChart = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // last 6 months
      .map(([, v]) => ({
        name: (v as any)._label,
        sales: Math.round(v.sales),
        profit: Math.round(v.profit),
      }));

    // Top products by quantity sold
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};

    for (const sale of sales) {
      for (const item of sale.items) {
        const pid = item.productId;
        if (!productSales[pid]) {
          productSales[pid] = { name: item.product?.name || 'Unknown', qty: 0, revenue: 0 };
        }
        productSales[pid].qty += item.qty;
        productSales[pid].revenue += item.qty * item.price;
      }
    }

    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b.qty - a.qty)
      .slice(0, 6)
      .map(([, v], i) => ({
        name: v.name,
        qty: v.qty,
        revenue: Math.round(v.revenue),
        color: ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'][i],
      }));

    // Total stats
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalCost = sales.reduce((sum, s) => {
      return sum + (s.items as any[]).reduce((c: number, item: any) => c + item.qty * (item.batch?.costPrice ?? 0), 0);
    }, 0);
    const totalProfit = totalRevenue - totalCost;

    return {
      salesChart,
      topProducts,
      totalRevenue: Math.round(totalRevenue),
      totalProfit: Math.round(totalProfit),
    };
  }

  async payInstallment(id: string, amount: number) {
    const installment = await this.prisma.installment.findUnique({
      where: { id },
      include: { sale: true },
    });
    if (!installment) {
      throw new NotFoundException('Installment not found');
    }
    const newPaidAmount = installment.paidAmount + amount;
    const remainingForInstallment = installment.amount - newPaidAmount;
    const status = remainingForInstallment <= 0 ? 'PAID' : 'PARTIAL';

    // Update the installment
    const updatedInstallment = await this.prisma.installment.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status,
      },
    });

    // Also update the parent Sale paid amount
    const sale = installment.sale;
    const newSalePaid = sale.paid + amount;
    const saleStatus = newSalePaid >= sale.total ? 'PAID' : newSalePaid > 0 ? 'PARTIAL' : 'PENDING';

    await this.prisma.sale.update({
      where: { id: sale.id },
      data: {
        paid: newSalePaid,
        status: saleStatus,
      },
    });

    return updatedInstallment;
  }

  async listInstallments() {
    const installments = await this.prisma.installment.findMany({
      include: {
        sale: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
    return installments.map((inst: any) => ({
      id: inst.id,
      saleId: inst.saleId,
      customerName: inst.sale.customer.name,
      customerPhone: inst.sale.customer.phone,
      totalAmount: inst.sale.total,
      paidAmountSale: inst.sale.paid,
      dueDate: inst.dueDate.toISOString(),
      amount: inst.amount,
      paidAmount: inst.paidAmount,
      status: inst.status,
      notes: inst.notes,
    }));
  }
}