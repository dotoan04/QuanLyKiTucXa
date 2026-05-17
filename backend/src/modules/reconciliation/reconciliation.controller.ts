import { Request, Response, NextFunction } from 'express'
import { sendSuccess, sendCreated } from '../../common/utils/response'
import { reconciliationService } from './reconciliation.service'
import { asyncHandler } from '../../common/utils/async-handler'
import { AppError } from '../../common/utils/app-error'

class ReconciliationController {
  reconcile = async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user.userId
    const body = req.body as {
      month?: string
      gateway?: string
      paymentGateway?: string
      transactions?: unknown[]
    }
    const month = body.month
    const paymentGateway = body.paymentGateway ?? body.gateway
    if (!month || typeof month !== 'string') {
      throw AppError.badRequest('Tháng đối soát không hợp lệ')
    }
    if (!paymentGateway || typeof paymentGateway !== 'string') {
      throw AppError.badRequest('Thiếu cổng thanh toán (gateway / paymentGateway)')
    }
    const transactions = Array.isArray(body.transactions) ? body.transactions : []
    const result = await reconciliationService.reconcilePayments(
      { month, paymentGateway, transactions: transactions as any },
      userId
    )
    return sendCreated(res, result, 'Reconciliation completed')
  }

  getReports = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      month: req.query.month as string,
      gateway: req.query.gateway as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    }
    const result = await reconciliationService.getReconciliationReports(params)
    return sendSuccess(res, result)
  }

  getReportDetails = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const result = await reconciliationService.getReportDetails(id)
    return sendSuccess(res, result)
  }

  resolveDiscrepancy = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params
    const { discrepancyIndex, action, notes } = req.body
    await reconciliationService.resolveDiscrepancy(id, discrepancyIndex, action, notes)
    return sendSuccess(res, null, 'Discrepancy resolved successfully')
  }

  getStats = async (req: Request, res: Response, _next: NextFunction) => {
    const month = req.query.month as string
    const result = await reconciliationService.getReconciliationStats(month)
    return sendSuccess(res, result)
  }
}

export const reconciliationController = new ReconciliationController()
