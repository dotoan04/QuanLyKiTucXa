import { Request, Response, NextFunction } from 'express'
import { auditLogService } from './audit-log.service'
import { sendSuccess } from '../../common/utils/response'

class AuditLogController {
  getAll = async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, action, entity, userId, startDate, endDate } = req.query
    const result = await auditLogService.getAll({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
      action: action as string,
      entity: entity as string,
      userId: userId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    })
    return sendSuccess(res, result)
  }

  getById = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const log = await auditLogService.getById(id)
    return sendSuccess(res, log)
  }

  getByEntity = async (req: Request, res: Response, _next: NextFunction) => {
    const { entity, id } = req.params
    const logs = await auditLogService.getByEntity(entity, id)
    return sendSuccess(res, logs)
  }
}

export const auditLogController = new AuditLogController()
