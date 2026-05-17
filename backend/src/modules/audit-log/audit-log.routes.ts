import { Router } from 'express'
import { auditLogController } from './audit-log.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

router.get('/', authenticate, requireRole('admin'), asyncHandler(auditLogController.getAll))
router.get('/:id', authenticate, requireRole('admin'), asyncHandler(auditLogController.getById))
router.get('/entity/:entity/:id', authenticate, requireRole('admin'), asyncHandler(auditLogController.getByEntity))

export default router
