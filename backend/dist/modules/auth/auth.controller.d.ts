import { Request, Response, NextFunction } from 'express';
declare class AuthController {
    register: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    login: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    refreshToken: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    logout: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getMe: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateMe: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    changePassword: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    forgotPassword: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    resetPassword: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getUsers: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getUser: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    createUser: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateUser: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    deleteUser: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const authController: AuthController;
export {};
//# sourceMappingURL=auth.controller.d.ts.map