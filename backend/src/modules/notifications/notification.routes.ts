import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { notificationController } from './notification.controller'

const router = Router()

router.use(authenticate)

router.get('/unread-count', notificationController.getUnreadCount)
router.get('/stats', notificationController.getNotificationStats)
router.get('/recent', notificationController.getRecentNotifications)

router.post('/broadcast', requireRole('admin', 'staff'), notificationController.broadcast)

router.get('/', notificationController.getNotifications)
router.put('/read-all', notificationController.markAllAsRead)
router.delete('/clear-read', notificationController.clearReadNotifications)
router.delete('/cleanup', requireRole('admin'), notificationController.cleanupOldNotifications)

router.get('/:id', notificationController.getNotificationById)
router.put('/:id/read', notificationController.markAsRead)
router.delete('/:id', notificationController.deleteNotification)

export default router
