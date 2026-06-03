import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReturnsService } from './returns.service';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  async createReturn(
    @Body() dto: {
      saleId: string;
      refundToCash: boolean;
      items: { productId: string; batchId: string; qty: number }[];
    }
  ) {
    return this.returnsService.createReturn(dto);
  }

  @Get('sale/:saleId')
  async getReturnsBySaleId(@Param('saleId') saleId: string) {
    return this.returnsService.getReturnsBySaleId(saleId);
  }
}
