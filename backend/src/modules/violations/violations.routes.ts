import { Router } from 'express'
import { violationController } from './violations.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

router.post('/', authenticate, requireRole('admin', 'staff'), asyncHandler(violationController.create))
router.get('/', authenticate, requireRole('admin', 'staff'), asyncHandler(violationController.getAll))
router.get('/student/:studentId', authenticate, requireRole('admin', 'staff'), asyncHandler(violationController.getStudentHistory))
router.get('/:id', authenticate, asyncHandler(violationController.getById))
router.put('/:id/process', authenticate, requireRole('admin', 'staff'), asyncHandler(violationController.process))
router.post('/:id/appeal', authenticate, asyncHandler(violationController.appeal))

export default router
