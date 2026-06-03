import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { RevenuesService } from './revenues.service';
import { RevenuesController } from './revenues.controller';
import { FundService } from './fund.service';
import { FundController } from './fund.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ExpensesController, RevenuesController, FundController],
  providers: [ExpensesService, RevenuesService, FundService, PrismaService],
  exports: [ExpensesService, RevenuesService, FundService],
})
export class ExpensesModule {}
