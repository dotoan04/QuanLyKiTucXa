export interface FinancialReportSummary {
    month: string;
    totalInvoices: number;
    paidInvoices: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    totalRevenue: number;
    collectedRevenue: number;
    outstandingRevenue: number;
    roomRentRevenue: number;
    electricityRevenue: number;
    waterRevenue: number;
    otherRevenue: number;
    collectionRate: number;
}
declare class FinancialReportService {
    generateReport(month: string, generatedBy: string): Promise<{
        month: string;
        generatedAt: string;
        generatedBy: string;
        summary: FinancialReportSummary;
        items: {
            id: string;
            invoiceMonth: Date;
            studentCode: string;
            studentName: string;
            studentEmail: string;
            room: string;
            building: string;
            roomType: string;
            roomRent: number;
            electricity: number;
            water: number;
            otherFees: number;
            totalAmount: number;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            dueDate: Date;
            paidAt: Date | null;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
            paymentRef: string | null;
        }[];
    }>;
    private _sumOtherFees;
    private _buildSummary;
    getMonthlyStats(months?: number): Promise<FinancialReportSummary[]>;
    exportCsv(month: string): Promise<string>;
}
export declare const financialReportService: FinancialReportService;
export {};
//# sourceMappingURL=financial-report.service.d.ts.map