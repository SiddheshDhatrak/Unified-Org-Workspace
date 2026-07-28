import { prisma } from '../../config/db';
import { NotFoundError } from '../../shared/errors/AppError';

export class NotificationService {
  async listNotifications(userId: string, read?: string, take: number = 20) {
    const where: any = { userId };
    if (read !== undefined) {
      where.read = read === 'true';
    }

    const data = await prisma.notification.findMany({
      where,
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }], // unread-first (§18.8)
      take,
    });

    return { data, nextCursor: null };
  }

  async markAsRead(userId: string, notificationId: string) {
    const record = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
    if (!record) throw new NotFoundError('Notification not found');
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }
}
