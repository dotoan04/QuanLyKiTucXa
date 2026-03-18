"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.temporaryLeaveController = void 0;
const response_1 = require("../../common/utils/response");
const temporary_leave_service_1 = require("./temporary-leave.service");
class TemporaryLeaveController {
    create = async (req, res, _next) => {
        const userId = req.user.userId;
        const result = await temporary_leave_service_1.temporaryLeaveService.create(req.body, userId);
        return (0, response_1.sendCreated)(res, result, 'Temporary leave registered successfully');
    };
    getMyLeaves = async (req, res, _next) => {
        const userId = req.user.userId;
        const result = await temporary_leave_service_1.temporaryLeaveService.getMyLeaves(userId);
        return (0, response_1.sendSuccess)(res, result);
    };
    getAllLeaves = async (req, res, _next) => {
        const params = {
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            status: req.query.status
        };
        const result = await temporary_leave_service_1.temporaryLeaveService.getAllLeaves(params);
        return (0, response_1.sendSuccess)(res, result);
    };
    markAsReturned = async (req, res, _next) => {
        const { id } = req.params;
        const result = await temporary_leave_service_1.temporaryLeaveService.markAsReturned(id);
        return (0, response_1.sendSuccess)(res, result, 'Marked as returned successfully');
    };
    cancel = async (req, res, _next) => {
        const { id } = req.params;
        const userId = req.user.userId;
        await temporary_leave_service_1.temporaryLeaveService.cancel(id, userId);
        return (0, response_1.sendSuccess)(res, null, 'Leave registration cancelled');
    };
    checkOverdue = async (req, res, _next) => {
        const result = await temporary_leave_service_1.temporaryLeaveService.checkOverdueLeaves();
        return (0, response_1.sendSuccess)(res, result);
    };
}
exports.temporaryLeaveController = new TemporaryLeaveController();
//# sourceMappingURL=temporary-leave.controller.js.map