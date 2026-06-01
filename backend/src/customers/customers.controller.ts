import { Body, Controller, Get, Post, Patch, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async getCustomers() {
    return this.customersService.findAll();
  }

  @Post()
  async createCustomer(
    @Body()
    dto: {
      name: string;
      type: string;
      state: string;
      phone: string;
      creditLimit?: number;
      representativeId?: string;
    },
  ) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      type?: string;
      state?: string;
      phone?: string;
      creditLimit?: number;
      representativeId?: string;
    },
  ) {
    return this.customersService.update(id, dto);
  }
}
