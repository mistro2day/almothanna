import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    getSales(): Promise<{
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
    createOfflineSale(dto: CreateSaleDto): Promise<{
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
}
