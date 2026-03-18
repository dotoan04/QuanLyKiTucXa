"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceController = void 0;
const invoice_service_1 = require("./invoice.service");
const response_1 = require("../../common/utils/response");
const app_error_1 = require("../../common/utils/app-error");
class InvoiceController {
    parseInvoiceMonth(value) {
        if (!value) {
            throw app_error_1.AppError.badRequest('Thiếu invoiceMonth');
        }
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime())) {
            throw app_error_1.AppError.badRequest('invoiceMonth không hợp lệ. Định dạng hợp lệ: YYYY-MM hoặc ISO date');
        }
        return date;
    }
    getCurrentInvoice = async (req, res, _next) => {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const student = await prisma.student.findFirst({
            where: { userId: req.user.userId }
        });
        if (!student) {
            return (0, response_1.sendSuccess)(res, null);
        }
        // Get the most recent unpaid/overdue invoice
        const invoice = await prisma.invoice.findFirst({
            where: {
                contract: { studentId: student.id },
                status: { in: ['unpaid', 'overdue'] }
            },
            orderBy: { invoiceMonth: 'desc' },
            include: {
                contract: {
                    include: {
                        room: { include: { roomType: true } }
                    }
                }
            }
        });
        return (0, response_1.sendSuccess)(res, invoice);
    };
    getInvoices = async (req, res, _next) => {
        const params = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            status: req.query.status,
            studentId: req.query.studentId,
            roomId: req.query.roomId,
            month: req.query.month,
            year: req.query.year ? parseInt(req.query.year) : undefined,
            search: req.query.search
        };
        const result = await invoice_service_1.invoiceService.findAll(params);
        return (0, response_1.sendPaginated)(res, result.invoices, params.page, params.limit, result.total);
    };
    getInvoiceById = async (req, res, _next) => {
        const invoice = await invoice_service_1.invoiceService.findById(req.params.id);
        return (0, response_1.sendSuccess)(res, invoice);
    };
    generateInvoice = async (req, res, _next) => {
        const invoice = await invoice_service_1.invoiceService.generateInvoice({
            contractId: req.body.contractId,
            invoiceMonth: this.parseInvoiceMonth(req.body.invoiceMonth),
            electricityPrev: req.body.electricityPrev,
            electricityCurr: req.body.electricityCurr,
            waterPrev: req.body.waterPrev,
            waterCurr: req.body.waterCurr,
            otherFees: req.body.otherFees,
            dueDays: req.body.dueDays
        });
        return (0, response_1.sendCreated)(res, invoice, 'Invoice generated successfully');
    };
    generateBatchInvoices = async (req, res, _next) => {
        const result = await invoice_service_1.invoiceService.generateBatchInvoices(req.body.contractIds, this.parseInvoiceMonth(req.body.invoiceMonth), req.body.dueDays);
        return (0, response_1.sendCreated)(res, result, `${result.generated} invoices generated, ${result.skipped} skipped`);
    };
    updateInvoice = async (req, res, _next) => {
        const invoice = await invoice_service_1.invoiceService.update(req.params.id, {
            status: req.body.status,
            electricityPrice: req.body.electricityPrice,
            waterPrice: req.body.waterPrice,
            otherFees: req.body.otherFees,
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
            paymentMethod: req.body.paymentMethod,
            paymentRef: req.body.paymentRef
        });
        return (0, response_1.sendSuccess)(res, invoice, 'Invoice updated successfully');
    };
    processPayment = async (req, res, _next) => {
        const invoice = await invoice_service_1.invoiceService.processPayment(req.params.id, req.body.paymentMethod, req.body.paymentRef);
        return (0, response_1.sendSuccess)(res, invoice, 'Payment processed successfully');
    };
    getMonthlyStats = async (req, res, _next) => {
        const stats = await invoice_service_1.invoiceService.getMonthlyStats(req.query.year ? parseInt(req.query.year) : undefined, req.query.month ? parseInt(req.query.month) : undefined);
        return (0, response_1.sendSuccess)(res, stats);
    };
    getStudentSummary = async (req, res, _next) => {
        const summary = await invoice_service_1.invoiceService.getStudentSummary(req.params.studentId);
        return (0, response_1.sendSuccess)(res, summary);
    };
    updateOverdueInvoices = async (_req, res, _next) => {
        const result = await invoice_service_1.invoiceService.updateOverdueInvoices();
        return (0, response_1.sendSuccess)(res, result, `${result.updated} invoices updated to overdue status`);
    };
    getMyInvoices = async (req, res, _next) => {
        // Get student ID from authenticated user
        const prisma = (await import('@prisma/client')).PrismaClient;
        const client = new prisma();
        const student = await client.student.findFirst({
            where: { userId: req.user.userId }
        });
        if (!student) {
            return (0, response_1.sendSuccess)(res, { unpaid: { count: 0, total: 0, invoices: [] }, overdue: { count: 0, total: 0, invoices: [] }, recentPayments: [] });
        }
        const summary = await invoice_service_1.invoiceService.getStudentSummary(student.id);
        return (0, response_1.sendSuccess)(res, summary);
    };
    getInvoiceSummary = async (_req, res, _next) => {
        const stats = await invoice_service_1.invoiceService.getSummaryStats();
        return (0, response_1.sendSuccess)(res, stats);
    };
}
exports.invoiceController = new InvoiceController();
//# sourceMappingURL=invoice.controller.js.map