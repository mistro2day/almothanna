import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { name: 'asc' },
      include: {
        representative: true,
      },
    });
  }

  async create(data: {
    name: string;
    type: string;
    state: string;
    phone: string;
    creditLimit?: number;
    representativeId?: string;
  }) {
    return this.prisma.customer.create({
      data: {
        name: data.name,
        type: data.type,
        state: data.state,
        phone: data.phone,
        creditLimit: data.creditLimit ?? 0,
        representativeId: data.representativeId || null,
      },
      include: {
        representative: true,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    type?: string;
    state?: string;
    phone?: string;
    creditLimit?: number;
    representativeId?: string;
  }) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        state: data.state,
        phone: data.phone,
        creditLimit: data.creditLimit,
        representativeId: data.representativeId === undefined ? undefined : (data.representativeId || null),
      },
      include: {
        representative: true,
      },
    });
  }
}
