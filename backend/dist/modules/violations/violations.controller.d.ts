import { Request, Response, NextFunction } from 'express';
declare class ViolationController {
    create: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getAll: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    process: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getStudentHistory: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    appeal: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const violationController: ViolationController;
export {};
//# sourceMappingURL=violations.controller.d.ts.map