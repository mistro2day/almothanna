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

  async updateSettings(data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    logo?: string;
    commercialReg?: string;
    taxNumber?: string;
    currency?: string;
    invoiceFooter?: string;
  }) {
    const current = await this.getSettings();
    return this.prisma.companySettings.update({
      where: { id: current.id },
      data,
    });
  }
}
