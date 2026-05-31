import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; scientificName?: string; barcode?: string; category?: string; unit: string }) {
    return this.prisma.product.create({
      data,
    });
  }
}
