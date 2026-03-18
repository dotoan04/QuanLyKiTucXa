"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconciliationController = void 0;
const response_1 = require("../../common/utils/response");
const reconciliation_service_1 = require("./reconciliation.service");
class ReconciliationController {
    reconcile = async (req, res, _next) => {
        const userId = req.user.userId;
        const result = await reconciliation_service_1.reconciliationService.reconcilePayments(req.body, userId);
        return (0, response_1.sendCreated)(res, result, 'Reconciliation completed');
    };
    getReports = async (req, res, _next) => {
        const params = {
            month: req.query.month,
            gateway: req.query.gateway,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined
        };
        const result = await reconciliation_service_1.reconciliationService.getReconciliationReports(params);
        return (0, response_1.sendSuccess)(res, result);
    };
    getReportDetails = async (req, res, _next) => {
        const { id } = req.params;
        const result = await reconciliation_service_1.reconciliationService.getReportDetails(id);
        return (0, response_1.sendSuccess)(res, result);
    };
    resolveDiscrepancy = async (req, res, _next) => {
        const { id } = req.params;
        const { discrepancyIndex, action, notes } = req.body;
        await reconciliation_service_1.reconciliationService.resolveDiscrepancy(id, discrepancyIndex, action, notes);
        return (0, response_1.sendSuccess)(res, null, 'Discrepancy resolved successfully');
    };
    getStats = async (req, res, _next) => {
        const month = req.query.month;
        const result = await reconciliation_service_1.reconciliationService.getReconciliationStats(month);
        return (0, response_1.sendSuccess)(res, result);
    };
}
exports.reconciliationController = new ReconciliationController();
//# sourceMappingURL=reconciliation.controller.js.map