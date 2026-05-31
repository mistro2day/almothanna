import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  async updateSettings(
    @Body()
    dto: {
      name: string;
      phone: string;
      email?: string;
      address?: string;
      logo?: string;
      commercialReg?: string;
      taxNumber?: string;
      currency?: string;
      invoiceFooter?: string;
    },
  ) {
    return this.settingsService.updateSettings(dto);
  }
}
