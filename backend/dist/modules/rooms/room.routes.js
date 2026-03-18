"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const room_controller_1 = require("./room.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/room-types', (0, async_handler_1.asyncHandler)(room_controller_1.roomController.getRoomTypes));
router.get('/room-types/:id', (0, async_handler_1.asyncHandler)(room_controller_1.roomController.getRoomTypeById));
// Protected routes - Admin/Staff only
router.get('/my-room', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(room_controller_1.roomController.getMyRoom));
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(room_controller_1.roomController.getRooms));
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(room_controller_1.roomController.createRoom));
router.get('/stats/summary', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(room_controller_1.roomController.getRoomStats));
router.get('/available', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(room_controller_1.roomController.getAvailableRooms));
router.get('/:id', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(room_controller_1.roomController.getRoomById));
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(room_controller_1.roomController.updateRoom));
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(room_controller_1.roomController.deleteRoom));
// Room type routes
router.post('/room-types', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(room_controller_1.roomController.createRoomType));
router.put('/room-types/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(room_controller_1.roomController.updateRoomType));
router.delete('/room-types/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(room_controller_1.roomController.deleteRoomType));
exports.default = router;
//# sourceMappingURL=room.routes.js.map