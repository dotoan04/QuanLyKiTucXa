import { PrismaClient } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'

const prisma = new PrismaClient()

/** Input từ JSON body: Date hoặc YYYY-MM-DD / ISO — Prisma cần DateTime đầy đủ */
function parseLeaveDateTime(value: unknown, field: string): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw AppError.badRequest(`${field} không hợp lệ`)
  }
  const s = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
  }
  const parsed = new Date(s)
  if (Number.isNaN(parsed.getTime())) {
    throw AppError.badRequest(`${field} không hợp lệ`)
  }
  return parsed
}

function utcDayStart(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

interface TemporaryLeaveInput {
  contractId: string
  leaveDate: Date | string
  returnDate: Date | string
  reason?: string
  contactPhone?: string
  emergencyContact?: string
}

interface TemporaryLeaveStatus {
  id: string
  contractId: string
  leaveDate: Date
  returnDate: Date
  reason?: string
  status: string
  daysRemaining: number
  isOverdue: boolean
  [key: string]: unknown
}

class TemporaryLeaveService {
  async create(data: TemporaryLeaveInput, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        student: {
          include: { user: true }
        },
        room: true
      }
    })

    if (!contract) {
      throw AppError.notFound('Contract')
    }

    if (contract.status !== 'active') {
      throw AppError.badRequest('Can only register leave for active contracts')
    }

    const student = await prisma.student.findFirst({
      where: { userId }
    })

    if (!student || contract.studentId !== student.id) {
      throw AppError.forbidden('You can only register leave for your own contract')
    }

    const leaveDate = parseLeaveDateTime(data.leaveDate, 'leaveDate')
    const returnDate = parseLeaveDateTime(data.returnDate, 'returnDate')

    const todayStart = utcDayStart(new Date())
    if (utcDayStart(leaveDate) < todayStart) {
      throw AppError.badRequest('Leave date cannot be in the past')
    }

    if (utcDayStart(returnDate) <= utcDayStart(leaveDate)) {
      throw AppError.badRequest('Return date must be after leave date')
    }

    const maxLeaveDays = 30
    const leaveDuration = Math.ceil(
      (returnDate.getTime() - leaveDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (leaveDuration > maxLeaveDays) {
      throw AppError.badRequest(`Maximum leave duration is ${maxLeaveDays} days`)
    }

    const existingLeave = await prisma.temporaryLeave.findFirst({
      where: {
        contractId: data.contractId,
        status: 'active'
      }
    })

    if (existingLeave) {
      throw AppError.conflict('You already have an active temporary leave registration')
    }

    const leave = await prisma.temporaryLeave.create({
      data: {
        contractId: data.contractId,
        leaveDate,
        returnDate,
        reason: data.reason,
        contactPhone: data.contactPhone,
        emergencyContact:
          data.emergencyContact != null && String(data.emergencyContact).trim() !== ''
            ? String(data.emergencyContact).trim()
            : undefined,
        status: 'active'
      },
      include: {
        contract: {
          include: {
            student: {
              include: { user: { select: { id: true, fullName: true, email: true } } }
            },
            room: { include: { roomType: true } }
          }
        }
      }
    })

    const admins = await prisma.user.findMany({
      where: { role: 'admin', isActive: true }
    })

    await Promise.all(
      admins.map(admin =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'room_approved',
            title: 'New Temporary Leave Registration',
            message: `Student ${contract.student.user.fullName} has registered temporary leave from ${leaveDate.toLocaleDateString('vi-VN')} to ${returnDate.toLocaleDateString('vi-VN')}`,
            referenceId: leave.id,
            referenceType: 'temporary_leave'
          }
        })
      )
    )

    return leave
  }

  async getMyLeaves(userId: string): Promise<TemporaryLeaveStatus[]> {
    const student = await prisma.student.findFirst({
      where: { userId }
    })

    if (!student) {
      throw AppError.notFound('Student')
    }

    const contracts = await prisma.contract.findMany({
      where: { studentId: student.id },
      select: { id: true }
    })

    const contractIds = contracts.map(c => c.id)

    const leaves = await prisma.temporaryLeave.findMany({
      where: {
        contractId: { in: contractIds }
      },
      include: {
        contract: {
          include: {
            room: { include: { roomType: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const now = new Date()

    return leaves.map(leave => {
      const daysRemaining = Math.ceil(
        (new Date(leave.returnDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      const isOverdue = daysRemaining < 0 && leave.status === 'active'

      return {
        ...leave,
        reason: leave.reason ?? undefined,
        daysRemaining,
        isOverdue
      }
    })
  }

  async getAllLeaves(params: { status?: string; page?: number; limit?: number }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.status) {
      where.status = params.status
    }

    const [leaves, total] = await Promise.all([
      prisma.temporaryLeave.findMany({
        where,
        skip,
        take: limit,
        include: {
          contract: {
            include: {
              student: {
                include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
              },
              room: { include: { roomType: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.temporaryLeave.count({ where })
    ])

    return { leaves, page, limit, total }
  }

  async markAsReturned(id: string) {
    const leave = await prisma.temporaryLeave.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            student: { include: { user: true } }
          }
        }
      }
    })

    if (!leave) {
      throw AppError.notFound('Temporary leave')
    }

    if (leave.status !== 'active') {
      throw AppError.badRequest('Leave is not active')
    }

    const updated = await prisma.temporaryLeave.update({
      where: { id },
      data: {
        status: 'returned',
        actualReturnDate: new Date()
      }
    })

    await prisma.notification.create({
      data: {
        userId: leave.contract.student.userId,
        type: 'room_approved',
        title: 'Welcome Back',
        message: `Your temporary leave has been marked as returned. Welcome back!`,
        referenceId: leave.id,
        referenceType: 'temporary_leave'
      }
    })

    return updated
  }

  async cancel(id: string, userId: string) {
    const leave = await prisma.temporaryLeave.findUnique({
      where: { id },
      include: {
        contract: {
          include: { student: true }
        }
      }
    })

    if (!leave) {
      throw AppError.notFound('Temporary leave')
    }

    const student = await prisma.student.findFirst({
      where: { userId }
    })

    if (!student || leave.contract.studentId !== student.id) {
      throw AppError.forbidden('You can only cancel your own leave registration')
    }

    if (leave.status !== 'active') {
      throw AppError.badRequest('Can only cancel active leave registrations')
    }

    await prisma.temporaryLeave.update({
      where: { id },
      data: { status: 'cancelled' }
    })

    return true
  }

  async checkOverdueLeaves() {
    const now = new Date()

    const overdueLeaves = await prisma.temporaryLeave.findMany({
      where: {
        status: 'active',
        returnDate: { lt: now }
      },
      include: {
        contract: {
          include: {
            student: {
              include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
            },
            room: { include: { roomType: true } }
          }
        }
      }
    })

    await Promise.all(
      overdueLeaves.map(leave =>
        prisma.temporaryLeave.update({
          where: { id: leave.id },
          data: { status: 'overdue' }
        })
      )
    )

    await Promise.all(
      overdueLeaves.map(leave =>
        prisma.notification.create({
          data: {
            userId: leave.contract.student.user.id,
            type: 'room_approved',
            title: 'Overdue Leave',
            message: `Your temporary leave is overdue. Please return immediately or contact admin.`,
            referenceId: leave.id,
            referenceType: 'temporary_leave'
          }
        })
      )
    )

    return {
      overdueCount: overdueLeaves.length,
      leaves: overdueLeaves
    }
  }
}

export const temporaryLeaveService = new TemporaryLeaveService()
