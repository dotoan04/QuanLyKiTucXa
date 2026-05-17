import { Request, Response, NextFunction } from 'express'
import { sendSuccess, sendCreated } from '../../common/utils/response'
import { registrationService } from './registrations.service'

class RegistrationController {
  getAll = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as string,
      studentId: req.query.studentId as string,
    }
    const result = await registrationService.findAll(params)
    return sendSuccess(res, result)
  }

  getById = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await registrationService.findById(req.params.id)
    return sendSuccess(res, result)
  }

  create = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const body = { ...req.body } as Record<string, unknown>
    let documents: string[] = []
    const raw = body.documents
    if (Array.isArray(raw)) {
      documents = raw.filter((x): x is string => typeof x === 'string').map(s => s.trim()).filter(Boolean)
    } else if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          documents = parsed.filter((x): x is string => typeof x === 'string').map(s => s.trim()).filter(Boolean)
        }
      } catch {
        documents = []
      }
    }
    delete body.documents
    const result = await registrationService.createForUser(
      { ...(body as object), documents } as any,
      user.userId
    )
    return sendCreated(res, result, 'Đăng ký phòng thành công')
  }

  getAssignableRooms = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await registrationService.getAssignableRooms(req.query.roomTypeId as string)
    return sendSuccess(res, result)
  }

  getRoomTypesForRegistration = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const result = await registrationService.getRoomTypesForRegistration(user.userId)
    return sendSuccess(res, result)
  }

  getAvailableRooms = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const result = await registrationService.getAvailableRooms(
      req.query.roomTypeId as string,
      req.query.building as string,
      user.userId
    )
    return sendSuccess(res, result)
  }

  getMyRegistrations = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const result = await registrationService.getMyRegistrationsByUserId(user.userId)
    return sendSuccess(res, result)
  }

  cancelByStudent = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const result = await registrationService.cancelByStudent(req.params.id, user.userId)
    return sendSuccess(res, result, 'Đã hủy đơn đăng ký')
  }

  approve = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const result = await registrationService.approve(
      { registrationId: req.params.id, ...req.body },
      user.userId
    )
    return sendSuccess(res, result, 'Đã duyệt hồ sơ, chờ sinh viên nộp cọc')
  }

  reject = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    await registrationService.reject(
      { registrationId: req.params.id, ...req.body },
      user.userId
    )
    return sendSuccess(res, null, 'Đã từ chối đơn đăng ký')
  }

  uploadPaymentProof = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const file = req.file as Express.Multer.File | undefined
    if (!file) throw new Error('Vui lòng chọn file biên lai')
    const paymentProofUrl = `/uploads/registrations/${file.filename}`
    const result = await registrationService.uploadPaymentProof(
      req.params.id,
      paymentProofUrl,
      user.userId
    )
    return sendSuccess(res, result, 'Đã gửi biên lai thành công')
  }

  confirmPayment = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const result = await registrationService.confirmPaymentAndAssignRoom(
      { registrationId: req.params.id, ...req.body },
      user.userId
    )
    return sendSuccess(res, result, 'Đã xác nhận thanh toán và phân phòng')
  }

  confirmDeposit = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const result = await registrationService.confirmDeposit(req.params.id, user.userId)
    return sendSuccess(res, result, 'Đã xác nhận tiền cọc')
  }

  rejectDeposit = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const { reason } = req.body
    const result = await registrationService.rejectDeposit(req.params.id, user.userId, reason)
    return sendSuccess(res, result, 'Đã từ chối biên lai cọc')
  }

  cancelByStaff = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const result = await registrationService.cancelByStaff(
      req.params.id,
      user.userId,
      req.body?.reviewNote
    )
    return sendSuccess(res, result, 'Đã hủy đơn đăng ký')
  }

  getStats = async (req: Request, res: Response, _next: NextFunction) => {
    const stats = await registrationService.getStats()
    return sendSuccess(res, stats)
  }
}

export const registrationController = new RegistrationController()
