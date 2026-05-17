import { PrismaClient, ContractStatus } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'
import {
  occupantsGendersAllowStudent,
  studentGenderMatchesRoomTypeRestriction,
} from '../../common/utils/room-gender'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

interface ContractQueryParams {
  page?: number
  limit?: number
  status?: string
  studentId?: string
  roomId?: string
  search?: string
}

interface CreateContractInput {
  studentId: string
  roomId: string
  startDate: Date
  endDate?: Date
  monthlyRent: number
  depositAmount?: number
  contractPdfUrl?: string
  approvedBy?: string
}

interface UpdateContractInput {
  endDate?: Date
  status?: ContractStatus
  monthlyRent?: number
  depositAmount?: number
  contractPdfUrl?: string
  approvedBy?: string
}

class ContractService {
  async findAll(params: ContractQueryParams) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit
    const where: any = {}

    if (params.search) {
      where.OR = [
        { student: { user: { fullName: { contains: params.search, mode: 'insensitive' } } } },
        { student: { studentCode: { contains: params.search, mode: 'insensitive' } } },
        { room: { roomNumber: { contains: params.search, mode: 'insensitive' } } }
      ]
    }

    if (params.status) {
      where.status = params.status
    }

    if (params.studentId) {
      where.studentId = params.studentId
    }

    if (params.roomId) {
      where.roomId = params.roomId
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: limit,
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
          },
          approver: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.contract.count({ where })
    ])

    return {
      contracts,
      page,
      limit,
      total
    }
  }

  async findById(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true
              }
            }
          }
        },
        room: {
          include: {
            roomType: true
          }
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        invoices: {
          orderBy: { invoiceMonth: 'desc' },
          take: 6
        }
      }
    })

    if (!contract) {
      throw AppError.notFound('Contract')
    }

    return contract
  }

  async create(data: CreateContractInput) {
    // Check if student already has an active contract
    const existingContract = await prisma.contract.findFirst({
      where: {
        studentId: data.studentId,
        status: ContractStatus.active
      }
    })

    if (existingContract) {
      throw AppError.conflict('Student already has an active contract')
    }

    // Check if room exists and has capacity
    const room = await prisma.room.findFirst({
      where: { id: data.roomId },
      include: {
        roomType: true,
        _count: {
          select: {
            contracts: {
              where: { status: 'active' }
            }
          }
        }
      }
    })

    if (!room) {
      throw AppError.notFound('Room')
    }

    if (room._count.contracts >= room.roomType.capacity) {
      throw AppError.badRequest(`Room is at full capacity (${room.roomType.capacity})`)
    }

    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: { gender: true },
    })
    if (!student?.gender) {
      throw AppError.badRequest('Sinh viên chưa có giới tính trên hồ sơ — không thể tạo hợp đồng.')
    }
    if (!studentGenderMatchesRoomTypeRestriction(student.gender, room.roomType.genderRestriction)) {
      throw AppError.badRequest('Giới tính sinh viên không phù hợp với loại phòng (nam/nữ phòng riêng).')
    }
    const activeInRoom = await prisma.contract.findMany({
      where: { roomId: data.roomId, status: 'active' },
      include: { student: { select: { gender: true } } },
    })
    const occ = activeInRoom.map((c) => c.student.gender)
    if (!occupantsGendersAllowStudent(occ, student.gender)) {
      throw AppError.conflict('Phòng đang có sinh viên khác giới — không thể thêm hợp đồng vào phòng này.')
    }

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        studentId: data.studentId,
        roomId: data.roomId,
        startDate: data.startDate,
        endDate: data.endDate,
        status: ContractStatus.active,
        monthlyRent: new Decimal(data.monthlyRent),
        depositAmount: new Decimal(data.depositAmount || 0),
        contractPdfUrl: data.contractPdfUrl,
        approvedBy: data.approvedBy
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

    return contract
  }

  async update(id: string, data: UpdateContractInput) {
    const contract = await prisma.contract.findUnique({
      where: { id }
    })

    if (!contract) {
      throw AppError.notFound('Contract')
    }

    // Check if trying to activate a contract when student already has an active one
    if (data.status === ContractStatus.active && contract.status !== ContractStatus.active) {
      const existingActive = await prisma.contract.findFirst({
        where: {
          studentId: contract.studentId,
          status: ContractStatus.active,
          id: { not: id }
        }
      })

      if (existingActive) {
        throw AppError.conflict('Student already has an active contract')
      }
    }

    // Validate room capacity if changing rooms
    if (data.endDate && new Date(data.endDate) < new Date()) {
      throw AppError.badRequest('End date cannot be in the past')
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        endDate: data.endDate,
        status: data.status,
        monthlyRent: data.monthlyRent ? new Decimal(data.monthlyRent) : undefined,
        depositAmount: data.depositAmount !== undefined ? new Decimal(data.depositAmount) : undefined,
        contractPdfUrl: data.contractPdfUrl,
        approvedBy: data.approvedBy
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

    return updatedContract
  }

  async terminate(id: string, terminationReason: string, approvedBy: string) {
    const contract = await prisma.contract.findUnique({
      where: { id }
    })

    if (!contract) {
      throw AppError.notFound('Contract')
    }

    if (contract.status === ContractStatus.expired || contract.status === ContractStatus.terminated) {
      throw AppError.badRequest('Contract already terminated or expired')
    }

    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.terminated,
        endDate: new Date(),
        terminationReason,
        approvedBy
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

    return updatedContract
  }

  // ==================== REGISTRATION REQUEST METHODS ====================

  async createRegistrationRequest(data: {
    studentId: string
    preferredRoomTypeId: string
    preferredRoomId?: string
    desiredStartDate: Date
  }) {
    // Check if student already has an active contract
    const activeContract = await prisma.contract.findFirst({
      where: {
        studentId: data.studentId,
        status: ContractStatus.active
      }
    })

    if (activeContract) {
      throw AppError.conflict('Student already has an active contract')
    }

    // Check for pending registration
    const pendingRegistration = await prisma.registrationRequest.findFirst({
      where: {
        studentId: data.studentId,
        status: 'pending'
      }
    })

    if (pendingRegistration) {
      throw AppError.conflict('Student already has a pending registration request')
    }

    // Check if room type exists
    const roomType = await prisma.roomType.findUnique({
      where: { id: data.preferredRoomTypeId }
    })

    if (!roomType) {
      throw AppError.notFound('Room type')
    }

    // Check if preferred room exists if specified
    if (data.preferredRoomId) {
      const room = await prisma.room.findUnique({
        where: { id: data.preferredRoomId },
        include: { roomType: true }
      })

      if (!room || room.roomTypeId !== data.preferredRoomTypeId) {
        throw AppError.badRequest('Invalid preferred room for the selected room type')
      }
    }

    const registration = await prisma.registrationRequest.create({
      data: {
        studentId: data.studentId,
        preferredRoomTypeId: data.preferredRoomTypeId,
        preferredRoomId: data.preferredRoomId,
        desiredStartDate: data.desiredStartDate,
        status: 'pending'
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
        preferredRoomType: true,
        preferredRoom: {
          include: {
            roomType: true
          }
        }
      }
    })

    return registration
  }

  async getRegistrationRequests(params: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit
    const where: any = {}

    if (params.status) {
      where.status = params.status
    }

    if (params.search) {
      where.OR = [
        { student: { user: { fullName: { contains: params.search, mode: 'insensitive' } } } },
        { student: { studentCode: { contains: params.search, mode: 'insensitive' } } }
      ]
    }

    const [requests, total] = await Promise.all([
      prisma.registrationRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                  avatarUrl: true
                }
              }
            }
          },
          preferredRoomType: true,
          preferredRoom: {
            include: {
              roomType: true
            }
          },
          reviewer: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.registrationRequest.count({ where })
    ])

    return {
      requests,
      page,
      limit,
      total
    }
  }

  async approveRegistrationRequest(id: string, roomId: string, reviewerId: string, reviewNote?: string) {
    const request = await prisma.registrationRequest.findUnique({
      where: { id },
      include: {
        student: true
      }
    })

    if (!request) {
      throw AppError.notFound('Registration request')
    }

    if (request.status !== 'pending') {
      throw AppError.badRequest('Registration request has already been processed')
    }

    // Check if room exists and has capacity
    const room = await prisma.room.findFirst({
      where: { id: roomId },
      include: {
        roomType: true,
        _count: {
          select: {
            contracts: {
              where: { status: 'active' }
            }
          }
        }
      }
    })

    if (!room) {
      throw AppError.notFound('Room')
    }

    if (room._count.contracts >= room.roomType.capacity) {
      throw AppError.badRequest(`Room is at full capacity (${room.roomType.capacity})`)
    }

    // Create contract from registration request
    await prisma.$transaction(async (tx) => {
      await tx.contract.create({
        data: {
          studentId: request.studentId,
          roomId: roomId,
          startDate: request.desiredStartDate,
          status: ContractStatus.active,
          monthlyRent: room.roomType.monthlyPrice,
          depositAmount: room.roomType.monthlyPrice,
          approvedBy: reviewerId
        }
      })

      await tx.registrationRequest.update({
        where: { id },
        data: {
          status: 'approved',
          reviewNote,
          reviewedBy: reviewerId,
          reviewedAt: new Date()
        }
      })
    })

    return { success: true, message: 'Registration approved and contract created' }
  }

  async rejectRegistrationRequest(id: string, reviewerId: string, reviewNote: string) {
    const request = await prisma.registrationRequest.findUnique({
      where: { id }
    })

    if (!request) {
      throw AppError.notFound('Registration request')
    }

    if (request.status !== 'pending') {
      throw AppError.badRequest('Registration request has already been processed')
    }

    await prisma.registrationRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewNote,
        reviewedBy: reviewerId,
        reviewedAt: new Date()
      }
    })

    return { success: true, message: 'Registration rejected' }
  }

  // ==================== ASSET HANDOVER METHODS ====================

  async createHandover(contractId: string, confirmedBy: string, items: Array<{ name: string; condition: string; note?: string }>) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { assetHandover: true }
    })

    if (!contract) {
      throw AppError.notFound('Contract')
    }

    if (contract.assetHandover) {
      throw AppError.conflict('Handover record already exists for this contract')
    }

    const handover = await prisma.assetHandover.create({
      data: {
        contractId,
        confirmedBy,
        items: items as any,
        handoverAt: new Date()
      },
      include: {
        confirmer: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    return handover
  }

  async getHandover(contractId: string) {
    const handover = await prisma.assetHandover.findUnique({
      where: { contractId },
      include: {
        contract: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            depositAmount: true,
            status: true,
            student: {
              select: {
                studentCode: true,
                faculty: true,
                user: { select: { id: true, fullName: true, email: true, phone: true } }
              }
            },
            room: {
              select: {
                id: true,
                roomNumber: true,
                building: true,
                floor: true,
                roomType: { select: { id: true, name: true, capacity: true } }
              }
            }
          }
        },
        confirmer: {
          select: { id: true, fullName: true, email: true }
        },
        completer: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    return handover
  }

  async updateHandover(contractId: string, data: {
    items?: Array<{ name: string; condition: string; note?: string }>
    electricityInitial?: number
    waterInitial?: number
    electricityPhoto?: string
    waterPhoto?: string
    roomPhotos?: string[]
    notes?: string
  }) {
    const handover = await prisma.assetHandover.findUnique({
      where: { contractId }
    })

    if (!handover) {
      throw AppError.notFound('Handover record')
    }

    if (handover.completedAt) {
      throw AppError.badRequest('Handover already completed, cannot update')
    }

    const updated = await prisma.assetHandover.update({
      where: { contractId },
      data: {
        ...(data.items && { items: data.items as any }),
        ...(data.electricityInitial !== undefined && { electricityInitial: data.electricityInitial }),
        ...(data.waterInitial !== undefined && { waterInitial: data.waterInitial }),
        ...(data.electricityPhoto !== undefined && { electricityPhoto: data.electricityPhoto }),
        ...(data.waterPhoto !== undefined && { waterPhoto: data.waterPhoto }),
        ...(data.roomPhotos !== undefined && { roomPhotos: data.roomPhotos }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        confirmer: { select: { id: true, fullName: true, email: true } },
        completer: { select: { id: true, fullName: true, email: true } }
      }
    })

    return updated
  }

  async completeHandover(contractId: string, completedBy: string) {
    const handover = await prisma.assetHandover.findUnique({
      where: { contractId },
      include: { contract: true }
    })

    if (!handover) {
      throw AppError.notFound('Handover record')
    }

    if (handover.completedAt) {
      throw AppError.badRequest('Handover already completed')
    }

    if (handover.contract.status !== 'active') {
      throw AppError.badRequest('Contract must be active to complete handover')
    }

    const completed = await prisma.$transaction(async (tx) => {
      const updatedHandover = await tx.assetHandover.update({
        where: { contractId },
        data: {
          completedAt: new Date(),
          completedBy
        },
        include: {
          confirmer: { select: { id: true, fullName: true, email: true } },
          completer: { select: { id: true, fullName: true, email: true } }
        }
      })

      await tx.contract.update({
        where: { id: contractId },
        data: { status: 'active' as any }
      })

      return updatedHandover
    })

    return completed
  }

  async getPendingHandovers(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {
      completedAt: null,
      contract: { status: 'active' }
    }

    if (params.search) {
      where.contract = {
        ...where.contract,
        OR: [
          { student: { user: { fullName: { contains: params.search, mode: 'insensitive' } } } },
          { student: { studentCode: { contains: params.search, mode: 'insensitive' } } },
          { room: { roomNumber: { contains: params.search, mode: 'insensitive' } } }
        ]
      }
    }

    const [handovers, total] = await Promise.all([
      prisma.assetHandover.findMany({
        where,
        skip,
        take: limit,
        include: {
          contract: {
            include: {
              student: {
                include: {
                  user: { select: { id: true, fullName: true, email: true, phone: true } }
                }
              },
              room: {
                include: { roomType: true }
              }
            }
          },
          confirmer: { select: { id: true, fullName: true } }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.assetHandover.count({ where })
    ])

    return { handovers, page, limit, total }
  }

  async getStats() {
    const [total, active, expired, terminated, pending] = await Promise.all([
      prisma.contract.count(),
      prisma.contract.count({ where: { status: ContractStatus.active } }),
      prisma.contract.count({ where: { status: ContractStatus.expired } }),
      prisma.contract.count({ where: { status: ContractStatus.terminated } }),
      prisma.registrationRequest.count({ where: { status: 'pending' } })
    ])

    return {
      total,
      active,
      expired,
      terminated,
      pending,
      occupancyRate: total > 0 ? Math.round((active / total) * 100) : 0
    }
  }
}

export const contractService = new ContractService()
