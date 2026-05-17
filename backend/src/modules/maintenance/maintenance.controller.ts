import { Request, Response, NextFunction } from 'express'
import { maintenanceService } from './maintenance.service'
import { sendSuccess } from '../../common/utils/response'

class MaintenanceController {
  getAll = async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, status, type, roomId, startDate, endDate } = req.query
    const result = await maintenanceService.getAll({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      status: status as string,
      type: type as string,
      roomId: roomId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    })
    return sendSuccess(res, result)
  }

  getById = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const maintenance = await maintenanceService.getById(id)
    return sendSuccess(res, maintenance)
  }

  create = async (req: Request, res: Response, _next: NextFunction) => {
    const maintenance = await maintenanceService.create(req.body)
    return sendSuccess(res, maintenance, undefined, 201)
  }

  update = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const maintenance = await maintenanceService.update(id, req.body)
    return sendSuccess(res, maintenance)
  }

  complete = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const { notes, cost } = req.body
    const maintenance = await maintenanceService.complete(id, notes, cost)
    return sendSuccess(res, maintenance)
  }

  delete = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    await maintenanceService.delete(id)
    return sendSuccess(res, { message: 'Đã xóa lịch bảo trì' })
  }
}

export const maintenanceController = new MaintenanceController()
