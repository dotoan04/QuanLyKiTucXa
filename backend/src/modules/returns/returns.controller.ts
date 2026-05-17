import { Request, Response, NextFunction } from 'express'
import { sendSuccess, sendCreated, sendNoContent } from '../../common/utils/response'
import { returnService } from './returns.service'
import { asyncHandler } from '../../common/utils/async-handler'

class ReturnController {
  createReturnRequest = async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user.userId
    const data = req.body

    const result = await returnService.createReturnRequest(data, userId)
    return sendCreated(res, result, 'Return request created successfully')
  }

  getMyReturnRequests = async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user.userId
    const result = await returnService.getMyReturnRequests(userId)
    return sendSuccess(res, result)
  }

  getAllReturnRequests = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as string
    }

    const result = await returnService.getAllReturnRequests(params)
    return sendSuccess(res, result)
  }

  getReturnRequestById = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const result = await returnService.getReturnRequestById(id)
    return sendSuccess(res, result)
  }

  scheduleInspection = async (req: Request, res: Response, _next: NextFunction) => {
    const data = req.body

    const result = await returnService.scheduleInspection(data)
    return sendSuccess(res, result, 'Inspection scheduled successfully')
  }

  completeInspection = async (req: Request, res: Response, _next: NextFunction) => {
    const data = req.body

    const result = await returnService.completeInspection(data)
    return sendSuccess(res, result, 'Inspection completed')
  }

  processRefund = async (req: Request, res: Response, _next: NextFunction) => {
    const data = req.body

    const result = await returnService.processRefund(data)
    return sendSuccess(res, result, 'Refund processed successfully')
  }

  cancelReturnRequest = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const userId = (req as any).user.userId

    await returnService.cancelReturnRequest(id, userId)
    return sendNoContent(res)
  }
}

export const returnController = new ReturnController()
