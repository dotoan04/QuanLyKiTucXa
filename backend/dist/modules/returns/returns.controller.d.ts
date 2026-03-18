import { Request, Response, NextFunction } from 'express';
declare class ReturnController {
    createReturnRequest: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getMyReturnRequests: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getAllReturnRequests: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getReturnRequestById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    scheduleInspection: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    completeInspection: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    processRefund: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    cancelReturnRequest: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const returnController: ReturnController;
export {};
//# sourceMappingURL=returns.controller.d.ts.map