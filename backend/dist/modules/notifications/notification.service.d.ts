import { NotificationType } from '@prisma/client';
interface NotificationQueryParams {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
    search?: string;
}
declare class NotificationService {
    findAll(userId: string, params: NotificationQueryParams): Promise<{
        notifications: {
            id: string;
            createdAt: Date;
            userId: string;
            title: string;
            type: import("@prisma/client").$Enums.NotificationType;
            message: string;
            isRead: boolean;
            referenceId: string | null;
            referenceType: string | null;
        }[];
        page: number;
        limit: number;
        total: number;
        unreadCount: number;
    }>;
    findById(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.NotificationType;
        message: string;
        isRead: boolean;
        referenceId: string | null;
        referenceType: string | null;
    }>;
    markAsRead(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.NotificationType;
        message: string;
        isRead: boolean;
        referenceId: string | null;
        referenceType: string | null;
    }>;
    markAllAsRead(userId: string): Promise<{
        updated: number;
    }>;
    deleteNotification(id: string, userId: string): Promise<boolean>;
    clearReadNotifications(userId: string): Promise<{
        deleted: number;
    }>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
    getStats(userId: string): Promise<{
        total: number;
        unread: number;
        read: number;
        byType: {
            type: import("@prisma/client").$Enums.NotificationType;
            count: number;
        }[];
    }>;
    createNotification(data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        referenceId?: string;
        referenceType?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.NotificationType;
        message: string;
        isRead: boolean;
        referenceId: string | null;
        referenceType: string | null;
    }>;
    createBatchNotifications(notifications: Array<{
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        referenceId?: string;
        referenceType?: string;
    }>): Promise<{
        created: number;
    }>;
    getRecentNotifications(userId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import("@prisma/client").$Enums.NotificationType;
        message: string;
        isRead: boolean;
        referenceId: string | null;
        referenceType: string | null;
    }[]>;
    cleanupOldNotifications(userId: string, daysOld?: number): Promise<{
        deleted: number;
    }>;
}
export declare const notificationService: NotificationService;
export {};
//# sourceMappingURL=notification.service.d.ts.map