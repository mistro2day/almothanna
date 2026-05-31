import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.batch.findMany({
      orderBy: { expiryDate: 'asc' },
      include: {
        product: true,
      },
    });
  }

  async create(data: {
    batchNumber: string;
    productId: string;
    qty: number;
    costPrice: number;
    expiryDate: string | Date;
    manufactureDate: string | Date;
  }) {
    return this.prisma.batch.create({
      data: {
        batchNumber: data.batchNumber,
        productId: data.productId,
        qty: data.qty,
        costPrice: data.costPrice,
        expiryDate: new Date(data.expiryDate),
        manufactureDate: new Date(data.manufactureDate),
      },
      include: {
        product: true,
      },
    });
  }

  async addQty(id: string, additionalQty: number) {
    const batch = await this.prisma.batch.update({
      where: { id },
      data: {
        qty: {
          increment: additionalQty,
        },
      },
      include: {
        product: true,
      },
    });

    // Register StockMovement IN
    await this.prisma.stockMovement.create({
      data: {
        batchId: id,
        type: 'IN',
        qty: additionalQty,
        reason: 'تحديث مخزون يدوي',
      },
    });

    return batch;
  }
}

