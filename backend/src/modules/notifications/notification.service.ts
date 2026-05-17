import { PrismaClient, NotificationType } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'

const prisma = new PrismaClient()

interface NotificationQueryParams {
  page?: number
  limit?: number
  isRead?: boolean
  type?: string
  search?: string
}

class NotificationService {
  async findAll(userId: string, params: NotificationQueryParams) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit
    const where: any = { userId }

    if (params.isRead !== undefined) {
      where.isRead = params.isRead
    }

    if (params.type) {
      where.type = params.type
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { message: { contains: params.search, mode: 'insensitive' } }
      ]
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
    ])

    return {
      notifications,
      page,
      limit,
      total,
      unreadCount
    }
  }

  async findById(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!notification) {
      throw AppError.notFound('Notification')
    }

    return notification
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!notification) {
      throw AppError.notFound('Notification')
    }

    if (notification.isRead) {
      return notification
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    })

    return updated
  }

  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    })

    return {
      updated: result.count
    }
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!notification) {
      throw AppError.notFound('Notification')
    }

    await prisma.notification.delete({
      where: { id }
    })

    return true
  }

  async clearReadNotifications(userId: string) {
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true
      }
    })

    return {
      deleted: result.count
    }
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    })

    return { count }
  }

  async getStats(userId: string) {
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
    ])

    return {
      total,
      unread,
      read,
      byType: byType.map(stat => ({
        type: stat.type,
        count: stat._count.id
      }))
    }
  }

  async createNotification(data: {
    userId: string
    type: string
    title: string
    message: string
    referenceId?: string
    referenceType?: string
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        referenceId: data.referenceId,
        referenceType: data.referenceType
      }
    })

    return notification
  }

  async createBatchNotifications(notifications: Array<{
    userId: string
    type: NotificationType
    title: string
    message: string
    referenceId?: string
    referenceType?: string
  }>) {
    const result = await prisma.notification.createMany({
      data: notifications
    })

    return {
      created: result.count
    }
  }

  async getRecentNotifications(userId: string, limit: number = 5) {
    const notifications = await prisma.notification.findMany({
      where: {
        userId
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    return notifications
  }

  async cleanupOldNotifications(userId: string, daysOld: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    return {
      deleted: result.count
    }
  }

  async broadcast(data: {
    title: string
    message: string
    type: string
    targetType: string
    targetBuilding?: string
  }) {
    let targetUsers: { id: string }[]

    if (data.targetType === 'building' && data.targetBuilding) {
      // Find users who are students in rooms of the specified building
      const studentsInBuilding = await prisma.student.findMany({
        where: {
          contracts: {
            some: {
              status: 'active',
              room: { building: data.targetBuilding }
            }
          }
        },
        select: { userId: true }
      })
      targetUsers = studentsInBuilding.map(s => ({ id: s.userId }))
    } else {
      // All active users
      targetUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      })
    }

    if (targetUsers.length === 0) {
      return { created: 0 }
    }

    const notifications = targetUsers.map(u => ({
      userId: u.id,
      type: data.type as any,
      title: data.title,
      message: data.message,
    }))

    // Batch create in chunks of 100 to avoid DB limits
    const CHUNK_SIZE = 100
    let totalCreated = 0
    for (let i = 0; i < notifications.length; i += CHUNK_SIZE) {
      const chunk = notifications.slice(i, i + CHUNK_SIZE)
      const result = await prisma.notification.createMany({ data: chunk })
      totalCreated += result.count
    }

    return { created: totalCreated }
  }
}

export const notificationService = new NotificationService()
