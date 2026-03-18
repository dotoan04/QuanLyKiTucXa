"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceController = void 0;
const maintenance_service_1 = require("./maintenance.service");
const response_1 = require("../../common/utils/response");
class MaintenanceController {
    getAll = async (req, res, _next) => {
        const { page, limit, status, type, roomId, startDate, endDate } = req.query;
        const result = await maintenance_service_1.maintenanceService.getAll({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            status: status,
            type: type,
            roomId: roomId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        });
        return (0, response_1.sendSuccess)(res, result);
    };
    getById = async (req, res, _next) => {
        const { id } = req.params;
        const maintenance = await maintenance_service_1.maintenanceService.getById(id);
        return (0, response_1.sendSuccess)(res, maintenance);
    };
    create = async (req, res, _next) => {
        const maintenance = await maintenance_service_1.maintenanceService.create(req.body);
        return (0, response_1.sendSuccess)(res, maintenance, undefined, 201);
    };
    update = async (req, res, _next) => {
        const { id } = req.params;
        const maintenance = await maintenance_service_1.maintenanceService.update(id, req.body);
        return (0, response_1.sendSuccess)(res, maintenance);
    };
    complete = async (req, res, _next) => {
        const { id } = req.params;
        const { notes, cost } = req.body;
        const maintenance = await maintenance_service_1.maintenanceService.complete(id, notes, cost);
        return (0, response_1.sendSuccess)(res, maintenance);
    };
    delete = async (req, res, _next) => {
        const { id } = req.params;
        await maintenance_service_1.maintenanceService.delete(id);
        return (0, response_1.sendSuccess)(res, { message: 'Đã xóa lịch bảo trì' });
    };
}
exports.maintenanceController = new MaintenanceController();
//# sourceMappingURL=maintenance.controller.js.map