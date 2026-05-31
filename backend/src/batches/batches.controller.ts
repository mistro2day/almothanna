import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  @Post(':id/add-qty')
  async addQty(
    @Param('id') id: string,
    @Body() dto: { qty: number },
  ) {
    return this.batchesService.addQty(id, dto.qty);
  }
}

