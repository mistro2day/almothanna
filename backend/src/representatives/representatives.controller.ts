import { Body, Controller, Get, Post, Patch, Delete, Param } from '@nestjs/common';
import { RepresentativesService } from './representatives.service';

@Controller('representatives')
export class RepresentativesController {
  constructor(private readonly representativesService: RepresentativesService) {}

  @Get()
  async getRepresentatives() {
    return this.representativesService.findAll();
  }

  @Post()
  async createRepresentative(
    @Body()
    dto: {
      name: string;
      phone: string;
      commissionRate: number;
    },
  ) {
    return this.representativesService.create(dto);
  }

  @Patch(':id')
  async updateRepresentative(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      phone?: string;
      commissionRate?: number;
      isActive?: boolean;
    },
  ) {
    return this.representativesService.update(id, dto);
  }

  @Delete(':id')
  async deleteRepresentative(@Param('id') id: string) {
    return this.representativesService.remove(id);
  }
}
