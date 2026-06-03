import { Controller, Get, Post, Delete, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { FundService } from './fund.service';
import { FundTransactionType, FundSource, PaymentMethod } from '@prisma/client';

@Controller('expenses/fund')
export class FundController {
  constructor(private readonly fundService: FundService) {}

  @Get('ledger')
  async getFundLedger(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('source') source?: FundSource,
    @Query('type') type?: FundTransactionType,
  ) {
    return this.fundService.getFundLedger({ startDate, endDate, paymentMethod, source, type });
  }

  @Get('summary')
  async getFundSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.fundService.getFundSummary(startDate, endDate);
  }

  @Post('manual')
  async createManualTransaction(
    @Body() dto: {
      amount: number;
      type: FundTransactionType;
      paymentMethod?: PaymentMethod;
      reference?: string;
      documentNumber?: string;
      description: string;
      date?: string;
      userId?: string;
    },
  ) {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('المبلغ يجب أن يكون أكبر من الصفر');
    }
    if (!dto.description) {
      throw new BadRequestException('البيان مطلوب');
    }

    return this.fundService.recordTransaction({
      ...dto,
      source: FundSource.MANUAL,
    });
  }

  @Delete(':id')
  async deleteManualTransaction(@Param('id') id: string) {
    try {
      return await this.fundService.deleteManualTransaction(id);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}
