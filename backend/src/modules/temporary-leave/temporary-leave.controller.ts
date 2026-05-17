import { Request, Response, NextFunction } from 'express'
import { sendSuccess, sendCreated } from '../../common/utils/response'
import { temporaryLeaveService } from './temporary-leave.service'
import { asyncHandler } from '../../common/utils/async-handler'

class TemporaryLeaveController {
  create = async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user.userId
    const result = await temporaryLeaveService.create(req.body, userId)
    return sendCreated(res, result, 'Temporary leave registered successfully')
  }

  getMyLeaves = async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user.userId
    const result = await temporaryLeaveService.getMyLeaves(userId)
    return sendSuccess(res, result)
  }

  getAllLeaves = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as string
    }
    const result = await temporaryLeaveService.getAllLeaves(params)
    return sendSuccess(res, result)
  }

  markAsReturned = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const result = await temporaryLeaveService.markAsReturned(id)
    return sendSuccess(res, result, 'Marked as returned successfully')
  }

  cancel = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const userId = (req as any).user.userId
    await temporaryLeaveService.cancel(id, userId)
    return sendSuccess(res, null, 'Leave registration cancelled')
  }

  checkOverdue = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await temporaryLeaveService.checkOverdueLeaves()
    return sendSuccess(res, result)
  }
}

export const temporaryLeaveController = new TemporaryLeaveController()
