import { Request, Response, NextFunction } from 'express';
declare class RenewalController {
    checkEligibility: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getExpiringContracts: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    renewContract: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    sendReminders: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getHistory: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const renewalController: RenewalController;
export {};
//# sourceMappingURL=renewals.controller.d.ts.map