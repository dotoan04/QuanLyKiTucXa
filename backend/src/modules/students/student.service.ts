import { PrismaClient } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'

const prisma = new PrismaClient()

interface StudentQueryParams {
  page?: number
  limit?: number
  search?: string
  faculty?: string
  academicYear?: number
}

interface UpdateStudentInput {
  dateOfBirth?: Date
  gender?: 'male' | 'female' | 'other'
  hometown?: string
  address?: string
  faculty?: string
  academicYear?: number
  priorityGroup?: string
  emergencyContact?: any
  idCardNumber?: string
  phone?: string
}

class StudentService {
  async findAll(params: StudentQueryParams) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.search) {
      where.OR = [
        { user: { fullName: { contains: params.search, mode: 'insensitive' } } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
        { studentCode: { contains: params.search, mode: 'insensitive' } }
      ]
    }

    if (params.faculty) {
      where.faculty = { contains: params.faculty, mode: 'insensitive' }
    }

    if (params.academicYear) {
      where.academicYear = params.academicYear
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              isActive: true,
              createdAt: true
            }
          }
        },
        orderBy: { user: { createdAt: 'desc' } }
      }),
      prisma.student.count({ where })
    ])

    return {
      students,
      page,
      limit,
      total
    }
  }

  async findById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true
          }
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
          include: {
            room: {
              include: {
                roomType: true
              }
            }
          }
        },
        _count: {
          select: {
            contracts: {
              where: { status: 'active' }
            }
          }
        }
      }
    })

    if (!student) {
      throw AppError.notFound('Student')
    }

    return student
  }

  async findByCode(studentCode: string) {
    const student = await prisma.student.findFirst({
      where: { studentCode: { equals: studentCode, mode: 'insensitive' } },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            isActive: true
          }
        },
        contracts: {
          where: { status: 'active' },
          include: {
            room: { include: { roomType: true } }
          }
        },
        _count: {
          select: { contracts: { where: { status: 'active' } } }
        }
      }
    })

    if (!student) {
      throw AppError.notFound('Student')
    }

    return student
  }

  async findByUserId(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            isActive: true
          }
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
          include: {
            room: {
              include: {
                roomType: true
              }
            }
          }
        },
        _count: {
          select: {
            contracts: {
              where: { status: 'active' }
            }
          }
        }
      }
    })

    if (!student) {
      return null
    }

    return student
  }

  async update(id: string, data: UpdateStudentInput) {
    const student = await prisma.student.findUnique({
      where: { id }
    })

    if (!student) {
      throw AppError.notFound('Student')
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        hometown: data.hometown,
        address: data.address,
        faculty: data.faculty,
        academicYear: data.academicYear,
        priorityGroup: data.priorityGroup,
        emergencyContact: data.emergencyContact,
        idCardNumber: data.idCardNumber,
        user: data.phone ? {
          update: { phone: data.phone }
        } : undefined
      },
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
    })

    return updatedStudent
  }

  async getStudentContracts(studentId: string) {
    const contracts = await prisma.contract.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        room: {
          include: {
            roomType: true
          }
        }
      }
    })

    return contracts
  }

  async getStudentInvoices(studentId: string) {
    const invoices = await prisma.invoice.findMany({
      where: {
        contract: {
          studentId
        }
      },
      orderBy: { invoiceMonth: 'desc' },
      include: {
        contract: {
          include: {
            room: {
              include: {
                roomType: true
              }
            }
          }
        }
      }
    })

    return invoices
  }

  async getStudentIncidents(studentId: string) {
    const incidents = await prisma.incident.findMany({
      where: { reporterId: studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        room: {
          include: {
            roomType: true
          }
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    return incidents
  }

  async getStats() {
    const [totalStudents, activeContracts, studentsByFaculty, studentsByYear] = await Promise.all([
      prisma.student.count(),
      prisma.contract.count({ where: { status: 'active' } }),
      prisma.student.groupBy({
        by: ['faculty'],
        _count: {
          id: true
        },
        where: {
          faculty: {
            not: null
          }
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      }),
      prisma.student.groupBy({
        by: ['academicYear'],
        _count: {
          id: true
        },
        where: {
          academicYear: {
            not: null
          }
        },
        orderBy: {
          academicYear: 'asc'
        }
      })
    ])

    return {
      totalStudents,
      activeContracts,
      occupancyRate: totalStudents > 0 ? Math.round((activeContracts / totalStudents) * 100) : 0,
      studentsByFaculty: studentsByFaculty.map(s => ({
        faculty: s.faculty,
        count: s._count.id
      })),
      studentsByYear: studentsByYear.map(s => ({
        year: s.academicYear,
        count: s._count.id
      }))
    }
  }
}

export const studentService = new StudentService()
