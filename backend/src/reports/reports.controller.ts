import { Controller, Get, Query, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  async getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('representativeId') representativeId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('paymentType') paymentType?: string,
  ) {
    return this.reportsService.getSalesReport(startDate, endDate, representativeId, categoryId, paymentType);
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

  @Get('customer-statement/:customerId')
  async getCustomerStatement(
    @Param('customerId') customerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCustomerStatement(customerId, startDate, endDate);
  }

  @Get('supplier-statement/:supplierId')
  async getSupplierStatement(
    @Param('supplierId') supplierId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSupplierStatement(supplierId, startDate, endDate);
  }

  @Get('profits')
  async getProfitsReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('customerId') customerId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.reportsService.getProfitsReport(startDate, endDate, customerId, categoryId);
  }
}

