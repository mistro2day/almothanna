import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.companySettings.findFirst();
    if (!settings) {
      settings = await this.prisma.companySettings.create({
        data: {
          name: "المثنى للأدوية",
          phone: "0912345678",
          email: "info@almothanna.com",
          address: "السودان - أمدرمان",
          logo: null,
          commercialReg: "12345",
          taxNumber: "67890",
          currency: "SDG",
          invoiceFooter: "شكراً لتعاملكم معنا - المثنى للأدوية",
        },
      });
    }
    return settings;
  }

  async updateSettings(data: any) {
    const current = await this.getSettings();
    // Exclude id and updatedAt from Prisma update payload to prevent primary key modification error
    const { id, updatedAt, ...validData } = data;
    return this.prisma.companySettings.update({
      where: { id: current.id },
      data: validData,
    });
  }
}
