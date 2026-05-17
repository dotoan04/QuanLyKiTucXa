import { Request, Response, NextFunction } from 'express'
import { sendSuccess, sendCreated } from '../../common/utils/response'
import { violationService } from './violations.service'
import { asyncHandler } from '../../common/utils/async-handler'

class ViolationController {
  create = async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user.userId
    const result = await violationService.create(req.body, userId)
    return sendCreated(res, result, 'Violation recorded successfully')
  }

  getAll = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      status: req.query.status as string,
      studentId: req.query.studentId as string
    }
    const result = await violationService.getAll(params)
    return sendSuccess(res, result)
  }

  getById = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const result = await violationService.getById(id)
    return sendSuccess(res, result)
  }

  process = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await violationService.process(req.body)
    return sendSuccess(res, result, 'Violation processed successfully')
  }

  getStudentHistory = async (req: Request, res: Response, _next: NextFunction) => {
    const { studentId } = req.params
    const result = await violationService.getStudentViolationHistory(studentId)
    return sendSuccess(res, result)
  }

  appeal = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const userId = (req as any).user.userId
    const { appealReason } = req.body
    await violationService.appeal(id, appealReason, userId)
    return sendSuccess(res, null, 'Appeal submitted successfully')
  }
}

export const violationController = new ViolationController()
