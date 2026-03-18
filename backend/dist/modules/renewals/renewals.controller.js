"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renewalController = void 0;
const response_1 = require("../../common/utils/response");
const renewals_service_1 = require("./renewals.service");
class RenewalController {
    checkEligibility = async (req, res, _next) => {
        const { contractId } = req.params;
        const result = await renewals_service_1.renewalService.checkRenewalEligibility(contractId);
        return (0, response_1.sendSuccess)(res, result);
    };
    getExpiringContracts = async (req, res, _next) => {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const result = await renewals_service_1.renewalService.getContractsExpiringSoon(days);
        return (0, response_1.sendSuccess)(res, result);
    };
    renewContract = async (req, res, _next) => {
        const userId = req.user.userId;
        const data = req.body;
        const result = await renewals_service_1.renewalService.renewContract(data, userId);
        return (0, response_1.sendSuccess)(res, result, 'Contract renewed successfully');
    };
    sendReminders = async (req, res, _next) => {
        const result = await renewals_service_1.renewalService.sendRenewalReminders();
        return (0, response_1.sendSuccess)(res, result, 'Reminders sent successfully');
    };
    getHistory = async (req, res, _next) => {
        const { contractId } = req.params;
        const result = await renewals_service_1.renewalService.getRenewalHistory(contractId);
        return (0, response_1.sendSuccess)(res, result);
    };
}
exports.renewalController = new RenewalController();
//# sourceMappingURL=renewals.controller.js.map