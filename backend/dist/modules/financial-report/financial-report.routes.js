"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../common/middlewares/auth.middleware");
const async_handler_1 = require("../../common/utils/async-handler");
const financial_report_controller_1 = require("./financial-report.controller");
const router = (0, express_1.Router)();
// All routes require admin or accountant role
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)('admin', 'accountant'));
// Generate a financial report for a given month
router.post('/generate', (0, async_handler_1.asyncHandler)(financial_report_controller_1.financialReportController.generate));
// Get monthly stats for sparkline/chart (last N months)
router.get('/stats', (0, async_handler_1.asyncHandler)(financial_report_controller_1.financialReportController.getMonthlyStats));
// Export as CSV
router.get('/export/csv', (0, async_handler_1.asyncHandler)(financial_report_controller_1.financialReportController.exportCsv));
// Export as JSON
router.get('/export/json', (0, async_handler_1.asyncHandler)(financial_report_controller_1.financialReportController.exportJson));
exports.default = router;
//# sourceMappingURL=financial-report.routes.js.map