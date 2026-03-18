import { Request, Response, NextFunction } from 'express';
declare class StudentController {
    getStudents: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getStudentByCode: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getStudentById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateStudent: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getStudentContracts: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getStudentInvoices: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getStudentIncidents: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getStudentStats: (_req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getMyProfile: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getMyContracts: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateMyProfile: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const studentController: StudentController;
export {};
//# sourceMappingURL=student.controller.d.ts.map