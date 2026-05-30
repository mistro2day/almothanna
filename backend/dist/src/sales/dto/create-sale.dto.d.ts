import { CreateSaleItemDto } from './create-sale-item.dto';
export declare class CreateSaleDto {
    customerId: string;
    items: CreateSaleItemDto[];
    total: number;
    paid: number;
    createdAt?: string;
}
