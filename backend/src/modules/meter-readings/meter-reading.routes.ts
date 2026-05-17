import { Router } from 'express'
import { meterReadingController } from './meter-reading.controller'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'

const router = Router()

// Technician Routes (UC27)
router.get('/rooms-to-read', authenticate, requireRole('technician', 'admin'), asyncHandler(meterReadingController.getRoomsToRead))
router.post('/record', authenticate, requireRole('technician', 'admin'), asyncHandler(meterReadingController.record))
router.post('/mark-unreadable', authenticate, requireRole('technician', 'admin'), asyncHandler(meterReadingController.markUnreadable))
router.post('/submit-month', authenticate, requireRole('technician', 'admin'), asyncHandler(meterReadingController.submitMonth))
router.post('/unlock-month', authenticate, requireRole('admin'), asyncHandler(meterReadingController.unlockMonth))

// Accountant / Admin Routes (UC14 partial)
router.get('/', authenticate, requireRole('accountant', 'admin'), asyncHandler(meterReadingController.getAll))
router.post('/:id/approve', authenticate, requireRole('accountant', 'admin'), asyncHandler(meterReadingController.approve))
router.post('/:id/request-remeasure', authenticate, requireRole('accountant', 'admin'), asyncHandler(meterReadingController.requestRemeasure))

export default router
