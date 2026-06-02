import { Controller, Get, Post, Delete, Patch, Param, Body, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ==========================================
  // Categories Endpoints
  // ==========================================
  @Get('categories')
  async listCategories() {
    return this.expensesService.listCategories();
  }

  @Post('categories')
  async createCategory(@Body('name') name: string) {
    return this.expensesService.createCategory(name);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.expensesService.deleteCategory(id);
  }

  // ==========================================
  // Financial Summary Endpoint
  // ==========================================
  @Get('financial-summary')
  async getFinancialSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.getFinancialSummary(startDate, endDate);
  }

  // ==========================================
  // Expenses Endpoints
  // ==========================================
  @Get()
  async listExpenses(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.expensesService.listExpenses({ startDate, endDate, categoryId });
  }

  @Post()
  async createExpense(
    @Body() dto: { amount: number; description?: string; date?: string; categoryId: string; userId?: string },
  ) {
    return this.expensesService.createExpense(dto);
  }

  @Patch(':id')
  async updateExpense(
    @Param('id') id: string,
    @Body() dto: { amount?: number; description?: string; date?: string; categoryId?: string },
  ) {
    return this.expensesService.updateExpense(id, dto);
  }

  @Delete(':id')
  async deleteExpense(@Param('id') id: string) {
    return this.expensesService.deleteExpense(id);
  }
}
