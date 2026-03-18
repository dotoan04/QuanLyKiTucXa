"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const registrations_controller_1 = require("./registrations.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const router = (0, express_1.Router)();
// Public routes
router.get('/available', (0, async_handler_1.asyncHandler)(registrations_controller_1.registrationController.getAvailableRooms));
// Student routes
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('student'), (0, async_handler_1.asyncHandler)(registrations_controller_1.registrationController.create));
router.get('/my', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(registrations_controller_1.registrationController.getMyRegistrations));
// Admin/Staff routes
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(registrations_controller_1.registrationController.getAll));
router.get('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(registrations_controller_1.registrationController.getById));
router.post('/:id/approve', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(registrations_controller_1.registrationController.approve));
router.post('/:id/reject', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(registrations_controller_1.registrationController.reject));
exports.default = router;
//# sourceMappingURL=registrations.routes.js.map