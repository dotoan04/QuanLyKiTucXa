import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface GetAllParams {
  page: number
  limit: number
  status?: string
  type?: string
  roomId?: string
  startDate?: Date
  endDate?: Date
}

class MaintenanceService {
  async getAll({ page, limit, status, type, roomId, startDate, endDate }: GetAllParams) {
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (type) where.type = type
    if (roomId) where.roomId = roomId
    if (startDate || endDate) {
      where.scheduledAt = {}
      if (startDate) (where.scheduledAt as Record<string, Date>).gte = startDate
      if (endDate) (where.scheduledAt as Record<string, Date>).lte = endDate
    }

    const [items, total] = await Promise.all([
      prisma.scheduledMaintenance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          room: { select: { id: true, roomNumber: true, building: true, floor: true } },
          assignee: { select: { id: true, fullName: true, email: true } }
        }
      }),
      prisma.scheduledMaintenance.count({ where })
    ])

    return { items, page, limit, total }
  }

  async getById(id: string) {
    return prisma.scheduledMaintenance.findUnique({
      where: { id },
      include: {
        room: { select: { id: true, roomNumber: true, building: true, floor: true } },
        assignee: { select: { id: true, fullName: true, email: true } }
      }
    })
  }

  async create(data: {
    title: string
    description?: string
    type: string
    roomId?: string
    area?: string
    scheduledAt: Date
    assigneeId?: string
  }) {
    return prisma.scheduledMaintenance.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type as 'preventive' | 'corrective' | 'inspection' | 'emergency',
        roomId: data.roomId,
        area: data.area,
        scheduledAt: data.scheduledAt,
        assigneeId: data.assigneeId,
        status: 'scheduled'
      },
      include: {
        room: { select: { id: true, roomNumber: true, building: true, floor: true } },
        assignee: { select: { id: true, fullName: true, email: true } }
      }
    })
  }

  async update(id: string, data: {
    title?: string
    description?: string
    type?: string
    roomId?: string
    area?: string
    scheduledAt?: Date
    assigneeId?: string
  }) {
    return prisma.scheduledMaintenance.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        type: data.type as 'preventive' | 'corrective' | 'inspection' | 'emergency' | undefined,
        roomId: data.roomId,
        area: data.area,
        scheduledAt: data.scheduledAt,
        assigneeId: data.assigneeId
      },
      include: {
        room: { select: { id: true, roomNumber: true, building: true, floor: true } },
        assignee: { select: { id: true, fullName: true, email: true } }
      }
    })
  }

  async complete(id: string, notes?: string, cost?: number) {
    return prisma.scheduledMaintenance.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        notes,
        cost: cost ? cost : undefined
      },
      include: {
        room: { select: { id: true, roomNumber: true, building: true, floor: true } },
        assignee: { select: { id: true, fullName: true, email: true } }
      }
    })
  }

  async delete(id: string) {
    return prisma.scheduledMaintenance.delete({ where: { id } })
  }
}

export const maintenanceService = new MaintenanceService()
