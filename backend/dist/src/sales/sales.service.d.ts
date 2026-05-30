import { PrismaService } from '../prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createSale(dto: CreateSaleDto): Promise<{
        id: string;
        customerName: string;
        total: number;
        paid: number;
        status: import("@prisma/client").$Enums.SaleStatus;
        createdAt: string;
        items: {
            productName: string;
            batchNumber: string;
            qty: number;
            price: number;
        }[];
    }>;
    listSales(): Promise<{
        id: string;
        customerName: string;
        total: number;
        paid: number;
        status: import("@prisma/client").$Enums.SaleStatus;
        createdAt: string;
        items: {
            productName: string;
            batchNumber: string;
            qty: number;
            price: number;
        }[];
    }[]>;
}
