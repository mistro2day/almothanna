import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationsService {
  private notifications$ = new Subject<any>();

  constructor(private readonly prisma: PrismaService) {}

  getNotificationsObservable() {
    return this.notifications$.asObservable();
  }

  async sendNotificationToOthers(senderId: string, title: string, message: string) {
    try {
      // Get all users from database (including the sender for instant feedback and audit verification)
      const otherUsers = await this.prisma.user.findMany();

      if (otherUsers.length === 0) return;

      // 2. Create database notifications for them
      const notifications = await Promise.all(
        otherUsers.map((user) =>
          this.prisma.notification.create({
            data: {
              userId: user.id,
              title,
              message,
            },
          }),
        ),
      );

      // 3. Emit notification event to listeners
      notifications.forEach((notif: any) => {
        this.notifications$.next(notif);
      });
    } catch (e) {
      console.error('Error in sendNotificationToOthers', e);
    }
  }

  async getNotificationsForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
