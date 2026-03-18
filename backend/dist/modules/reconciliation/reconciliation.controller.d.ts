import { Request, Response, NextFunction } from 'express';
declare class ReconciliationController {
    reconcile: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getReports: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getReportDetails: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    resolveDiscrepancy: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getStats: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const reconciliationController: ReconciliationController;
export {};
//# sourceMappingURL=reconciliation.controller.d.ts.map