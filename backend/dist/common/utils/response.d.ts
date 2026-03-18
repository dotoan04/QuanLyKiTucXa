import { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendPaginated: <T>(res: Response, data: T[], page: number, limit: number, total: number, extraMeta?: Record<string, unknown>) => Response<any, Record<string, any>>;
export declare const sendError: (res: Response, code: string, message: string, statusCode?: number, details?: unknown) => Response<any, Record<string, any>>;
export declare const sendCreated: <T>(res: Response, data: T, message?: string) => Response<any, Record<string, any>>;
export declare const sendNoContent: (res: Response) => Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map