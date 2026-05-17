import { Request, Response, NextFunction } from 'express'
import { sendSuccess, sendCreated } from '../../common/utils/response'
import { renewalService } from './renewals.service'
import { asyncHandler } from '../../common/utils/async-handler'

class RenewalController {
  checkEligibility = async (req: Request, res: Response, _next: NextFunction) => {
    const { contractId } = req.params
    const result = await renewalService.checkRenewalEligibility(contractId)
    return sendSuccess(res, result)
  }

  getExpiringContracts = async (req: Request, res: Response, _next: NextFunction) => {
    const days = req.query.days ? parseInt(req.query.days as string) : 30
    const result = await renewalService.getContractsExpiringSoon(days)
    return sendSuccess(res, result)
  }

  renewContract = async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user.userId
    const data = req.body
    const result = await renewalService.renewContract(data, userId)
    return sendSuccess(res, result, 'Contract renewed successfully')
  }

  sendReminders = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await renewalService.sendRenewalReminders()
    return sendSuccess(res, result, 'Reminders sent successfully')
  }

  getHistory = async (req: Request, res: Response, _next: NextFunction) => {
    const { contractId } = req.params
    const result = await renewalService.getRenewalHistory(contractId)
    return sendSuccess(res, result)
  }
}

export const renewalController = new RenewalController()
