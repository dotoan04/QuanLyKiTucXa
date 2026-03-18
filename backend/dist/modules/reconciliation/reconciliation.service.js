"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconciliationService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const prisma = new client_1.PrismaClient();
class ReconciliationService {
    async reconcilePayments(data, processedBy) {
        const startDate = new Date(data.month + '-01');
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
        const systemPayments = await prisma.invoice.findMany({
            where: {
                paidAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: client_1.InvoiceStatus.paid,
                paymentMethod: this.mapPaymentGateway(data.paymentGateway),
                paymentRef: { not: null }
            },
            include: {
                contract: {
                    include: {
                        student: {
                            select: {
                                studentCode: true,
                                user: { select: { fullName: true, email: true } }
                            }
                        }
                    }
                }
            }
        });
        const systemTransactionIds = new Set(systemPayments
            .filter(p => p.paymentRef)
            .map(p => p.paymentRef));
        const gatewayTransactionIds = new Set(data.transactions.map(t => t.transactionId));
        const discrepancies = [];
        let matched = 0;
        for (const gatewayTx of data.transactions) {
            if (!systemTransactionIds.has(gatewayTx.transactionId)) {
                discrepancies.push({
                    type: 'missing_in_system',
                    transactionId: gatewayTx.transactionId,
                    gatewayAmount: gatewayTx.amount,
                    studentCode: gatewayTx.studentCode,
                    description: `Transaction ${gatewayTx.transactionId} found in ${data.paymentGateway} but not in system`
                });
            }
            else {
                const systemPayment = systemPayments.find(p => p.paymentRef === gatewayTx.transactionId);
                if (systemPayment) {
                    const systemAmount = systemPayment.totalAmount.toNumber();
                    if (Math.abs(systemAmount - gatewayTx.amount) > 1) {
                        discrepancies.push({
                            type: 'amount_mismatch',
                            transactionId: gatewayTx.transactionId,
                            invoiceId: systemPayment.id,
                            systemAmount,
                            gatewayAmount: gatewayTx.amount,
                            studentCode: systemPayment.contract.student.studentCode,
                            description: `Amount mismatch: System ${systemAmount}, Gateway ${gatewayTx.amount}`
                        });
                    }
                    else {
                        matched++;
                    }
                }
            }
        }
        for (const systemPayment of systemPayments) {
            if (!gatewayTransactionIds.has(systemPayment.paymentRef ?? '')) {
                discrepancies.push({
                    type: 'missing_in_gateway',
                    transactionId: systemPayment.paymentRef ?? undefined,
                    invoiceId: systemPayment.id,
                    systemAmount: systemPayment.totalAmount.toNumber(),
                    studentCode: systemPayment.contract.student.studentCode,
                    description: `Transaction ${systemPayment.paymentRef} found in system but not in ${data.paymentGateway}`
                });
            }
        }
        const reportData = {
            totalTransactions: data.transactions.length,
            matched,
            unmatched: discrepancies.length,
            discrepancies: discrepancies,
            processedAt: new Date().toISOString(),
            processedBy
        };
        const report = await prisma.reconciliationReport.create({
            data: {
                month: data.month,
                paymentGateway: data.paymentGateway,
                status: 'processed',
                data: reportData,
                processedAt: new Date(),
                processedBy,
                notes: `Reconciliation completed. ${matched} matched, ${discrepancies.length} discrepancies found.`
            }
        });
        return {
            reportId: report.id,
            totalTransactions: data.transactions.length,
            matched,
            unmatched: discrepancies.length,
            discrepancies,
            successRate: data.transactions.length > 0 ? Math.round((matched / data.transactions.length) * 100) : 0
        };
    }
    mapPaymentGateway(gateway) {
        const mapping = {
            'vnpay': client_1.PaymentMethod.vnpay,
            'momo': client_1.PaymentMethod.momo,
            'banking': client_1.PaymentMethod.transfer
        };
        return mapping[gateway.toLowerCase()] || client_1.PaymentMethod.transfer;
    }
    async getReconciliationReports(params) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.month) {
            where.month = params.month;
        }
        if (params.gateway) {
            where.paymentGateway = params.gateway;
        }
        const [reports, total] = await Promise.all([
            prisma.reconciliationReport.findMany({
                where,
                skip,
                take: limit,
                include: {
                    processor: { select: { id: true, fullName: true, email: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.reconciliationReport.count({ where })
        ]);
        return { reports, page, limit, total };
    }
    async getReportDetails(id) {
        const report = await prisma.reconciliationReport.findUnique({
            where: { id },
            include: {
                processor: { select: { id: true, fullName: true, email: true } }
            }
        });
        if (!report) {
            throw app_error_1.AppError.notFound('Reconciliation report');
        }
        return report;
    }
    async resolveDiscrepancy(reportId, discrepancyIndex, action, notes) {
        const report = await prisma.reconciliationReport.findUnique({
            where: { id: reportId }
        });
        if (!report) {
            throw app_error_1.AppError.notFound('Reconciliation report');
        }
        const data = report.data;
        if (!data.discrepancies || discrepancyIndex >= data.discrepancies.length) {
            throw app_error_1.AppError.badRequest('Invalid discrepancy index');
        }
        const discrepancy = data.discrepancies[discrepancyIndex];
        if (action === 'confirm' && discrepancy.type === 'missing_in_system') {
            const student = await prisma.student.findFirst({
                where: { studentCode: discrepancy.studentCode },
                include: {
                    contracts: {
                        where: { status: 'active' },
                        take: 1
                    }
                }
            });
            if (student && student.contracts[0]) {
                const invoice = await prisma.invoice.findFirst({
                    where: {
                        contractId: student.contracts[0].id,
                        status: client_1.InvoiceStatus.unpaid
                    },
                    orderBy: { dueDate: 'asc' }
                });
                if (invoice) {
                    await prisma.invoice.update({
                        where: { id: invoice.id },
                        data: {
                            status: client_1.InvoiceStatus.paid,
                            paymentMethod: this.mapPaymentGateway(report.paymentGateway),
                            paymentRef: discrepancy.transactionId,
                            paidAt: new Date()
                        }
                    });
                }
            }
        }
        data.discrepancies[discrepancyIndex].resolved = true;
        data.discrepancies[discrepancyIndex].resolutionAction = action;
        data.discrepancies[discrepancyIndex].resolutionNotes = notes;
        data.discrepancies[discrepancyIndex].resolvedAt = new Date();
        await prisma.reconciliationReport.update({
            where: { id: reportId },
            data: {
                data,
                notes: `${report.notes}\nDiscrepancy ${discrepancyIndex} resolved: ${action}`
            }
        });
        return true;
    }
    async getReconciliationStats(month) {
        const where = {};
        if (month) {
            where.month = month;
        }
        const reports = await prisma.reconciliationReport.findMany({
            where,
            select: {
                data: true,
                paymentGateway: true,
                month: true
            }
        });
        const stats = {
            totalReports: reports.length,
            totalTransactions: 0,
            totalMatched: 0,
            totalDiscrepancies: 0,
            byGateway: {}
        };
        for (const report of reports) {
            const data = report.data;
            if (data) {
                stats.totalTransactions += data.totalTransactions || 0;
                stats.totalMatched += data.matched || 0;
                stats.totalDiscrepancies += data.unmatched || 0;
                if (!stats.byGateway[report.paymentGateway]) {
                    stats.byGateway[report.paymentGateway] = {
                        total: 0,
                        matched: 0,
                        discrepancies: 0
                    };
                }
                stats.byGateway[report.paymentGateway].total += data.totalTransactions || 0;
                stats.byGateway[report.paymentGateway].matched += data.matched || 0;
                stats.byGateway[report.paymentGateway].discrepancies += data.unmatched || 0;
            }
        }
        stats.totalMatched = Math.round(stats.totalMatched);
        stats.totalDiscrepancies = Math.round(stats.totalDiscrepancies);
        return stats;
    }
}
exports.reconciliationService = new ReconciliationService();
//# sourceMappingURL=reconciliation.service.js.map