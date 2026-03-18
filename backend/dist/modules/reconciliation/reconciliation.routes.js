"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reconciliation_controller_1 = require("./reconciliation.controller");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff', 'accountant'), (0, async_handler_1.asyncHandler)(reconciliation_controller_1.reconciliationController.reconcile));
router.get('/reports', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff', 'accountant'), (0, async_handler_1.asyncHandler)(reconciliation_controller_1.reconciliationController.getReports));
router.get('/stats', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff', 'accountant'), (0, async_handler_1.asyncHandler)(reconciliation_controller_1.reconciliationController.getStats));
router.get('/reports/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'staff', 'accountant'), (0, async_handler_1.asyncHandler)(reconciliation_controller_1.reconciliationController.getReportDetails));
router.put('/reports/:id/resolve', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin'), (0, async_handler_1.asyncHandler)(reconciliation_controller_1.reconciliationController.resolveDiscrepancy));
exports.default = router;
//# sourceMappingURL=reconciliation.routes.js.map