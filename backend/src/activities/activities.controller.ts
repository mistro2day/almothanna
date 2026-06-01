import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { ActivitiesService } from './activities.service';
import { JwtService } from '@nestjs/jwt';
import { getUserIdFromRequest } from '../auth/jwt-helper';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  async getActivities() {
    return this.activitiesService.getActivities();
  }

  @Post()
  async logActivity(
    @Req() req: any,
    @Body() dto: { action: string; details: string },
  ) {
    const userId = getUserIdFromRequest(req, this.jwtService);
    return this.activitiesService.logActivity(userId, dto.action, dto.details);
  }
}
