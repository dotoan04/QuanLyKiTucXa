import { Request, Response, NextFunction } from 'express'
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response'
import { meterReadingService } from './meter-reading.service'
import { MeterReadingStatus } from '@prisma/client'

class MeterReadingController {
  getRoomsToRead = async (req: Request, res: Response, _next: NextFunction) => {
    const month = req.query.month as string
    if (!month) throw new Error('month query is required (YYYY-MM)')
    const result = await meterReadingService.getRoomsToRead(month)
    return sendSuccess(res, result)
  }

  record = async (req: Request, res: Response, _next: NextFunction) => {
    const user = req.user!
    const result = await meterReadingService.record(req.body, user.userId, user.role)
    return sendCreated(res, result, 'Ghi chỉ số thành công')
  }

  markUnreadable = async (req: Request, res: Response, _next: NextFunction) => {
    const user = req.user!
    const result = await meterReadingService.markUnreadable(
      req.body.roomId,
      req.body.month,
      req.body.reason,
      user.userId,
      user.role
    )
    return sendCreated(res, result, 'Đã báo sự cố đồng hồ/công tơ')
  }

  unlockMonth = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await meterReadingService.unlockMonthForTechnician(req.body.month)
    return sendSuccess(res, result, 'Đã mở khóa tháng cho kỹ thuật ghi lại chỉ số')
  }

  // Accountant actions

  getAll = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as MeterReadingStatus,
      month: req.query.month as string,
      roomId: req.query.roomId as string,
    }
    const result = await meterReadingService.findAll(params)
    return sendPaginated(res, result.readings, result.page, result.limit, result.total)
  }

  approve = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const result = await meterReadingService.approve(req.params.id, user.userId)
    return sendSuccess(res, result, 'Đã duyệt chỉ số thành công')
  }

  requestRemeasure = async (req: Request, res: Response, _next: NextFunction) => {
    const user = (req as any).user
    const result = await meterReadingService.requestRemeasure(req.params.id, req.body.note, user.userId)
    return sendSuccess(res, result, 'Đã gửi yêu cầu đo lại')
  }

  submitMonth = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await meterReadingService.submitMonth(req.body.month)
    return sendSuccess(res, result, 'Đã gửi thông báo cho kế toán')
  }
}

export const meterReadingController = new MeterReadingController()
