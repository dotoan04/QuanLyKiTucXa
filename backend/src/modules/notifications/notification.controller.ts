import { Request, Response, NextFunction } from 'express'
import { notificationService } from './notification.service'
import { sendSuccess, sendPaginated } from '../../common/utils/response'

class NotificationController {
  getNotifications = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
      type: req.query.type as string,
      search: req.query.search as string
    }

    const result = await notificationService.findAll(req.user!.userId, params)

    return sendPaginated(
      res,
      result.notifications,
      params.page,
      params.limit,
      result.total,
      { unreadCount: result.unreadCount }
    )
  }

  getNotificationById = async (req: Request, res: Response, _next: NextFunction) => {
    const notification = await notificationService.findById(req.params.id, req.user!.userId)
    return sendSuccess(res, notification)
  }

  markAsRead = async (req: Request, res: Response, _next: NextFunction) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user!.userId)
    return sendSuccess(res, notification, 'Notification marked as read')
  }

  markAllAsRead = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await notificationService.markAllAsRead(req.user!.userId)
    return sendSuccess(res, result, `${result.updated} notifications marked as read`)
  }

  deleteNotification = async (req: Request, res: Response, _next: NextFunction) => {
    await notificationService.deleteNotification(req.params.id, req.user!.userId)
    return sendSuccess(res, null, 'Notification deleted successfully')
  }

  clearReadNotifications = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await notificationService.clearReadNotifications(req.user!.userId)
    return sendSuccess(res, result, `${result.deleted} read notifications cleared`)
  }

  getUnreadCount = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await notificationService.getUnreadCount(req.user!.userId)
    return sendSuccess(res, result)
  }

  getNotificationStats = async (req: Request, res: Response, _next: NextFunction) => {
    const stats = await notificationService.getStats(req.user!.userId)
    return sendSuccess(res, stats)
  }

  getRecentNotifications = async (req: Request, res: Response, _next: NextFunction) => {
    const limit = parseInt(req.query.limit as string) || 5
    const notifications = await notificationService.getRecentNotifications(req.user!.userId, limit)
    return sendSuccess(res, notifications)
  }

  cleanupOldNotifications = async (req: Request, res: Response, _next: NextFunction) => {
    const daysOld = parseInt(req.query.daysOld as string) || 30
    const result = await notificationService.cleanupOldNotifications(req.user!.userId, daysOld)
    return sendSuccess(res, result, `${result.deleted} old notifications cleaned up`)
  }

  broadcast = async (req: Request, res: Response, _next: NextFunction) => {
    const { title, message, type, targetType, targetBuilding } = req.body
    const result = await notificationService.broadcast({
      title,
      message,
      type: type || 'system',
      targetType: targetType || 'all',
      targetBuilding,
    })
    return sendSuccess(res, result, `Đã gửi thông báo đến ${result.created} người dùng`)
  }
}

export const notificationController = new NotificationController()
