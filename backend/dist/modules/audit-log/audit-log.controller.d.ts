import { Request, Response, NextFunction } from 'express';
declare class AuditLogController {
    getAll: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getByEntity: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const auditLogController: AuditLogController;
export {};
//# sourceMappingURL=audit-log.controller.d.ts.map