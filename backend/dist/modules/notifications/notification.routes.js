"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const notification_controller_1 = require("./notification.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/unread-count', notification_controller_1.notificationController.getUnreadCount);
router.get('/stats', notification_controller_1.notificationController.getNotificationStats);
router.get('/recent', notification_controller_1.notificationController.getRecentNotifications);
router.get('/', notification_controller_1.notificationController.getNotifications);
router.get('/:id', notification_controller_1.notificationController.getNotificationById);
router.put('/:id/read', notification_controller_1.notificationController.markAsRead);
router.put('/read-all', notification_controller_1.notificationController.markAllAsRead);
router.delete('/:id', notification_controller_1.notificationController.deleteNotification);
router.delete('/clear-read', notification_controller_1.notificationController.clearReadNotifications);
router.delete('/cleanup', (0, auth_middleware_1.requireRole)('admin'), notification_controller_1.notificationController.cleanupOldNotifications);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map