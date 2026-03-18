import { Request, Response, NextFunction } from 'express';
declare class TransferController {
    createTransferRequest: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getMyTransfers: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getAllTransfers: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    processTransfer: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    cancelTransfer: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getTransferFee: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const transferController: TransferController;
export {};
//# sourceMappingURL=transfers.controller.d.ts.map