import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=error.middleware.d.ts.map