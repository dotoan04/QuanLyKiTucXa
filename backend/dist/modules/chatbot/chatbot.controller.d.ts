import { Request, Response, NextFunction } from 'express';
declare class ChatbotController {
    getSessions: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getSession: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    createSession: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    deleteSession: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    clearSessionHistory: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getMessages: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    sendMessage: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    sendMessageStreaming: (req: Request, res: Response, _next: NextFunction) => Promise<void>;
    getStats: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getGlobalStats: (_req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    indexKnowledgeBase: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    getIndexStats: (_req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    addKnowledgeEntry: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    updateKnowledgeEntry: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    deleteKnowledgeEntry: (req: Request, res: Response, _next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export declare const chatbotController: ChatbotController;
export {};
//# sourceMappingURL=chatbot.controller.d.ts.map