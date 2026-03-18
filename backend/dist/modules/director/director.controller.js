"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.directorController = void 0;
const response_1 = require("../../common/utils/response");
const director_service_1 = require("./director.service");
class DirectorController {
    getRoomTypePolicies = async (_req, res, _next) => {
        const result = await director_service_1.directorService.getRoomTypePolicies();
        return (0, response_1.sendSuccess)(res, result);
    };
    approveRoomTypePrice = async (req, res, _next) => {
        const result = await director_service_1.directorService.approveRoomTypePrice(req.params.id, Number(req.body.monthlyPrice), req.user.userId, req.body.note);
        return (0, response_1.sendSuccess)(res, result, 'Đã phê duyệt giá phòng');
    };
    getPeriodicReport = async (req, res, _next) => {
        const now = new Date();
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const type = req.query.type || 'financial';
        const result = await director_service_1.directorService.getPeriodicReport(startDate, endDate, type);
        return (0, response_1.sendSuccess)(res, result);
    };
    exportPeriodicReport = async (req, res, _next) => {
        const now = new Date();
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const type = req.query.type || 'financial';
        const format = req.query.format || 'csv';
        const result = await director_service_1.directorService.getPeriodicReport(startDate, endDate, type);
        if (format === 'json') {
            return (0, response_1.sendSuccess)(res, result);
        }
        const csv = director_service_1.directorService.toCsv(result);
        const filename = `director-${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(csv);
    };
}
exports.directorController = new DirectorController();
//# sourceMappingURL=director.controller.js.map