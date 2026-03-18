import { Request, Response, NextFunction } from 'express';
declare class TemporaryLeaveController {
    create: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getMyLeaves: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getAllLeaves: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    markAsReturned: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    cancel: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    checkOverdue: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const temporaryLeaveController: TemporaryLeaveController;
export {};
//# sourceMappingURL=temporary-leave.controller.d.ts.map