import { PrismaClient, ContractStatus, RoomStatus } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'
import { buildHandoverItemsForRoom } from '../../common/utils/handover-items'
import {
  occupantsGendersAllowStudent,
  studentGenderMatchesRoomTypeRestriction,
} from '../../common/utils/room-gender'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

interface TransferRequestInput {
  contractId: string
  toRoomId: string
  reason?: string
}

interface ProcessTransferInput {
  transferId: string
  status: 'approved' | 'rejected'
  reviewNote?: string
}

class TransferService {
  async createTransferRequest(data: TransferRequestInput, userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        student: { include: { user: true } },
        room: { include: { roomType: true } }
      }
    })

    if (!contract) {
      throw AppError.notFound('Contract')
    }

    if (contract.status !== ContractStatus.active) {
      throw AppError.badRequest('Can only transfer active contracts')
    }

    const student = await prisma.student.findFirst({
      where: { userId }
    })

    if (!student || contract.studentId !== student.id) {
      throw AppError.forbidden('You can only transfer your own contract')
    }

    const toRoom = await prisma.room.findUnique({
      where: { id: data.toRoomId },
      include: {
        roomType: true,
        _count: {
          select: {
            contracts: {
              where: { status: ContractStatus.active }
            }
          }
        }
      }
    })

    if (!toRoom) {
      throw AppError.notFound('Target room')
    }

    if (toRoom.status !== RoomStatus.available && toRoom.status !== RoomStatus.occupied) {
      throw AppError.badRequest('Target room is not available')
    }

    if (toRoom._count.contracts >= toRoom.roomType.capacity) {
      throw AppError.badRequest('Target room is at full capacity')
    }

    const stGender = contract.student.gender
    if (!stGender) {
      throw AppError.badRequest('Hồ sơ sinh viên chưa có giới tính — không thể đăng ký chuyển phòng.')
    }
    if (!studentGenderMatchesRoomTypeRestriction(stGender, toRoom.roomType.genderRestriction)) {
      throw AppError.badRequest('Phòng đích không phù hợp giới tính của bạn (nam/nữ phòng riêng).')
    }
    const activeInTarget = await prisma.contract.findMany({
      where: { roomId: data.toRoomId, status: ContractStatus.active },
      include: { student: { select: { gender: true } } },
    })
    const occ = activeInTarget.map((c) => c.student.gender)
    if (!occupantsGendersAllowStudent(occ, stGender)) {
      throw AppError.badRequest('Phòng đích đang có sinh viên khác giới — không thể chuyển vào.')
    }

    const existingTransfer = await prisma.roomTransfer.findFirst({
      where: {
        contractId: data.contractId,
        status: 'pending'
      }
    })

    if (existingTransfer) {
      throw AppError.conflict('You already have a pending transfer request')
    }

    const transferFee = toRoom.roomType.monthlyPrice.greaterThan(contract.room.roomType.monthlyPrice)
      ? new Decimal(200000)
      : new Decimal(0)

    const transfer = await prisma.roomTransfer.create({
      data: {
        contractId: data.contractId,
        fromRoomId: contract.roomId,
        toRoomId: data.toRoomId,
        reason: data.reason,
        status: 'pending',
        transferFee
      },
      include: {
        contract: {
          include: {
            student: {
              include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
            }
          }
        },
        fromRoom: { include: { roomType: true } },
        toRoom: { include: { roomType: true } }
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
            title: 'New Transfer Request',
            message: `Student ${contract.student.user.fullName} requests to transfer from room ${contract.room.roomNumber} to room ${toRoom.roomNumber}`,
            referenceId: transfer.id,
            referenceType: 'room_transfer'
          }
        })
      )
    )

    return transfer
  }

  async getAllTransfers(params: { status?: string; page?: number; limit?: number }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.status) {
      where.status = params.status
    }

    const [transfers, total] = await Promise.all([
      prisma.roomTransfer.findMany({
        where,
        skip,
        take: limit,
        include: {
          contract: {
            include: {
              student: {
                include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
              }
            }
          },
          fromRoom: { include: { roomType: true } },
          toRoom: { include: { roomType: true } },
          reviewer: { select: { id: true, fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.roomTransfer.count({ where })
    ])

    return { transfers, page, limit, total }
  }

  async getMyTransfers(userId: string) {
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

    return prisma.roomTransfer.findMany({
      where: {
        contractId: { in: contractIds }
      },
      include: {
        fromRoom: { include: { roomType: true } },
        toRoom: { include: { roomType: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async processTransfer(data: ProcessTransferInput, reviewerId: string) {
    const transfer = await prisma.roomTransfer.findUnique({
      where: { id: data.transferId },
      include: {
        contract: {
          include: {
            student: { include: { user: true } }
          }
        },
        fromRoom: true,
        toRoom: {
          include: {
            roomType: true,
            _count: {
              select: {
                contracts: {
                  where: { status: ContractStatus.active }
                }
              }
            }
          }
        }
      }
    })

    if (!transfer) {
      throw AppError.notFound('Transfer request')
    }

    if (transfer.status !== 'pending') {
      throw AppError.badRequest('Transfer has already been processed')
    }

    if (data.status === 'rejected') {
      await prisma.roomTransfer.update({
        where: { id: data.transferId },
        data: {
          status: 'rejected',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNote: data.reviewNote
        }
      })

      await prisma.notification.create({
        data: {
          userId: transfer.contract.student.userId,
          type: 'room_approved',
          title: 'Transfer Request Rejected',
          message: `Your transfer request to room ${transfer.toRoom.roomNumber} has been rejected. ${data.reviewNote || ''}`,
          referenceId: transfer.id,
          referenceType: 'room_transfer'
        }
      })

      return { status: 'rejected' }
    }

    if (transfer.toRoom._count.contracts >= transfer.toRoom.roomType.capacity) {
      throw AppError.badRequest('Target room is now at full capacity')
    }

    const stGenderApprove = transfer.contract.student.gender
    if (!stGenderApprove) {
      throw AppError.badRequest('Sinh viên chưa có giới tính trên hồ sơ — không thể duyệt chuyển phòng.')
    }
    if (!studentGenderMatchesRoomTypeRestriction(stGenderApprove, transfer.toRoom.roomType.genderRestriction)) {
      throw AppError.badRequest('Phòng đích không phù hợp giới tính sinh viên (nam/nữ phòng riêng).')
    }
    const activeInTargetApprove = await prisma.contract.findMany({
      where: { roomId: transfer.toRoomId, status: ContractStatus.active },
      include: { student: { select: { gender: true } } },
    })
    const occApprove = activeInTargetApprove.map((c) => c.student.gender)
    if (!occupantsGendersAllowStudent(occApprove, stGenderApprove)) {
      throw AppError.badRequest('Phòng đích có sinh viên khác giới — không thể duyệt chuyển phòng.')
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: transfer.contractId },
        data: {
          roomId: transfer.toRoomId,
          monthlyRent: transfer.toRoom.roomType.monthlyPrice
        }
      })

      await tx.room.update({
        where: { id: transfer.fromRoomId },
        data: {
          currentOccupancy: { decrement: 1 }
        }
      })

      await tx.room.update({
        where: { id: transfer.toRoomId },
        data: {
          currentOccupancy: { increment: 1 },
          status: RoomStatus.occupied
        }
      })

      const hoItems = buildHandoverItemsForRoom(transfer.toRoom)
      const existingHo = await tx.assetHandover.findUnique({
        where: { contractId: transfer.contractId }
      })
      if (existingHo) {
        await tx.assetHandover.update({
          where: { contractId: transfer.contractId },
          data: {
            items: hoItems as any,
            completedAt: null,
            completedBy: null,
            handoverAt: new Date(),
            notes: null,
            electricityInitial: null,
            waterInitial: null,
            electricityPhoto: null,
            waterPhoto: null,
            roomPhotos: []
          }
        })
      } else {
        await tx.assetHandover.create({
          data: {
            contractId: transfer.contractId,
            items: hoItems as any
          }
        })
      }

      return tx.roomTransfer.update({
        where: { id: data.transferId },
        data: {
          status: 'completed',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNote: data.reviewNote
        }
      })
    })

    await prisma.notification.create({
      data: {
        userId: transfer.contract.student.userId,
        type: 'room_approved',
        title: 'Transfer Completed',
        message: `Your transfer to room ${transfer.toRoom.roomNumber} has been completed. Please check your new room.`,
        referenceId: transfer.id,
        referenceType: 'room_transfer'
      }
    })

    return result
  }

  async cancelTransfer(transferId: string, userId: string) {
    const transfer = await prisma.roomTransfer.findUnique({
      where: { id: transferId },
      include: {
        contract: {
          include: { student: true }
        }
      }
    })

    if (!transfer) {
      throw AppError.notFound('Transfer request')
    }

    const student = await prisma.student.findFirst({
      where: { userId }
    })

    if (!student || transfer.contract.studentId !== student.id) {
      throw AppError.forbidden('You can only cancel your own transfer request')
    }

    if (transfer.status !== 'pending') {
      throw AppError.badRequest('Can only cancel pending transfers')
    }

    await prisma.roomTransfer.update({
      where: { id: transferId },
      data: { status: 'cancelled' }
    })

    return true
  }

  async getTransferFee(fromRoomId: string, toRoomId: string) {
    const [fromRoom, toRoom] = await Promise.all([
      prisma.room.findUnique({
        where: { id: fromRoomId },
        include: { roomType: true }
      }),
      prisma.room.findUnique({
        where: { id: toRoomId },
        include: { roomType: true }
      })
    ])

    if (!fromRoom || !toRoom) {
      throw AppError.notFound('Room')
    }

    const fee = toRoom.roomType.monthlyPrice.greaterThan(fromRoom.roomType.monthlyPrice)
      ? new Decimal(200000)
      : new Decimal(0)

    return {
      fromRoom: {
        id: fromRoom.id,
        roomNumber: fromRoom.roomNumber,
        price: fromRoom.roomType.monthlyPrice.toNumber()
      },
      toRoom: {
        id: toRoom.id,
        roomNumber: toRoom.roomNumber,
        price: toRoom.roomType.monthlyPrice.toNumber()
      },
      fee: fee.toNumber()
    }
  }
}

export const transferService = new TransferService()
