"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const router = (0, express_1.Router)();
router.get('/stats', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff', 'director'), (0, async_handler_1.asyncHandler)(dashboard_controller_1.dashboardController.getStats));
router.get('/revenue', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'director'), (0, async_handler_1.asyncHandler)(dashboard_controller_1.dashboardController.getRevenueReport));
router.get('/occupancy', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff', 'director'), (0, async_handler_1.asyncHandler)(dashboard_controller_1.dashboardController.getOccupancyReport));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map