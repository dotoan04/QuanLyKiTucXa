"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogController = void 0;
const audit_log_service_1 = require("./audit-log.service");
const response_1 = require("../../common/utils/response");
class AuditLogController {
    getAll = async (req, res, _next) => {
        const { page, limit, action, entity, userId, startDate, endDate } = req.query;
        const result = await audit_log_service_1.auditLogService.getAll({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            action: action,
            entity: entity,
            userId: userId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });
        return (0, response_1.sendSuccess)(res, result);
    };
    getById = async (req, res, _next) => {
        const { id } = req.params;
        const log = await audit_log_service_1.auditLogService.getById(id);
        return (0, response_1.sendSuccess)(res, log);
    };
    getByEntity = async (req, res, _next) => {
        const { entity, id } = req.params;
        const logs = await audit_log_service_1.auditLogService.getByEntity(entity, id);
        return (0, response_1.sendSuccess)(res, logs);
    };
}
exports.auditLogController = new AuditLogController();
//# sourceMappingURL=audit-log.controller.js.map