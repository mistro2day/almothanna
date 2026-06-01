import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async logActivity(userId: string, action: string, details: string) {
    try {
      // Create the activity in db
      const activity = await this.prisma.activity.create({
        data: {
          userId,
          action,
          details,
        },
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      });

      // Broadcast new activity notification to other users
      const userName = activity.user?.name || 'مستخدم غير معروف';
      await this.notificationsService.sendNotificationToOthers(
        userId,
        `نشاط جديد من ${userName}`,
        `قام ${userName} بـ ${action}: ${details}`,
      );

      return activity;
    } catch (e) {
      console.error('Failed to log activity', e);
    }
  }

  async getActivities() {
    return this.prisma.activity.findMany({
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }
}
