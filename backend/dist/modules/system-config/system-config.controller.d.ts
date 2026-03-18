import { Request, Response, NextFunction } from 'express';
declare class SystemConfigController {
    getAll: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getByKey: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    set: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    setBatch: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const systemConfigController: SystemConfigController;
export {};
//# sourceMappingURL=system-config.controller.d.ts.map