import { Router } from 'express'
import { systemConfigController } from './system-config.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

router.get('/', authenticate, requireRole('admin'), asyncHandler(systemConfigController.getAll))
router.get('/:key', authenticate, requireRole('admin'), asyncHandler(systemConfigController.getByKey))
router.put('/:key', authenticate, requireRole('admin'), asyncHandler(systemConfigController.set))
router.post('/batch', authenticate, requireRole('admin'), asyncHandler(systemConfigController.setBatch))

export default router
