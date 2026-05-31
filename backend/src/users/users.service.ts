import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    role: Role;
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          { email: data.email ? data.email : undefined },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException('رقم الهاتف أو البريد الإلكتروني مسجل بالفعل');
    }

    const defaultPassword = data.password || '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        password: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      role?: Role;
      password?: string;
    },
  ) {
    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async delete(id: string) {
    // Prevent self-deletion if we checked in controller, but simple delete here
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
