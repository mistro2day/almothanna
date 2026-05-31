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
      if (item.qty > batch.qty) {
        throw new BadRequestException(`Not enough stock in batch ${batch.batchNumber}`);
      }
    });

    const status = dto.paid >= dto.total ? 'PAID' : dto.paid > 0 ? 'PARTIAL' : 'PENDING';
    const invoiceNumber = await this.generateInvoiceNumber();

    const saleCreate = this.prisma.sale.create({
      data: {
        id: invoiceNumber,
        customerId: dto.customerId,
        total: dto.total,
        paid: dto.paid,
        status,
        createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            batchId: item.batchId,
            qty: item.qty,
            price: item.price,
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
      },
    });

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

    const [sale] = await this.prisma.$transaction([
      saleCreate,
      ...batchUpdates,
      ...stockMovements,
    ]);

    return {
      id: sale.id,
      customerName: sale.customer.name,
      total: sale.total,
      paid: sale.paid,
      status: sale.status,
      createdAt: sale.createdAt.toISOString(),
      items: sale.items.map((item) => ({
        productName: item.product.name,
        batchNumber: item.batch.batchNumber,
        qty: item.qty,
        price: item.price,
      })),
    };
  }

  async listSales() {
    const sales = await this.prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
      },
    });

    return sales.map((sale) => {
      // For old invoices with UUID ids, generate a display id
      const displayId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sale.id)
        ? `IN-${String(sale.createdAt.getTime().toString().slice(-5))}`
        : sale.id;

      return {
        id: displayId,
        customerName: sale.customer.name,
        total: sale.total,
        paid: sale.paid,
        status: sale.status,
        createdAt: sale.createdAt.toISOString(),
        items: sale.items.map((item) => ({
          productName: item.product.name,
          batchNumber: item.batch.batchNumber,
          qty: item.qty,
          price: item.price,
        })),
      };
    });
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
}