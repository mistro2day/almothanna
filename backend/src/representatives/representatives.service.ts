import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RepresentativesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.representative.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; phone: string; commissionRate: number }) {
    // Check if phone number is already registered
    const existing = await this.prisma.representative.findUnique({
      where: { phone: data.phone },
    });
    if (existing) {
      throw new BadRequestException('رقم الهاتف مسجل بالفعل لمندوب آخر');
    }

    return this.prisma.representative.create({
      data: {
        name: data.name,
        phone: data.phone,
        commissionRate: data.commissionRate,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; phone?: string; commissionRate?: number; isActive?: boolean },
  ) {
    if (data.phone) {
      const existing = await this.prisma.representative.findUnique({
        where: { phone: data.phone },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('رقم الهاتف مسجل بالفعل لمندوب آخر');
      }
    }

    return this.prisma.representative.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    // Check if representative has associated sales or customers
    const saleCount = await this.prisma.sale.count({
      where: { representativeId: id },
    });
    const customerCount = await this.prisma.customer.count({
      where: { representativeId: id },
    });

    if (saleCount > 0 || customerCount > 0) {
      // Instead of hard deleting, set as inactive to preserve history
      return this.prisma.representative.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.representative.delete({
      where: { id },
    });
  }
}
