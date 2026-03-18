import { Request, Response, NextFunction } from 'express';
declare class DashboardController {
    getStats: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getRevenueReport: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getOccupancyReport: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const dashboardController: DashboardController;
export {};
//# sourceMappingURL=dashboard.controller.d.ts.map