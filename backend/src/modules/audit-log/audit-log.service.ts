import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface GetAllParams {
  page: number
  limit: number
  action?: string
  entity?: string
  userId?: string
  startDate?: Date
  endDate?: Date
}

class AuditLogService {
  async create(data: {
    userId?: string
    action: string
    entity?: string
    entityId?: string
    details?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  }) {
    return prisma.auditLog.create({ data: data as never })
  }

  async getAll({ page, limit, action, entity, userId, startDate, endDate }: GetAllParams) {
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (action) where.action = action
    if (entity) where.entity = entity
    if (userId) where.userId = userId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) (where.createdAt as Record<string, Date>).gte = startDate
      if (endDate) (where.createdAt as Record<string, Date>).lte = endDate
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, fullName: true } } }
      }),
      prisma.auditLog.count({ where })
    ])

    return { items: logs, page, limit, total }
  }

  async getById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, fullName: true } } }
    })
  }

  async getByEntity(entity: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, fullName: true } } }
    })
  }
}

export const auditLogService = new AuditLogService()
