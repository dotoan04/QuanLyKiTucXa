"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const maintenance_controller_1 = require("./maintenance.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff', 'technician'), (0, async_handler_1.asyncHandler)(maintenance_controller_1.maintenanceController.getAll));
router.get('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff', 'technician'), (0, async_handler_1.asyncHandler)(maintenance_controller_1.maintenanceController.getById));
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff'), (0, async_handler_1.asyncHandler)(maintenance_controller_1.maintenanceController.create));
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff', 'technician'), (0, async_handler_1.asyncHandler)(maintenance_controller_1.maintenanceController.update));
router.put('/:id/complete', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff', 'technician'), (0, async_handler_1.asyncHandler)(maintenance_controller_1.maintenanceController.complete));
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(maintenance_controller_1.maintenanceController.delete));
exports.default = router;
//# sourceMappingURL=maintenance.routes.js.map