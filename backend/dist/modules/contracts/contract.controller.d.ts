import { Request, Response, NextFunction } from 'express';
declare class ContractController {
    getContracts: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getContractById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    createContract: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateContract: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    terminateContract: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getContractStats: (_req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    createHandover: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getHandover: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    createRegistrationRequest: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getRegistrationRequests: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    approveRegistrationRequest: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    rejectRegistrationRequest: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const contractController: ContractController;
export {};
//# sourceMappingURL=contract.controller.d.ts.map