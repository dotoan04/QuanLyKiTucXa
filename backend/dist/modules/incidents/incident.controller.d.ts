import { Request, Response, NextFunction } from 'express';
declare class IncidentController {
    getIncidents: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getIncidentById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    createIncident: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateIncident: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    assignIncident: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateIncidentStatus: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    resolveIncident: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    deleteIncident: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getIncidentStats: (_req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getMyIncidents: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const incidentController: IncidentController;
export {};
//# sourceMappingURL=incident.controller.d.ts.map