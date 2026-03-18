import { PaymentMethod } from '@prisma/client';
interface ReconciliationData {
    month: string;
    paymentGateway: string;
    transactions: TransactionData[];
}
interface TransactionData {
    transactionId: string;
    amount: number;
    timestamp: Date;
    status: string;
    studentCode?: string;
    invoiceId?: string;
}
interface Discrepancy {
    type: 'missing_in_system' | 'missing_in_gateway' | 'amount_mismatch' | 'status_mismatch';
    transactionId?: string;
    invoiceId?: string;
    systemAmount?: number;
    gatewayAmount?: number;
    studentCode?: string;
    description: string;
}
declare class ReconciliationService {
    reconcilePayments(data: ReconciliationData, processedBy: string): Promise<{
        reportId: string;
        totalTransactions: number;
        matched: number;
        unmatched: number;
        discrepancies: Discrepancy[];
        successRate: number;
    }>;
    mapPaymentGateway(gateway: string): PaymentMethod;
    getReconciliationReports(params: {
        month?: string;
        gateway?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        reports: ({
            processor: {
                id: string;
                email: string;
                fullName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            status: string;
            notes: string | null;
            month: string;
            processedAt: Date | null;
            processedBy: string | null;
            paymentGateway: string;
        })[];
        page: number;
        limit: number;
        total: number;
    }>;
    getReportDetails(id: string): Promise<{
        processor: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        notes: string | null;
        month: string;
        processedAt: Date | null;
        processedBy: string | null;
        paymentGateway: string;
    }>;
    resolveDiscrepancy(reportId: string, discrepancyIndex: number, action: 'confirm' | 'reject', notes: string): Promise<boolean>;
    getReconciliationStats(month?: string): Promise<{
        totalReports: number;
        totalTransactions: number;
        totalMatched: number;
        totalDiscrepancies: number;
        byGateway: Record<string, {
            total: number;
            matched: number;
            discrepancies: number;
        }>;
    }>;
}
export declare const reconciliationService: ReconciliationService;
export {};
//# sourceMappingURL=reconciliation.service.d.ts.map