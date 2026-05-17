import { Router } from 'express'
import { renewalController } from './renewals.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

router.get('/expiring', authenticate, requireRole('admin', 'staff'), renewalController.getExpiringContracts)

router.post('/reminders', authenticate, requireRole('admin'), renewalController.sendReminders)

router.get('/:contractId/eligibility', authenticate, renewalController.checkEligibility)

router.get('/:contractId/history', authenticate, renewalController.getHistory)

router.post('/', authenticate, renewalController.renewContract)

export default router
