"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const prisma = new client_1.PrismaClient();
class NotificationService {
    async findAll(userId, params) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (params.isRead !== undefined) {
            where.isRead = params.isRead;
        }
        if (params.type) {
            where.type = params.type;
        }
        if (params.search) {
            where.OR = [
                { title: { contains: params.search, mode: 'insensitive' } },
                { message: { contains: params.search, mode: 'insensitive' } }
            ];
        }
        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
                where: {
                    userId,
                    isRead: false
                }
            })
        ]);
        return {
            notifications,
            page,
            limit,
            total,
            unreadCount
        };
    }
    async findById(id, userId) {
        const notification = await prisma.notification.findFirst({
            where: {
                id,
                userId
            }
        });
        if (!notification) {
            throw app_error_1.AppError.notFound('Notification');
        }
        return notification;
    }
    async markAsRead(id, userId) {
        const notification = await prisma.notification.findFirst({
            where: {
                id,
                userId
            }
        });
        if (!notification) {
            throw app_error_1.AppError.notFound('Notification');
        }
        if (notification.isRead) {
            return notification;
        }
        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        return updated;
    }
    async markAllAsRead(userId) {
        const result = await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: { isRead: true }
        });
        return {
            updated: result.count
        };
    }
    async deleteNotification(id, userId) {
        const notification = await prisma.notification.findFirst({
            where: {
                id,
                userId
            }
        });
        if (!notification) {
            throw app_error_1.AppError.notFound('Notification');
        }
        await prisma.notification.delete({
            where: { id }
        });
        return true;
    }
    async clearReadNotifications(userId) {
        const result = await prisma.notification.deleteMany({
            where: {
                userId,
                isRead: true
            }
        });
        return {
            deleted: result.count
        };
    }
    async getUnreadCount(userId) {
        const count = await prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });
        return { count };
    }
    async getStats(userId) {
        const [total, unread, read, byType] = await Promise.all([
            prisma.notification.count({
                where: { userId }
            }),
            prisma.notification.count({
                where: {
                    userId,
                    isRead: false
                }
            }),
            prisma.notification.count({
                where: {
                    userId,
                    isRead: true
                }
            }),
            prisma.notification.groupBy({
                by: ['type'],
                where: { userId },
                _count: {
                    id: true
                },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                }
            })
        ]);
        return {
            total,
            unread,
            read,
            byType: byType.map(stat => ({
                type: stat.type,
                count: stat._count.id
            }))
        };
    }
    async createNotification(data) {
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                referenceId: data.referenceId,
                referenceType: data.referenceType
            }
        });
        return notification;
    }
    async createBatchNotifications(notifications) {
        const result = await prisma.notification.createMany({
            data: notifications
        });
        return {
            created: result.count
        };
    }
    async getRecentNotifications(userId, limit = 5) {
        const notifications = await prisma.notification.findMany({
            where: {
                userId
            },
            take: limit,
            orderBy: { createdAt: 'desc' }
        });
        return notifications;
    }
    async cleanupOldNotifications(userId, daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const result = await prisma.notification.deleteMany({
            where: {
                userId,
                isRead: true,
                createdAt: {
                    lt: cutoffDate
                }
            }
        });
        return {
            deleted: result.count
        };
    }
}
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map