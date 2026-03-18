"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const response_1 = require("../../common/utils/response");
const dashboard_service_1 = require("./dashboard.service");
const app_error_1 = require("../../common/utils/app-error");
class DashboardController {
    getStats = async (req, res, _next) => {
        const result = await dashboard_service_1.dashboardService.getDashboardStats();
        return (0, response_1.sendSuccess)(res, result);
    };
    getRevenueReport = async (req, res, _next) => {
        const { startDate, endDate } = req.query;
        const now = new Date();
        const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const parsedStartDate = startDate ? new Date(startDate) : defaultStartDate;
        const parsedEndDate = endDate ? new Date(endDate) : defaultEndDate;
        if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
            throw app_error_1.AppError.badRequest('startDate/endDate không hợp lệ. Dùng ISO date hoặc YYYY-MM-DD');
        }
        const result = await dashboard_service_1.dashboardService.getRevenueReport(parsedStartDate, parsedEndDate);
        return (0, response_1.sendSuccess)(res, result);
    };
    getOccupancyReport = async (req, res, _next) => {
        const result = await dashboard_service_1.dashboardService.getOccupancyReport();
        return (0, response_1.sendSuccess)(res, result);
    };
}
exports.dashboardController = new DashboardController();
//# sourceMappingURL=dashboard.controller.js.map