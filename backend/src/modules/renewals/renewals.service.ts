import { PrismaClient, ContractStatus } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'

const prisma = new PrismaClient()

interface RenewContractInput {
  contractId: string
  newEndDate: Date
  newMonthlyRent?: number
  additionalDeposit?: number
  keepSameRoom: boolean
}

interface RenewalEligibility {
  contractId: string
  studentId: string
  currentEndDate: Date | null
  daysUntilExpiry: number
  isEligible: boolean
  reason?: string
}

class RenewalService {
  async checkRenewalEligibility(contractId: string): Promise<RenewalEligibility> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        student: true,
        room: { include: { roomType: true } }
      }
    })

    if (!contract) {
      throw AppError.notFound('Contract')
    }

    if (contract.status !== ContractStatus.active) {
      return {
        contractId,
        studentId: contract.studentId,
        currentEndDate: contract.endDate,
        daysUntilExpiry: 0,
        isEligible: false,
        reason: 'Contract is not active'
      }
    }

    if (!contract.endDate) {
      return {
        contractId,
        studentId: contract.studentId,
        currentEndDate: null,
        daysUntilExpiry: 999,
        isEligible: true
      }
    }

    const now = new Date()
    const daysUntilExpiry = Math.ceil(
      (contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilExpiry > 30) {
      return {
        contractId,
        studentId: contract.studentId,
        currentEndDate: contract.endDate,
        daysUntilExpiry,
        isEligible: false,
        reason: 'Contract can only be renewed within 30 days of expiry'
      }
    }

    const unpaidInvoices = await prisma.invoice.count({
      where: {
        contractId,
        status: { in: ['unpaid', 'overdue'] }
      }
    })

    if (unpaidInvoices > 0) {
      return {
        contractId,
        studentId: contract.studentId,
        currentEndDate: contract.endDate,
        daysUntilExpiry,
        isEligible: false,
        reason: `You have ${unpaidInvoices} unpaid invoice(s). Please pay before renewing.`
      }
    }

    return {
      contractId,
      studentId: contract.studentId,
      currentEndDate: contract.endDate,
      daysUntilExpiry,
      isEligible: true
    }
  }

  async getContractsExpiringSoon(days: number = 30) {
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const contracts = await prisma.contract.findMany({
      where: {
        status: ContractStatus.active,
        endDate: {
          gte: now,
          lte: futureDate
        }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        room: {
          include: {
            roomType: true
          }
        }
      },
      orderBy: {
        endDate: 'asc'
      }
    })

    return contracts
  }

  async renewContract(data: RenewContractInput, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        student: {
          include: { user: true }
        },
        room: {
          include: { roomType: true }
        }
      }
    })

    if (!contract) {
      throw AppError.notFound('Contract')
    }

    const student = await prisma.student.findFirst({
      where: { userId }
    })

    if (!student || contract.studentId !== student.id) {
      throw AppError.forbidden('You can only renew your own contract')
    }

    const eligibility = await this.checkRenewalEligibility(data.contractId)
    if (!eligibility.isEligible) {
      throw AppError.badRequest(eligibility.reason || 'Contract is not eligible for renewal')
    }

    if (data.newEndDate <= new Date()) {
      throw AppError.badRequest('New end date must be in the future')
    }

    if (contract.endDate && data.newEndDate <= contract.endDate) {
      throw AppError.badRequest('New end date must be after current end date')
    }

    const newMonthlyRent = data.newMonthlyRent || contract.room.roomType.monthlyPrice.toNumber()

    const updatedContract = await prisma.contract.update({
      where: { id: data.contractId },
      data: {
        endDate: data.newEndDate,
        monthlyRent: newMonthlyRent,
        depositAmount: data.additionalDeposit
          ? contract.depositAmount.toNumber() + data.additionalDeposit
          : contract.depositAmount
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        room: {
          include: {
            roomType: true
          }
        }
      }
    })

    await prisma.notification.create({
      data: {
        userId: contract.student.userId,
        type: 'room_approved',
        title: 'Contract Renewed',
        message: `Your contract has been renewed until ${data.newEndDate.toLocaleDateString('vi-VN')}`,
        referenceId: updatedContract.id,
        referenceType: 'contract'
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
            title: 'Contract Renewed',
            message: `Contract for ${contract.student.user.fullName} has been renewed until ${data.newEndDate.toLocaleDateString('vi-VN')}`,
            referenceId: updatedContract.id,
            referenceType: 'contract'
          }
        })
      )
    )

    return updatedContract
  }

  async sendRenewalReminders() {
    const expiringContracts = await this.getContractsExpiringSoon(30)

    const notifications = await Promise.all(
      expiringContracts.map(contract =>
        prisma.notification.create({
          data: {
            userId: contract.student.userId,
            type: 'room_approved',
            title: 'Contract Expiring Soon',
            message: `Your contract will expire on ${contract.endDate?.toLocaleDateString('vi-VN')}. Please renew if you wish to continue staying.`,
            referenceId: contract.id,
            referenceType: 'contract'
          }
        })
      )
    )

    return {
      sent: notifications.length,
      contracts: expiringContracts
    }
  }

  async getRenewalHistory(contractId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        },
        room: {
          include: { roomType: true }
        }
      }
    })

    if (!contract) {
      throw AppError.notFound('Contract')
    }

    const previousContracts = await prisma.contract.findMany({
      where: {
        studentId: contract.studentId,
        roomId: contract.roomId,
        id: { not: contractId }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return {
      current: contract,
      previous: previousContracts
    }
  }
}

export const renewalService = new RenewalService()
