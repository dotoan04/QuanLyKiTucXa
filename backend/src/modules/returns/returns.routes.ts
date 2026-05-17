import { Router } from 'express'
import { returnController } from './returns.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

router.post('/', authenticate, asyncHandler(returnController.createReturnRequest))
router.get('/my', authenticate, asyncHandler(returnController.getMyReturnRequests))
router.get('/', authenticate, requireRole('admin', 'staff'), asyncHandler(returnController.getAllReturnRequests))
router.get('/:id', authenticate, asyncHandler(returnController.getReturnRequestById))
router.post('/:id/schedule', authenticate, requireRole('admin', 'staff'), asyncHandler(returnController.scheduleInspection))
router.post('/:id/complete', authenticate, requireRole('admin', 'staff'), asyncHandler(returnController.completeInspection))
router.post('/:id/refund', authenticate, requireRole('admin', 'staff'), asyncHandler(returnController.processRefund))
router.delete('/:id', authenticate, asyncHandler(returnController.cancelReturnRequest))

export default router
