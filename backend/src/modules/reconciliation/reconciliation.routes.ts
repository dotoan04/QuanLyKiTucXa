import { Router } from 'express'
import { reconciliationController } from './reconciliation.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

router.post('/', authenticate, requireRole('admin', 'staff', 'accountant'), asyncHandler(reconciliationController.reconcile))
router.get('/reports', authenticate, requireRole('admin', 'staff', 'accountant'), asyncHandler(reconciliationController.getReports))
router.get('/stats', authenticate, requireRole('admin', 'staff', 'accountant'), asyncHandler(reconciliationController.getStats))
router.get('/reports/:id', authenticate, requireRole('admin', 'staff', 'accountant'), asyncHandler(reconciliationController.getReportDetails))
router.put(
  '/reports/:id/resolve',
  authenticate,
  requireRole('admin', 'accountant'),
  asyncHandler(reconciliationController.resolveDiscrepancy)
)

export default router
