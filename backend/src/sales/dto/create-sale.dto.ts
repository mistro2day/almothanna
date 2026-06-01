import { CreateSaleItemDto } from './create-sale-item.dto';

export class CreateInstallmentDto {
  dueDate: string;
  amount: number;
  notes?: string;
}

export class CreateSaleDto {
  customerId: string;
  items: CreateSaleItemDto[];
  total: number;
  paid: number;
  createdAt?: string;
  installments?: CreateInstallmentDto[];
  representativeId?: string;
}
