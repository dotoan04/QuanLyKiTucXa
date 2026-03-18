"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financialReportController = void 0;
const financial_report_service_1 = require("./financial-report.service");
const response_1 = require("../../common/utils/response");
class FinancialReportController {
    generate = async (req, res, _next) => {
        const { month } = req.body;
        if (!month) {
            res.status(400).json({ success: false, message: 'Thiếu tham số month (YYYY-MM)' });
            return;
        }
        const userId = req.user?.id || 'system';
        const report = await financial_report_service_1.financialReportService.generateReport(month, userId);
        return (0, response_1.sendSuccess)(res, report, 'Tạo báo cáo tài chính thành công');
    };
    getMonthlyStats = async (req, res, _next) => {
        const months = parseInt(req.query.months || '12');
        const stats = await financial_report_service_1.financialReportService.getMonthlyStats(months);
        return (0, response_1.sendSuccess)(res, stats);
    };
    exportCsv = async (req, res, _next) => {
        const { month } = req.query;
        if (!month) {
            res.status(400).json({ success: false, message: 'Thiếu tham số month (YYYY-MM)' });
            return;
        }
        const csv = await financial_report_service_1.financialReportService.exportCsv(month);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="bao-cao-tai-chinh-${month}.csv"`);
        res.send('\uFEFF' + csv); // BOM for Excel UTF-8
    };
    exportJson = async (req, res, _next) => {
        const { month } = req.query;
        if (!month) {
            res.status(400).json({ success: false, message: 'Thiếu tham số month (YYYY-MM)' });
            return;
        }
        const report = await financial_report_service_1.financialReportService.generateReport(month, 'system');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="bao-cao-tai-chinh-${month}.json"`);
        res.send(JSON.stringify(report, null, 2));
    };
}
exports.financialReportController = new FinancialReportController();
//# sourceMappingURL=financial-report.controller.js.map