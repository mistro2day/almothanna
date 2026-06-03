import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReturn(dto: {
    saleId: string;
    refundToCash: boolean;
    items: { productId: string; batchId: string; qty: number }[];
  }) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('يجب تحديد صنف واحد على الأقل للإرجاع');
    }

    // جلب الفاتورة مع العناصر والمرتجعات السابقة والأقساط
    const sale = await this.prisma.sale.findUnique({
      where: { id: dto.saleId },
      include: {
        customer: true,
        items: true,
        returns: {
          include: {
            items: true,
          },
        },
        installments: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('الفاتورة غير موجودة');
    }

    if (sale.status === 'DRAFT') {
      throw new BadRequestException('لا يمكن عمل مرتجع لفاتورة مسودة');
    }

    // حساب الكميات المرتجعة سابقاً لكل تشغيلة
    const returnedQtys: Record<string, number> = {};
    for (const ret of sale.returns) {
      for (const retItem of ret.items) {
        const key = `${retItem.productId}-${retItem.batchId}`;
        returnedQtys[key] = (returnedQtys[key] || 0) + retItem.qty;
      }
    }

    // التحقق من صحة الكميات المطلوبة للإرجاع وحساب قيمة المرتجع
    let totalRefundAmount = 0;
    const validatedItems: { productId: string; batchId: string; qty: number; price: number }[] = [];

    for (const item of dto.items) {
      const saleItem = sale.items.find(
        (si) => si.productId === item.productId && si.batchId === item.batchId
      );

      if (!saleItem) {
        throw new BadRequestException(
          `هذا المنتج أو التشغيلة غير موجود في الفاتورة الأصلية: ${item.productId}`
        );
      }

      const key = `${item.productId}-${item.batchId}`;
      const alreadyReturned = returnedQtys[key] || 0;
      const maxReturnable = saleItem.qty - alreadyReturned;

      if (item.qty <= 0) {
        throw new BadRequestException('يجب أن تكون كمية المرتجع أكبر من الصفر');
      }

      if (item.qty > maxReturnable) {
        throw new BadRequestException(
          `الكمية المطلوبة للإرجاع (${item.qty}) تتجاوز الكمية المتاحة للإرجاع (${maxReturnable})`
        );
      }

      totalRefundAmount += item.qty * saleItem.price;
      validatedItems.push({
        productId: item.productId,
        batchId: item.batchId,
        qty: item.qty,
        price: saleItem.price,
      });
    }

    // تنفيذ العملية بالكامل داخل Transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. إنشاء سجل المرتجع الرئيسي
      const returnRecord = await tx.return.create({
        data: {
          saleId: sale.id,
          totalRefund: totalRefundAmount,
          refundToCash: dto.refundToCash,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              batchId: item.batchId,
              qty: item.qty,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. تحديث المخزون وحركات المستودع وتعديل كميات الفاتورة الأصلية لكل صنف مرتجع
      for (const item of validatedItems) {
        // زيادة كمية التشغيلة
        await tx.batch.update({
          where: { id: item.batchId },
          data: {
            qty: {
              increment: item.qty,
            },
          },
        });

        // تسجيل حركة مخزنية واردة
        await tx.stockMovement.create({
          data: {
            batchId: item.batchId,
            type: 'IN',
            qty: item.qty,
            reason: 'Customer Return',
          },
        });

        // تعديل كمية الصنف في الفاتورة الأصلية
        const saleItem = sale.items.find(
          (si) => si.productId === item.productId && si.batchId === item.batchId
        );
        if (saleItem) {
          if (saleItem.qty === item.qty) {
            // حذف الصنف نهائياً من الفاتورة في حال إرجاع كامل كميته
            await tx.saleItem.delete({
              where: { id: saleItem.id },
            });
          } else {
            // إنقاص الكمية المرتجعة من كمية الصنف بالفاتورة
            await tx.saleItem.update({
              where: { id: saleItem.id },
              data: {
                qty: {
                  decrement: item.qty,
                },
              },
            });
          }
        }
      }

      // 3. التعديلات المالية على الفاتورة
      let newTotal = Math.max(0, sale.total - totalRefundAmount);
      let newPaid = sale.paid;

      if (dto.refundToCash) {
        // إرجاع نقدي: تقليل المبلغ المدفوع أيضاً لأننا أرجعنا كاش للعميل
        newPaid = Math.max(0, sale.paid - totalRefundAmount);

        // تسجيل قيد صرف بالصندوق للمرتجع النقدي
        const settings = await tx.companySettings.findFirst();
        if (!settings || settings.linkSalesToFund) {
          const txCount = await tx.fundTransaction.count();
          const yearSuffix = new Date().getFullYear().toString().slice(-2);
          const code = `SF${yearSuffix}${String(txCount + 1).padStart(6, '0')}`;
          await tx.fundTransaction.create({
            data: {
              transactionCode: code,
              amount: totalRefundAmount,
              type: 'OUTFLOW',
              source: 'RETURN',
              paymentMethod: 'CASH',
              description: `مبلغ مرتجع نقدي للفاتورة: ${sale.id} للعميل: ${sale.customer.name}`,
              returnId: returnRecord.id,
            },
          });
        }
      } else {
        // تخفيض المديونية: المبلغ المدفوع يظل كما هو، وتقل المديونية المتبقية.
        // تعديل الأقساط غير المدفوعة بدءاً من الأخير
        let remainingRefund = totalRefundAmount;
        const pendingInstallments = sale.installments
          .filter((inst) => inst.status !== 'PAID')
          .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime()); // ترتيب تنازلي حسب التاريخ (الأحدث أولاً)

        for (const inst of pendingInstallments) {
          if (remainingRefund <= 0) break;

          const unpaidAmount = inst.amount - inst.paidAmount;
          if (unpaidAmount > 0) {
            const deduct = Math.min(unpaidAmount, remainingRefund);
            const newAmount = inst.amount - deduct;
            remainingRefund -= deduct;

            await tx.installment.update({
              where: { id: inst.id },
              data: {
                amount: newAmount,
                status: newAmount <= inst.paidAmount ? 'PAID' : inst.status,
              },
            });
          }
        }
      }

      // إعادة حساب حالة الفاتورة
      let newStatus: 'PAID' | 'PARTIAL' | 'PENDING' = 'PENDING';
      if (newTotal === 0) {
        newStatus = 'PAID';
      } else if (newPaid >= newTotal) {
        newStatus = 'PAID';
      } else if (newPaid > 0) {
        newStatus = 'PARTIAL';
      } else {
        newStatus = 'PENDING';
      }

      // تحديث الفاتورة بالقيم الجديدة
      await tx.sale.update({
        where: { id: sale.id },
        data: {
          total: newTotal,
          paid: newPaid,
          status: newStatus,
        },
      });

      return returnRecord;
    });

    return result;
  }

  async getReturnsBySaleId(saleId: string) {
    return this.prisma.return.findMany({
      where: { saleId },
      include: {
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
