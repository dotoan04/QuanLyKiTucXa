import { Request, Response, NextFunction } from 'express';
declare class MaintenanceController {
    getAll: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    create: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    update: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    complete: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    delete: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const maintenanceController: MaintenanceController;
export {};
//# sourceMappingURL=maintenance.controller.d.ts.map