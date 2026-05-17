import { Router } from 'express'
import { maintenanceController } from './maintenance.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

router.get('/', authenticate, requireRole('admin', 'staff', 'technician'), asyncHandler(maintenanceController.getAll))
router.get('/:id', authenticate, requireRole('admin', 'staff', 'technician'), asyncHandler(maintenanceController.getById))
router.post('/', authenticate, requireRole('admin', 'staff', 'technician'), asyncHandler(maintenanceController.create))
router.put('/:id', authenticate, requireRole('admin', 'staff', 'technician'), asyncHandler(maintenanceController.update))
router.put('/:id/complete', authenticate, requireRole('admin', 'staff', 'technician'), asyncHandler(maintenanceController.complete))
router.delete('/:id', authenticate, requireRole('admin'), asyncHandler(maintenanceController.delete))

export default router
