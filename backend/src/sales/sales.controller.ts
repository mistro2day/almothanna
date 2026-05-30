import { Body, Controller, Get, Post } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async getSales() {
    return this.salesService.listSales();
  }

  @Post('offline')
  async createOfflineSale(@Body() dto: CreateSaleDto) {
    return this.salesService.createSale(dto);
  }
}
