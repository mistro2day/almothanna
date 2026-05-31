import { Body, Controller, Get, Post, Delete, Param, Patch } from '@nestjs/common';
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

  @Delete(':id')
  async deleteSale(@Param('id') id: string) {
    return this.salesService.deleteSale(id);
  }

  @Patch(':id')
  async updateSaleDate(@Param('id') id: string, @Body('createdAt') createdAt: string) {
    return this.salesService.updateSaleDate(id, createdAt);
  }
}
