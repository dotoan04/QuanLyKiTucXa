import { Request, Response, NextFunction } from 'express'
import { sendSuccess, sendCreated } from '../../common/utils/response'
import { transferService } from './transfers.service'
import { asyncHandler } from '../../common/utils/async-handler'

class TransferController {
  createTransferRequest = async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user.userId
    const result = await transferService.createTransferRequest(req.body, userId)
    return sendCreated(res, result, 'Transfer request created successfully')
  }

  getMyTransfers = async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user.userId
    const result = await transferService.getMyTransfers(userId)
    return sendSuccess(res, result)
  }

  getAllTransfers = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as string
    }
    const result = await transferService.getAllTransfers(params)
    return sendSuccess(res, result)
  }

  processTransfer = async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user.userId
    const result = await transferService.processTransfer(req.body, userId)
    return sendSuccess(res, result, 'Transfer processed successfully')
  }

  cancelTransfer = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const userId = (req as any).user.userId
    await transferService.cancelTransfer(id, userId)
    return sendSuccess(res, null, 'Transfer cancelled')
  }

  getTransferFee = async (req: Request, res: Response, _next: NextFunction) => {
    const { fromRoomId, toRoomId } = req.query
    const result = await transferService.getTransferFee(fromRoomId as string, toRoomId as string)
    return sendSuccess(res, result)
  }
}

export const transferController = new TransferController()
