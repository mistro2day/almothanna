import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

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

    const saleCreate = this.prisma.sale.create({
      data: {
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

    return sales.map((sale) => ({
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
    }));
  }
}
