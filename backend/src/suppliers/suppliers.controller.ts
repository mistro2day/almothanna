import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async getSuppliers() {
    return this.suppliersService.findAll();
  }

  @Post()
  async createSupplier(@Body() dto: any) {
    return this.suppliersService.create(dto);
  }

  @Get('purchase-orders')
  async getPurchaseOrders() {
    return this.suppliersService.findAllPurchaseOrders();
  }

  @Post('purchase-orders')
  async createPurchaseOrder(@Body() dto: any) {
    return this.suppliersService.createPurchaseOrder(dto);
  }

  @Post('purchase-orders/:id/receive')
  async receivePurchaseOrder(
    @Param('id') id: string,
    @Body() dto: { items: any[] },
  ) {
    return this.suppliersService.receivePurchaseOrder(id, dto.items);
  }

  @Get('payments')
  async getPayments() {
    return this.suppliersService.findAllPayments();
  }

  @Post('payments')
  async createPayment(@Body() dto: any) {
    return this.suppliersService.createPayment(dto);
  }
}
