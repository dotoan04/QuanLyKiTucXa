"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const temporary_leave_controller_1 = require("./temporary-leave.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(temporary_leave_controller_1.temporaryLeaveController.create));
router.get('/my', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(temporary_leave_controller_1.temporaryLeaveController.getMyLeaves));
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(temporary_leave_controller_1.temporaryLeaveController.getAllLeaves));
router.put('/:id/return', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(temporary_leave_controller_1.temporaryLeaveController.markAsReturned));
router.delete('/:id', auth_middleware_1.authenticate, (0, async_handler_1.asyncHandler)(temporary_leave_controller_1.temporaryLeaveController.cancel));
router.post('/check-overdue', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(temporary_leave_controller_1.temporaryLeaveController.checkOverdue));
exports.default = router;
//# sourceMappingURL=temporary-leave.routes.js.map