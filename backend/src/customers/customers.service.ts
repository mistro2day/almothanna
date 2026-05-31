import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: {
    name: string;
    type: string;
    state: string;
    phone: string;
    creditLimit?: number;
  }) {
    return this.prisma.customer.create({
      data: {
        name: data.name,
        type: data.type,
        state: data.state,
        phone: data.phone,
        creditLimit: data.creditLimit ?? 0,
      },
    });
  }
}
