import { Request, Response, NextFunction } from 'express';
declare class NotificationController {
    getNotifications: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getNotificationById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    markAsRead: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    markAllAsRead: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    deleteNotification: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    clearReadNotifications: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getUnreadCount: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getNotificationStats: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getRecentNotifications: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    cleanupOldNotifications: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const notificationController: NotificationController;
export {};
//# sourceMappingURL=notification.controller.d.ts.map