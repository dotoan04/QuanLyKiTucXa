import { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../common/utils/response'
import { directorService } from './director.service'

class DirectorController {
  getRoomTypePolicies = async (_req: Request, res: Response, _next: NextFunction) => {
    const result = await directorService.getRoomTypePolicies()
    return sendSuccess(res, result)
  }

  approveRoomTypePrice = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await directorService.approveRoomTypePrice(
      req.params.id,
      Number(req.body.monthlyPrice),
      req.user!.userId,
      req.body.note
    )
    return sendSuccess(res, result, 'Đã phê duyệt giá phòng')
  }

  getPeriodicReport = async (req: Request, res: Response, _next: NextFunction) => {
    const now = new Date()
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const type = (req.query.type as 'financial' | 'occupancy') || 'financial'

    const result = await directorService.getPeriodicReport(startDate, endDate, type)
    return sendSuccess(res, result)
  }

  exportPeriodicReport = async (req: Request, res: Response, _next: NextFunction) => {
    const now = new Date()
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const type = (req.query.type as 'financial' | 'occupancy') || 'financial'
    const format = (req.query.format as 'csv' | 'json') || 'csv'

    const result = await directorService.getPeriodicReport(startDate, endDate, type)

    if (format === 'json') {
      return sendSuccess(res, result)
    }

    const csv = directorService.toCsv(result)
    const filename = `director-${type}-report-${new Date().toISOString().slice(0, 10)}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.status(200).send(csv)
  }
}

export const directorController = new DirectorController()
