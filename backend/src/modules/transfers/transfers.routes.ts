import { Router } from 'express'
import { transferController } from './transfers.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

router.post('/', authenticate, asyncHandler(transferController.createTransferRequest))
router.get('/my', authenticate, asyncHandler(transferController.getMyTransfers))
router.get('/fee', authenticate, asyncHandler(transferController.getTransferFee))
router.get('/', authenticate, requireRole('admin', 'staff'), asyncHandler(transferController.getAllTransfers))
router.put('/:id/process', authenticate, requireRole('admin', 'staff'), asyncHandler(transferController.processTransfer))
router.delete('/:id', authenticate, asyncHandler(transferController.cancelTransfer))

export default router
