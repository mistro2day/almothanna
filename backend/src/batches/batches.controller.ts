import { Body, Controller, Get, Post } from '@nestjs/common';
import { BatchesService } from './batches.service';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  async getBatches() {
    return this.batchesService.findAll();
  }

  @Post()
  async createBatch(
    @Body()
    dto: {
      batchNumber: string;
      productId: string;
      qty: number;
      costPrice: number;
      expiryDate: string;
      manufactureDate: string;
    },
  ) {
    return this.batchesService.create(dto);
  }
}
