import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, NotificationTypeEnum } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, userId: string) {
    const [unreadCount, items] = await Promise.all([
      this.prisma.notification.count({
        where: {
          organizationId,
          userId,
          read: false,
        },
      }),
      this.prisma.notification.findMany({
        where: {
          organizationId,
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 30,
      }),
    ]);

    return {
      unreadCount,
      items: items.map((i) => ({
        ...i,
        isRead: i.read,
        link: i.actionUrl,
      })),
    };
  }

  async create(organizationId: string, targetUserId: string, dto: CreateNotificationDto) {
    const assignedUserId = dto.userId || targetUserId;
    const notification = await this.prisma.notification.create({
      data: {
        organizationId,
        userId: assignedUserId,
        title: dto.title,
        message: dto.message,
        type: (dto.type as any) || NotificationTypeEnum.INFO,
        actionUrl: dto.link,
      },
    });

    return {
      ...notification,
      isRead: notification.read,
      link: notification.actionUrl,
    };
  }

  async markAsRead(organizationId: string, userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        organizationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return {
      ...updated,
      isRead: updated.read,
      link: updated.actionUrl,
    };
  }

  async markAllAsRead(organizationId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        organizationId,
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return {
      success: true,
      count: result.count,
    };
  }

  async delete(organizationId: string, userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        organizationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return { success: true, message: 'Notification deleted' };
  }
}
