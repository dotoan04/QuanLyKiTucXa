import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'
import { directorController } from './director.controller'

const router = Router()

router.use(authenticate, requireRole('director', 'admin'))

router.get('/policies/room-types', asyncHandler(directorController.getRoomTypePolicies))
router.put('/policies/room-types/:id/approve-price', asyncHandler(directorController.approveRoomTypePrice))

router.get('/reports/periodic', asyncHandler(directorController.getPeriodicReport))
router.get('/reports/export', asyncHandler(directorController.exportPeriodicReport))

export default router
