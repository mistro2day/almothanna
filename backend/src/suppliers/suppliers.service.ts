import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentTerms, PurchaseStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.supplier.create({
      data: {
        name: data.name,
        companyName: data.companyName,
        type: data.type,
        phone: data.phone,
        email: data.email,
        country: data.country ?? 'السودان',
        city: data.city,
        address: data.address,
        commercialReg: data.commercialReg,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        creditLimit: data.creditLimit ?? 0,
        paymentTerms: data.paymentTerms as PaymentTerms,
        currency: data.currency ?? 'SDG',
        notes: data.notes,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findAllPurchaseOrders() {
    return this.prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async createPurchaseOrder(data: any) {
    const count = await this.prisma.purchaseOrder.count();
    const orderNumber = `PO-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        total: data.total,
        paid: data.paid ?? 0,
        status: data.status as PurchaseStatus,
        notes: data.notes,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            qty: item.qty,
            unitCost: item.unitCost,
            batchNumber: item.batchNumber,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findAllPayments() {
    return this.prisma.supplierPayment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
      },
    });
  }

  async createPayment(data: any) {
    return this.prisma.supplierPayment.create({
      data: {
        supplierId: data.supplierId,
        amount: data.amount,
        paymentMethod: data.paymentMethod as PaymentMethod,
        reference: data.reference,
        notes: data.notes,
      },
      include: {
        supplier: true,
      },
    });
  }
}
