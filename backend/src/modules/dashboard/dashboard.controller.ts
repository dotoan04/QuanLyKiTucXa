import { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../common/utils/response'
import { dashboardService } from './dashboard.service'
import { asyncHandler } from '../../common/utils/async-handler'
import { AppError } from '../../common/utils/app-error'

class DashboardController {
  getStats = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await dashboardService.getDashboardStats()
    return sendSuccess(res, result)
  }

  getRevenueReport = async (req: Request, res: Response, _next: NextFunction) => {
    const { startDate, endDate } = req.query
    const now = new Date()

    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const parsedStartDate = startDate ? new Date(startDate as string) : defaultStartDate
    const parsedEndDate = endDate ? new Date(endDate as string) : defaultEndDate

    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
      throw AppError.badRequest('startDate/endDate không hợp lệ. Dùng ISO date hoặc YYYY-MM-DD')
    }

    const result = await dashboardService.getRevenueReport(
      parsedStartDate,
      parsedEndDate
    )
    return sendSuccess(res, result)
  }

  getOccupancyReport = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await dashboardService.getOccupancyReport()
    return sendSuccess(res, result)
  }
}

export const dashboardController = new DashboardController()
