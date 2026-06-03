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

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
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

      if (po.paid > 0) {
        const settings = await tx.companySettings.findFirst();
        if (!settings || settings.linkPurchasesToFund) {
          const txCount = await tx.fundTransaction.count();
          const yearSuffix = new Date().getFullYear().toString().slice(-2);
          const code = `SF${yearSuffix}${String(txCount + 1).padStart(6, '0')}`;
          await tx.fundTransaction.create({
            data: {
              transactionCode: code,
              amount: po.paid,
              type: 'OUTFLOW',
              source: 'PURCHASE',
              paymentMethod: 'CASH',
              description: `سداد مقدم فاتورة شراء: ${po.orderNumber} للمورد: ${po.supplier.name}`,
              purchaseOrderId: po.id,
            },
          });
        }
      }

      return po;
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
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.supplierPayment.create({
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

      const settings = await tx.companySettings.findFirst();
      if (!settings || settings.linkPurchasesToFund) {
        const txCount = await tx.fundTransaction.count();
        const yearSuffix = new Date().getFullYear().toString().slice(-2);
        const code = `SF${yearSuffix}${String(txCount + 1).padStart(6, '0')}`;
        await tx.fundTransaction.create({
          data: {
            transactionCode: code,
            amount: payment.amount,
            type: 'OUTFLOW',
            source: 'SUPPLIER_PAYMENT',
            paymentMethod: payment.paymentMethod,
            reference: payment.reference,
            description: `سداد دفعة للمورد: ${payment.supplier.name}${payment.notes ? ' - ' + payment.notes : ''}`,
            supplierPaymentId: payment.id,
          },
        });
      }

      return payment;
    });
  }

  async receivePurchaseOrder(id: string, items: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({ where: { id } });
      if (!order) throw new Error('Purchase Order not found');

      for (const item of items) {
        // Create a new batch
        const batch = await tx.batch.create({
          data: {
            batchNumber: item.batchNumber,
            productId: item.productId,
            supplierId: order.supplierId,
            qty: item.qty,
            costPrice: item.unitCost,
            expiryDate: new Date(item.expiryDate),
            manufactureDate: item.manufactureDate ? new Date(item.manufactureDate) : new Date(),
          },
        });

        // Add stock movement
        await tx.stockMovement.create({
          data: {
            batchId: batch.id,
            type: 'IN',
            qty: item.qty,
            reason: 'Purchase Receipt',
          },
        });

        // Update purchase item with received batch info
        await tx.purchaseItem.update({
          where: { id: item.purchaseItemId },
          data: { batchNumber: item.batchNumber, qty: item.qty },
        });
      }

      // Update PO status to RECEIVED (or you can calculate if it's partial)
      return tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED', receivedDate: new Date() },
      });
    });
  }

  async update(id: string, data: any) {
    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        companyName: data.companyName,
        type: data.type,
        phone: data.phone,
        email: data.email,
        country: data.country,
        city: data.city,
        address: data.address,
        commercialReg: data.commercialReg,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : undefined,
        paymentTerms: data.paymentTerms as PaymentTerms,
        currency: data.currency,
        notes: data.notes,
        isActive: data.isActive,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
