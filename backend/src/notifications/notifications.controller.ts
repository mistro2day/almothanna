import { Controller, Get, Param, Patch, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('sse/:userId')
  sse(@Param('userId') userId: string): Observable<MessageEvent> {
    return this.notificationsService.getNotificationsObservable().pipe(
      filter((notification) => notification.userId === userId),
      map((notification) => ({
        data: notification,
      } as MessageEvent)),
    );
  }

  @Get(':userId')
  async getNotifications(@Param('userId') userId: string) {
    return this.notificationsService.getNotificationsForUser(userId);
  }

  @Patch(':id/read')
  async readNotification(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all/:userId')
  async readAllNotifications(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
