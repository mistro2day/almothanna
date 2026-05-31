import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';

@Module({
  controllers: [BatchesController],
  providers: [BatchesService, PrismaService],
  exports: [BatchesService],
})
export class BatchesModule {}
