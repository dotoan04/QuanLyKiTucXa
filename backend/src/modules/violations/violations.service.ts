import { PrismaClient } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

interface CreateViolationInput {
  studentId: string
  incidentId?: string
  type: string
  description: string
  evidence?: any
  penaltyLevel?: 'low' | 'medium' | 'high' | 'severe'
  penaltyAmount?: number
}

interface ProcessViolationInput {
  violationId: string
  penaltyAmount: number
  notes?: string
}

class ViolationService {
  async create(data: CreateViolationInput, reportedBy: string) {
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        contracts: {
          where: { status: 'active' },
          include: { room: true },
          take: 1
        }
      }
    })

    if (!student) {
      throw AppError.notFound('Student')
    }

    if (data.incidentId) {
      const incident = await prisma.incident.findUnique({
        where: { id: data.incidentId }
      })
      if (!incident) {
        throw AppError.notFound('Incident')
      }
    }

    const violationCount = await prisma.violation.count({
      where: { studentId: data.studentId }
    })

    const penaltyLevel = data.penaltyLevel || this.determinePenaltyLevel(violationCount, data.type)
    const penaltyAmount = data.penaltyAmount || this.calculatePenaltyAmount(penaltyLevel)

    const violation = await prisma.violation.create({
      data: {
        studentId: data.studentId,
        incidentId: data.incidentId,
        type: data.type,
        description: data.description,
        evidence: data.evidence || null,
        penaltyLevel,
        penaltyAmount: new Decimal(penaltyAmount),
        reportedBy,
        status: 'pending'
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true } }
          }
        },
        incident: { select: { id: true, title: true, category: true } },
        reporter: { select: { id: true, fullName: true } }
      }
    })

    await prisma.notification.create({
      data: {
        userId: student.user.id,
        type: 'room_approved',
        title: 'Violation Recorded',
        message: `You have been recorded for violation: ${data.type}. Please check the details.`,
        referenceId: violation.id,
        referenceType: 'violation'
      }
    })

    return violation
  }

  determinePenaltyLevel(violationCount: number, type: string): 'low' | 'medium' | 'high' | 'severe' {
    const severeTypes = ['theft', 'assault', 'drug_use', 'gambling']
    const highTypes = ['damage', 'noise_excessive', 'unauthorized_guest_overnight']

    if (severeTypes.includes(type)) {
      return 'severe'
    }

    if (highTypes.includes(type)) {
      return 'high'
    }

    if (violationCount >= 3) {
      return 'high'
    }

    if (violationCount >= 2) {
      return 'medium'
    }

    return 'low'
  }

  calculatePenaltyAmount(level: 'low' | 'medium' | 'high' | 'severe'): number {
    const amounts: Record<string, number> = {
      low: 0,
      medium: 100000,
      high: 300000,
      severe: 500000
    }
    return amounts[level] || 0
  }

  async getAll(params: { status?: string; studentId?: string; page?: number; limit?: number }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.status) {
      where.status = params.status
    }
    if (params.studentId) {
      where.studentId = params.studentId
    }

    const [violations, total] = await Promise.all([
      prisma.violation.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: {
              user: { select: { id: true, fullName: true, email: true, phone: true } },
              contracts: {
                where: { status: 'active' },
                include: { room: { select: { roomNumber: true } } },
                take: 1
              }
            }
          },
          incident: { select: { id: true, title: true, category: true } },
          reporter: { select: { id: true, fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.violation.count({ where })
    ])

    return { violations, page, limit, total }
  }

  async getById(id: string, user?: { userId: string; role: string }) {
    const violation = await prisma.violation.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
            contracts: {
              where: { status: 'active' },
              include: { room: { include: { roomType: true } } },
              take: 1
            }
          }
        },
        incident: {
          include: {
            room: { select: { roomNumber: true, building: true } }
          }
        },
        reporter: { select: { id: true, fullName: true, email: true } }
      }
    })

    if (!violation) {
      throw AppError.notFound('Violation')
    }

    if (user?.role === 'student' && violation.student.user.id !== user.userId) {
      throw AppError.forbidden('You can only view your own violations')
    }

    return violation
  }

  async getMyViolations(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId },
      select: { id: true }
    })

    if (!student) {
      throw AppError.notFound('Student')
    }

    const violations = await prisma.violation.findMany({
      where: { studentId: student.id },
      include: {
        incident: { select: { id: true, title: true, category: true } },
        reporter: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const stats = {
      total: violations.length,
      pending: violations.filter(v => v.status === 'pending').length,
      processed: violations.filter(v => v.status === 'processed').length,
      appealed: violations.filter(v => v.status === 'appealed').length,
      totalPenalty: violations.reduce((sum, v) => sum + (v.penaltyAmount?.toNumber() || 0), 0)
    }

    return { violations, stats }
  }

  async process(data: ProcessViolationInput) {
    const violation = await prisma.violation.findUnique({
      where: { id: data.violationId },
      include: {
        student: {
          include: { user: true }
        }
      }
    })

    if (!violation) {
      throw AppError.notFound('Violation')
    }

    if (violation.status !== 'pending') {
      throw AppError.badRequest('Violation has already been processed')
    }

    const updated = await prisma.violation.update({
      where: { id: data.violationId },
      data: {
        penaltyAmount: new Decimal(data.penaltyAmount),
        notes: data.notes,
        status: 'processed',
        penaltyApplied: data.penaltyAmount > 0
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true } }
          }
        }
      }
    })

    if (data.penaltyAmount > 0) {
      const activeContract = await prisma.contract.findFirst({
        where: {
          studentId: violation.studentId,
          status: 'active'
        }
      })

      if (activeContract) {
        await prisma.invoice.create({
          data: {
            contractId: activeContract.id,
            invoiceMonth: new Date(),
            roomFee: new Decimal(0),
            electricityPrev: new Decimal(0),
            electricityCurr: new Decimal(0),
            electricityPrice: new Decimal(0),
            waterPrev: new Decimal(0),
            waterCurr: new Decimal(0),
            waterPrice: new Decimal(0),
            otherFees: { violation_penalty: data.penaltyAmount },
            totalAmount: new Decimal(data.penaltyAmount),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'unpaid'
          }
        })
      }
    }

    await prisma.notification.create({
      data: {
        userId: violation.student.user.id,
        type: 'room_approved',
        title: 'Violation Processed',
        message: `Your violation has been processed. Penalty: ${data.penaltyAmount.toLocaleString('vi-VN')}đ`,
        referenceId: updated.id,
        referenceType: 'violation'
      }
    })

    return updated
  }

  async getStudentViolationHistory(studentId: string) {
    const violations = await prisma.violation.findMany({
      where: { studentId },
      include: {
        incident: { select: { id: true, title: true } },
        reporter: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const stats = {
      total: violations.length,
      pending: violations.filter(v => v.status === 'pending').length,
      processed: violations.filter(v => v.status === 'processed').length,
      totalPenalty: violations.reduce((sum, v) => sum + (v.penaltyAmount?.toNumber() || 0), 0),
      byLevel: {
        low: violations.filter(v => v.penaltyLevel === 'low').length,
        medium: violations.filter(v => v.penaltyLevel === 'medium').length,
        high: violations.filter(v => v.penaltyLevel === 'high').length,
        severe: violations.filter(v => v.penaltyLevel === 'severe').length
      }
    }

    return { violations, stats }
  }

  async appeal(violationId: string, appealReason: string, userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId }
    })

    if (!student) {
      throw AppError.notFound('Student')
    }

    const violation = await prisma.violation.findUnique({
      where: { id: violationId }
    })

    if (!violation) {
      throw AppError.notFound('Violation')
    }

    if (violation.studentId !== student.id) {
      throw AppError.forbidden('You can only appeal your own violations')
    }

    if (violation.status === 'appealed') {
      throw AppError.badRequest('Violation has already been appealed')
    }

    await prisma.violation.update({
      where: { id: violationId },
      data: {
        status: 'appealed',
        notes: `${violation.notes || ''}\n\nAppeal: ${appealReason}`
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
            title: 'Violation Appeal',
            message: `Student has appealed violation: ${violation.type}`,
            referenceId: violation.id,
            referenceType: 'violation'
          }
        })
      )
    )

    return true
  }
}

export const violationService = new ViolationService()
