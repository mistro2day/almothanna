import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      include: { supplier: true },
      orderBy: { name: 'asc' },
    });
  }

  async search(query: string) {
    if (!query || query.trim().length === 0) return [];
    const trimmed = query.trim();
    return this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { scientificName: { contains: trimmed, mode: 'insensitive' } },
          { barcode: { contains: trimmed } },
        ],
      },
      include: { supplier: true },
      take: 10,
    });
  }

  async create(data: { name: string; scientificName?: string; barcode?: string; category?: string; unit: string; supplierId?: string }) {
    return this.prisma.product.create({
      data,
      include: { supplier: true },
    });
  }
}
