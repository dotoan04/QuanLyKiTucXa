import { Request, Response, NextFunction } from 'express';
declare class InvoiceController {
    private parseInvoiceMonth;
    getCurrentInvoice: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getInvoices: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getInvoiceById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    generateInvoice: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    generateBatchInvoices: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateInvoice: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    processPayment: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getMonthlyStats: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getStudentSummary: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateOverdueInvoices: (_req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getMyInvoices: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getInvoiceSummary: (_req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const invoiceController: InvoiceController;
export {};
//# sourceMappingURL=invoice.controller.d.ts.map