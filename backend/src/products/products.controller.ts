import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts() {
    return this.productsService.findAll();
  }

  @Get('search')
  async searchProducts(@Query('query') query: string) {
    return this.productsService.search(query || '');
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
