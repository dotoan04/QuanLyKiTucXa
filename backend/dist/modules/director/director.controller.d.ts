import { Request, Response, NextFunction } from 'express';
declare class DirectorController {
    getRoomTypePolicies: (_req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    approveRoomTypePrice: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getPeriodicReport: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    exportPeriodicReport: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const directorController: DirectorController;
export {};
//# sourceMappingURL=director.controller.d.ts.map