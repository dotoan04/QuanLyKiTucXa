import { Request, Response, NextFunction } from 'express';
declare class FinancialReportController {
    generate: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getMonthlyStats: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    exportCsv: (req: Request, res: Response, _next: NextFunction) => Promise<void>;
    exportJson: (req: Request, res: Response, _next: NextFunction) => Promise<void>;
}
export declare const financialReportController: FinancialReportController;
export {};
//# sourceMappingURL=financial-report.controller.d.ts.map