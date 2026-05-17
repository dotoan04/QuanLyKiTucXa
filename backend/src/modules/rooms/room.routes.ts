import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { asyncHandler } from '../../common/utils/async-handler'
import { roomController } from './room.controller'

const router = Router()

// Public routes
router.get('/room-types', asyncHandler(roomController.getRoomTypes))
router.get('/room-types/:id', asyncHandler(roomController.getRoomTypeById))

// Protected routes - Admin/Staff only
router.get('/my-room', authenticate, asyncHandler(roomController.getMyRoom))
router.get('/', authenticate, requireRole('admin', 'staff'), asyncHandler(roomController.getRooms))
router.post('/', authenticate, requireRole('admin', 'staff'), asyncHandler(roomController.createRoom))
router.get('/stats/summary', authenticate, requireRole('admin', 'staff'), asyncHandler(roomController.getRoomStats))
router.get('/available', authenticate, requireRole('admin', 'staff'), asyncHandler(roomController.getAvailableRooms))
router.get('/:id', authenticate, asyncHandler(roomController.getRoomById))
router.put('/:id', authenticate, requireRole('admin', 'staff'), asyncHandler(roomController.updateRoom))
router.delete('/:id', authenticate, requireRole('admin'), asyncHandler(roomController.deleteRoom))

// Room type routes
router.post('/room-types', authenticate, requireRole('admin', 'staff'), asyncHandler(roomController.createRoomType))
router.put('/room-types/:id', authenticate, requireRole('admin', 'staff'), asyncHandler(roomController.updateRoomType))
router.delete('/room-types/:id', authenticate, requireRole('admin'), asyncHandler(roomController.deleteRoomType))

export default router
