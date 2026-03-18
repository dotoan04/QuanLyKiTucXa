"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.violationController = void 0;
const response_1 = require("../../common/utils/response");
const violations_service_1 = require("./violations.service");
class ViolationController {
    create = async (req, res, _next) => {
        const userId = req.user.userId;
        const result = await violations_service_1.violationService.create(req.body, userId);
        return (0, response_1.sendCreated)(res, result, 'Violation recorded successfully');
    };
    getAll = async (req, res, _next) => {
        const params = {
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            status: req.query.status,
            studentId: req.query.studentId
        };
        const result = await violations_service_1.violationService.getAll(params);
        return (0, response_1.sendSuccess)(res, result);
    };
    getById = async (req, res, _next) => {
        const { id } = req.params;
        const result = await violations_service_1.violationService.getById(id);
        return (0, response_1.sendSuccess)(res, result);
    };
    process = async (req, res, _next) => {
        const result = await violations_service_1.violationService.process(req.body);
        return (0, response_1.sendSuccess)(res, result, 'Violation processed successfully');
    };
    getStudentHistory = async (req, res, _next) => {
        const { studentId } = req.params;
        const result = await violations_service_1.violationService.getStudentViolationHistory(studentId);
        return (0, response_1.sendSuccess)(res, result);
    };
    appeal = async (req, res, _next) => {
        const { id } = req.params;
        const userId = req.user.userId;
        const { appealReason } = req.body;
        await violations_service_1.violationService.appeal(id, appealReason, userId);
        return (0, response_1.sendSuccess)(res, null, 'Appeal submitted successfully');
    };
}
exports.violationController = new ViolationController();
//# sourceMappingURL=violations.controller.js.map