import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient, UserRole } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'
import { sendResetPasswordEmail } from '../../common/utils/email'

const prisma = new PrismaClient()

interface RegisterInput {
  email: string
  password: string
  fullName: string
  phone?: string
  studentCode?: string
  idCardNumber?: string
  dateOfBirth?: Date
  gender?: string
  hometown?: string
  faculty?: string
  academicYear?: number
}

interface TokenPayload {
  userId: string
  email: string
  role: UserRole
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

class AuthService {
  private generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
    })
    const refreshToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']
    })
    return { accessToken, refreshToken }
  }

  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })
    if (existingUser) {
      throw AppError.conflict('Email already registered')
    }

    if (data.studentCode) {
      const existingStudent = await prisma.student.findUnique({
        where: { studentCode: data.studentCode }
      })
      if (existingStudent) {
        throw AppError.conflict('Student code already registered')
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: UserRole.student,
          fullName: data.fullName,
          phone: data.phone
        }
      })

      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentCode: data.studentCode || `STU${Date.now()}`,
          idCardNumber: data.idCardNumber,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender as 'male' | 'female' | 'other',
          hometown: data.hometown,
          faculty: data.faculty,
          academicYear: data.academicYear
        }
      })

      return { user, student }
    })

    const tokens = this.generateTokens({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role
    })

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role
      },
      ...tokens
    }
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { student: true, staffInfo: true }
    })

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid credentials')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        student: user.student,
        staffInfo: user.staffInfo
      },
      ...tokens
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      })

      if (!user || !user.isActive) {
        throw AppError.unauthorized('Invalid refresh token')
      }

      return this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      })
    } catch {
      throw AppError.unauthorized('Invalid refresh token')
    }
  }

  async logout(_refreshToken: string) {
    return true
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true, staffInfo: true }
    })

    if (!user) {
      throw AppError.notFound('User')
    }

    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async updateUser(userId: string, data: Partial<{
    fullName: string
    phone: string
    avatarUrl: string
  }>) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        avatarUrl: data.avatarUrl
      }
    })

    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw AppError.notFound('User')
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isPasswordValid) {
      throw AppError.badRequest('Current password is incorrect')
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    })

    return true
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return true
    }

    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '1h' as jwt.SignOptions['expiresIn'] }
    )

    await sendResetPasswordEmail(email, resetToken)

    return true
  }

  async resetPassword(token: string, password: string) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; purpose: string }

      if (payload.purpose !== 'reset-password') {
        throw AppError.badRequest('Invalid reset token')
      }

      const passwordHash = await bcrypt.hash(password, 12)
      await prisma.user.update({
        where: { id: payload.userId },
        data: { passwordHash }
      })

      return true
    } catch {
      throw AppError.badRequest('Invalid or expired reset token')
    }
  }

  async getUsers(query: { page?: string; limit?: string; role?: string; search?: string }) {
    const page = parseInt(query.page || '1')
    const limit = parseInt(query.limit || '10')
    const skip = (page - 1) * limit

    const where: any = {}
    if (query.role) {
      where.role = query.role
    }
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    return { users, page, limit, total }
  }

  async deleteUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    })
    return true
  }

  async createUser(data: {
    email: string
    password: string
    fullName: string
    role: UserRole
    phone?: string
    position?: string
    department?: string
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      throw AppError.conflict('Email đã được sử dụng')
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: data.role,
          fullName: data.fullName,
          phone: data.phone,
          isActive: true
        }
      })

      if (data.role === 'staff' || data.role === 'accountant' || data.role === 'technician' || data.role === 'director') {
        await tx.staffInfo.create({
          data: {
            userId: newUser.id,
            position: data.position || 'Nhân viên',
            department: data.department || 'Ban quản lý KTX'
          }
        })
      }

      return newUser
    })

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt
    }
  }
}

export const authService = new AuthService()
