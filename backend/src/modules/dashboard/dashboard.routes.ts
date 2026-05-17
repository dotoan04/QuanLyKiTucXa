import { Router } from 'express'
import { dashboardController } from './dashboard.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

router.get('/stats', authenticate, requireRole('admin', 'staff', 'director'), asyncHandler(dashboardController.getStats))
router.get('/revenue', authenticate, requireRole('admin', 'director'), asyncHandler(dashboardController.getRevenueReport))
router.get('/occupancy', authenticate, requireRole('admin', 'staff', 'director'), asyncHandler(dashboardController.getOccupancyReport))

export default router
