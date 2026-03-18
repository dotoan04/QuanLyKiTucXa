import { Request, Response, NextFunction } from 'express';
declare class RoomController {
    getMyRoom: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getRooms: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getRoomById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    createRoom: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateRoom: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    deleteRoom: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getAvailableRooms: (_req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getRoomStats: (_req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getRoomTypes: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getRoomTypeById: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    createRoomType: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateRoomType: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    deleteRoomType: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const roomController: RoomController;
export {};
//# sourceMappingURL=room.controller.d.ts.map