"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnController = void 0;
const response_1 = require("../../common/utils/response");
const returns_service_1 = require("./returns.service");
class ReturnController {
    createReturnRequest = async (req, res, _next) => {
        const userId = req.user.userId;
        const data = req.body;
        const result = await returns_service_1.returnService.createReturnRequest(data, userId);
        return (0, response_1.sendCreated)(res, result, 'Return request created successfully');
    };
    getMyReturnRequests = async (req, res, _next) => {
        const userId = req.user.userId;
        const result = await returns_service_1.returnService.getMyReturnRequests(userId);
        return (0, response_1.sendSuccess)(res, result);
    };
    getAllReturnRequests = async (req, res, _next) => {
        const params = {
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            status: req.query.status
        };
        const result = await returns_service_1.returnService.getAllReturnRequests(params);
        return (0, response_1.sendSuccess)(res, result);
    };
    getReturnRequestById = async (req, res, _next) => {
        const { id } = req.params;
        const result = await returns_service_1.returnService.getReturnRequestById(id);
        return (0, response_1.sendSuccess)(res, result);
    };
    scheduleInspection = async (req, res, _next) => {
        const data = req.body;
        const result = await returns_service_1.returnService.scheduleInspection(data);
        return (0, response_1.sendSuccess)(res, result, 'Inspection scheduled successfully');
    };
    completeInspection = async (req, res, _next) => {
        const data = req.body;
        const result = await returns_service_1.returnService.completeInspection(data);
        return (0, response_1.sendSuccess)(res, result, 'Inspection completed');
    };
    processRefund = async (req, res, _next) => {
        const data = req.body;
        const result = await returns_service_1.returnService.processRefund(data);
        return (0, response_1.sendSuccess)(res, result, 'Refund processed successfully');
    };
    cancelReturnRequest = async (req, res, _next) => {
        const { id } = req.params;
        const userId = req.user.userId;
        await returns_service_1.returnService.cancelReturnRequest(id, userId);
        return (0, response_1.sendNoContent)(res);
    };
}
exports.returnController = new ReturnController();
//# sourceMappingURL=returns.controller.js.map