"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let SalesService = class SalesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSale(dto) {
        if (!dto.items || dto.items.length === 0) {
            throw new common_1.BadRequestException('Sale must include at least one item');
        }
        const customer = await this.prisma.customer.findUnique({
            where: { id: dto.customerId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        const batchRecords = await Promise.all(dto.items.map((item) => this.prisma.batch.findUnique({
            where: { id: item.batchId },
        })));
        dto.items.forEach((item, index) => {
            const batch = batchRecords[index];
            if (!batch) {
                throw new common_1.NotFoundException(`Batch not found: ${item.batchId}`);
            }
            if (item.qty > batch.qty) {
                throw new common_1.BadRequestException(`Not enough stock in batch ${batch.batchNumber}`);
            }
        });
        const status = dto.paid >= dto.total ? 'PAID' : dto.paid > 0 ? 'PARTIAL' : 'PENDING';
        const saleCreate = this.prisma.sale.create({
            data: {
                customerId: dto.customerId,
                total: dto.total,
                paid: dto.paid,
                status,
                createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
                items: {
                    create: dto.items.map((item) => ({
                        productId: item.productId,
                        batchId: item.batchId,
                        qty: item.qty,
                        price: item.price,
                    })),
                },
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                        batch: true,
                    },
                },
            },
        });
        const batchUpdates = dto.items.map((item) => this.prisma.batch.update({
            where: { id: item.batchId },
            data: {
                qty: {
                    decrement: item.qty,
                },
            },
        }));
        const stockMovements = dto.items.map((item) => this.prisma.stockMovement.create({
            data: {
                batchId: item.batchId,
                type: 'OUT',
                qty: item.qty,
                reason: 'Sale',
            },
        }));
        const [sale] = await this.prisma.$transaction([
            saleCreate,
            ...batchUpdates,
            ...stockMovements,
        ]);
        return {
            id: sale.id,
            customerName: sale.customer.name,
            total: sale.total,
            paid: sale.paid,
            status: sale.status,
            createdAt: sale.createdAt.toISOString(),
            items: sale.items.map((item) => ({
                productName: item.product.name,
                batchNumber: item.batch.batchNumber,
                qty: item.qty,
                price: item.price,
            })),
        };
    }
    async listSales() {
        const sales = await this.prisma.sale.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                        batch: true,
                    },
                },
            },
        });
        return sales.map((sale) => ({
            id: sale.id,
            customerName: sale.customer.name,
            total: sale.total,
            paid: sale.paid,
            status: sale.status,
            createdAt: sale.createdAt.toISOString(),
            items: sale.items.map((item) => ({
                productName: item.product.name,
                batchNumber: item.batch.batchNumber,
                qty: item.qty,
                price: item.price,
            })),
        }));
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesService);
//# sourceMappingURL=sales.service.js.map