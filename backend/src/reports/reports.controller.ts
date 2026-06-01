import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  async getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSalesReport(startDate, endDate);
  }

  @Get('inventory')
  async getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get('suppliers')
  async getSupplierReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSupplierReport(startDate, endDate);
  }

  @Get('customers')
  async getCustomerReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCustomerReport(startDate, endDate);
  }

  @Get('shipping')
  async getShippingReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getShippingReport(startDate, endDate);
  }
}
