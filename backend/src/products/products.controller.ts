import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts() {
    return this.productsService.findAll();
  }

  @Post()
  async createProduct(
    @Body()
    dto: {
      name: string;
      scientificName?: string;
      barcode?: string;
      category?: string;
      unit: string;
    },
  ) {
    return this.productsService.create(dto);
  }
}
