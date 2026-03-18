import { Request, Response, NextFunction } from 'express';
declare class RegistrationController {
    getAll: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    create: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getAvailableRooms: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getMyRegistrations: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    approve: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    reject: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getStats: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const registrationController: RegistrationController;
export {};
//# sourceMappingURL=registrations.controller.d.ts.map