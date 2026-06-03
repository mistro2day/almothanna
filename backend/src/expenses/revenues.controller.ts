import { Controller, Get, Post, Delete, Patch, Param, Body, Query } from '@nestjs/common';
import { RevenuesService } from './revenues.service';
import { PaymentMethod } from '@prisma/client';

@Controller('expenses/revenues')
export class RevenuesController {
  constructor(private readonly revenuesService: RevenuesService) {}

  // ==========================================
  // Categories Endpoints
  // ==========================================
  @Get('categories')
  async listCategories() {
    return this.revenuesService.listCategories();
  }

  @Post('categories')
  async createCategory(@Body('name') name: string) {
    return this.revenuesService.createCategory(name);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.revenuesService.deleteCategory(id);
  }

  // ==========================================
  // Revenues Endpoints
  // ==========================================
  @Get()
  async listRevenues(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.revenuesService.listRevenues({ startDate, endDate, categoryId });
  }

  @Post()
  async createRevenue(
    @Body() dto: {
      amount: number;
      description?: string;
      date?: string;
      categoryId: string;
      userId?: string;
      paymentMethod?: PaymentMethod;
      reference?: string;
      documentNumber?: string;
    },
  ) {
    return this.revenuesService.createRevenue(dto);
  }

  @Patch(':id')
  async updateRevenue(
    @Param('id') id: string,
    @Body() dto: {
      amount?: number;
      description?: string;
      date?: string;
      categoryId?: string;
      paymentMethod?: PaymentMethod;
      reference?: string;
      documentNumber?: string;
    },
  ) {
    return this.revenuesService.updateRevenue(id, dto);
  }

  @Delete(':id')
  async deleteRevenue(@Param('id') id: string) {
    return this.revenuesService.deleteRevenue(id);
  }
}
