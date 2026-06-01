import { Module } from '@nestjs/common';
import { RepresentativesController } from './representatives.controller';
import { RepresentativesService } from './representatives.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [RepresentativesController],
  providers: [RepresentativesService, PrismaService],
  exports: [RepresentativesService],
})
export class RepresentativesModule {}
