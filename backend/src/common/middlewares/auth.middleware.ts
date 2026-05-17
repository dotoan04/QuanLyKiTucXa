import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient, UserRole } from '@prisma/client'
import { AppError } from '../utils/app-error'

const prisma = new PrismaClient()

export interface AuthPayload {
  userId: string
  email: string
  role: UserRole
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 'Access token required', 401)
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new AppError('SERVER_ERROR', 'JWT secret not configured', 500)
    }

    const payload = jwt.verify(token, secret) as AuthPayload

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true }
    })

    if (!user || !user.isActive) {
      throw new AppError('UNAUTHORIZED', 'User not found or inactive', 401)
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401))
    } else {
      next(error)
    }
  }
}

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED', 'Authentication required', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('FORBIDDEN', 'Insufficient permissions', 403))
    }

    next()
  }
}

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const secret = process.env.JWT_SECRET
      if (secret) {
        const payload = jwt.verify(token, secret) as AuthPayload
        req.user = payload
      }
    }
    next()
  } catch {
    next()
  }
}
