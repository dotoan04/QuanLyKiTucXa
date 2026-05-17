import { Router } from 'express'
import { temporaryLeaveController } from './temporary-leave.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

router.post('/', authenticate, asyncHandler(temporaryLeaveController.create))
router.get('/my', authenticate, asyncHandler(temporaryLeaveController.getMyLeaves))
router.get('/', authenticate, requireRole('admin', 'staff'), asyncHandler(temporaryLeaveController.getAllLeaves))
router.put('/:id/return', authenticate, requireRole('admin', 'staff'), asyncHandler(temporaryLeaveController.markAsReturned))
router.delete('/:id', authenticate, asyncHandler(temporaryLeaveController.cancel))
router.post('/check-overdue', authenticate, requireRole('admin'), asyncHandler(temporaryLeaveController.checkOverdue))

export default router
