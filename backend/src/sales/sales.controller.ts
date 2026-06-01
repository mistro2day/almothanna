import { Body, Controller, Get, Post, Delete, Param, Patch, Put } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.salesService.getDashboardStats();
  }

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

  @Put(':id/update-invoice')
  async updateSaleAndInstallments(
    @Param('id') id: string,
    @Body() dto: { createdAt?: string; paid: number; installments?: any[] }
  ) {
    return this.salesService.updateSaleAndInstallments(id, dto);
  }

  @Post(':id/pay')
  async paySale(@Param('id') id: string, @Body('amount') amount: number) {
    return this.salesService.paySale(id, amount);
  }

  @Get('installments')
  async getInstallments() {
    return this.salesService.listInstallments();
  }

  @Post('installments/:id/pay')
  async payInstallment(@Param('id') id: string, @Body('amount') amount: number) {
    return this.salesService.payInstallment(id, amount);
  }
}

