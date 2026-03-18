"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
const notification_service_1 = require("./notification.service");
const response_1 = require("../../common/utils/response");
class NotificationController {
    getNotifications = async (req, res, _next) => {
        const params = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
            type: req.query.type,
            search: req.query.search
        };
        const result = await notification_service_1.notificationService.findAll(req.user.userId, params);
        return (0, response_1.sendPaginated)(res, result.notifications, params.page, params.limit, result.total, { unreadCount: result.unreadCount });
    };
    getNotificationById = async (req, res, _next) => {
        const notification = await notification_service_1.notificationService.findById(req.params.id, req.user.userId);
        return (0, response_1.sendSuccess)(res, notification);
    };
    markAsRead = async (req, res, _next) => {
        const notification = await notification_service_1.notificationService.markAsRead(req.params.id, req.user.userId);
        return (0, response_1.sendSuccess)(res, notification, 'Notification marked as read');
    };
    markAllAsRead = async (req, res, _next) => {
        const result = await notification_service_1.notificationService.markAllAsRead(req.user.userId);
        return (0, response_1.sendSuccess)(res, result, `${result.updated} notifications marked as read`);
    };
    deleteNotification = async (req, res, _next) => {
        await notification_service_1.notificationService.deleteNotification(req.params.id, req.user.userId);
        return (0, response_1.sendSuccess)(res, null, 'Notification deleted successfully');
    };
    clearReadNotifications = async (req, res, _next) => {
        const result = await notification_service_1.notificationService.clearReadNotifications(req.user.userId);
        return (0, response_1.sendSuccess)(res, result, `${result.deleted} read notifications cleared`);
    };
    getUnreadCount = async (req, res, _next) => {
        const result = await notification_service_1.notificationService.getUnreadCount(req.user.userId);
        return (0, response_1.sendSuccess)(res, result);
    };
    getNotificationStats = async (req, res, _next) => {
        const stats = await notification_service_1.notificationService.getStats(req.user.userId);
        return (0, response_1.sendSuccess)(res, stats);
    };
    getRecentNotifications = async (req, res, _next) => {
        const limit = parseInt(req.query.limit) || 5;
        const notifications = await notification_service_1.notificationService.getRecentNotifications(req.user.userId, limit);
        return (0, response_1.sendSuccess)(res, notifications);
    };
    cleanupOldNotifications = async (req, res, _next) => {
        const daysOld = parseInt(req.query.daysOld) || 30;
        const result = await notification_service_1.notificationService.cleanupOldNotifications(req.user.userId, daysOld);
        return (0, response_1.sendSuccess)(res, result, `${result.deleted} old notifications cleaned up`);
    };
}
exports.notificationController = new NotificationController();
//# sourceMappingURL=notification.controller.js.map