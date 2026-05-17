import { Request, Response, NextFunction } from 'express'
import { authService } from './auth.service'
import { sendSuccess, sendCreated } from '../../common/utils/response'
import { UserRole } from '@prisma/client'
import { auditLogService } from '../audit-log/audit-log.service'

class AuthController {
  register = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await authService.register(req.body)
    return sendCreated(res, result, 'Registration successful')
  }

  login = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await authService.login(req.body.email, req.body.password)
    auditLogService.create({
      userId: result.user?.id,
      action: 'login',
      entity: 'User',
      entityId: result.user?.id,
      details: { email: req.body.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {})
    return sendSuccess(res, result, 'Login successful')
  }

  refreshToken = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await authService.refreshToken(req.body.refreshToken)
    return sendSuccess(res, result, 'Token refreshed')
  }

  logout = async (req: Request, res: Response, _next: NextFunction) => {
    await authService.logout(req.body.refreshToken)
    return sendSuccess(res, null, 'Logged out successfully')
  }

  getMe = async (req: Request, res: Response, _next: NextFunction) => {
    const user = await authService.getUserById(req.user!.userId)
    return sendSuccess(res, user)
  }

  updateMe = async (req: Request, res: Response, _next: NextFunction) => {
    const user = await authService.updateUser(req.user!.userId, req.body)
    return sendSuccess(res, user, 'Profile updated')
  }

  changePassword = async (req: Request, res: Response, _next: NextFunction) => {
    await authService.changePassword(
      req.user!.userId,
      req.body.currentPassword,
      req.body.newPassword
    )
    return sendSuccess(res, null, 'Password changed successfully')
  }

  forgotPassword = async (req: Request, res: Response, _next: NextFunction) => {
    await authService.forgotPassword(req.body.email)
    return sendSuccess(res, null, 'Reset email sent if account exists')
  }

  resetPassword = async (req: Request, res: Response, _next: NextFunction) => {
    await authService.resetPassword(req.body.token, req.body.password)
    return sendSuccess(res, null, 'Password reset successful')
  }

  getUsers = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await authService.getUsers(req.query)
    return sendSuccess(res, result)
  }

  getUser = async (req: Request, res: Response, _next: NextFunction) => {
    const user = await authService.getUserById(req.params.id)
    return sendSuccess(res, user)
  }

  createUser = async (req: Request, res: Response, _next: NextFunction) => {
    const user = await authService.createUser({
      email: req.body.email,
      password: req.body.password,
      fullName: req.body.fullName,
      role: req.body.role as UserRole,
      phone: req.body.phone,
      position: req.body.position,
      department: req.body.department
    })
    auditLogService.create({
      userId: req.user?.userId,
      action: 'create',
      entity: 'User',
      entityId: user.id,
      details: { email: req.body.email, role: req.body.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {})
    return sendCreated(res, user, 'Tạo tài khoản thành công')
  }

  updateUser = async (req: Request, res: Response, _next: NextFunction) => {
    const user = await authService.updateUser(req.params.id, req.body)
    return sendSuccess(res, user, 'Cập nhật thành công')
  }

  deleteUser = async (req: Request, res: Response, _next: NextFunction) => {
    await authService.deleteUser(req.params.id)
    return sendSuccess(res, null, 'Đã vô hiệu hóa tài khoản')
  }
}

export const authController = new AuthController()
