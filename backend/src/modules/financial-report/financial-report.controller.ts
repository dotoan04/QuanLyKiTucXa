import { Request, Response, NextFunction } from 'express'
import { financialReportService } from './financial-report.service'
import { sendSuccess } from '../../common/utils/response'

class FinancialReportController {
  generate = async (req: Request, res: Response, _next: NextFunction) => {
    const { month } = req.body
    if (!month) {
      res.status(400).json({ success: false, message: 'Thiếu tham số month (YYYY-MM)' })
      return
    }
    const userId = req.user?.userId || 'system'
    const report = await financialReportService.generateReport(month, userId)
    return sendSuccess(res, report, 'Tạo báo cáo tài chính thành công')
  }

  getMonthlyStats = async (req: Request, res: Response, _next: NextFunction) => {
    const months = parseInt((req.query.months as string) || '12')
    const stats = await financialReportService.getMonthlyStats(months)
    return sendSuccess(res, stats)
  }

  exportCsv = async (req: Request, res: Response, _next: NextFunction) => {
    const { month } = req.query as { month: string }
    if (!month) {
      res.status(400).json({ success: false, message: 'Thiếu tham số month (YYYY-MM)' })
      return
    }
    const csv = await financialReportService.exportCsv(month)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-tai-chinh-${month}.csv"`)
    res.send('\uFEFF' + csv) // BOM for Excel UTF-8
  }

  exportJson = async (req: Request, res: Response, _next: NextFunction) => {
    const { month } = req.query as { month: string }
    if (!month) {
      res.status(400).json({ success: false, message: 'Thiếu tham số month (YYYY-MM)' })
      return
    }
    const report = await financialReportService.generateReport(month, 'system')
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-tai-chinh-${month}.json"`)
    res.send(JSON.stringify(report, null, 2))
  }
}

export const financialReportController = new FinancialReportController()
