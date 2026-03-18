export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly details?: unknown;
    constructor(code: string, message: string, statusCode: number, details?: unknown);
    static notFound(resource?: string): AppError;
    static badRequest(message: string, details?: unknown): AppError;
    static unauthorized(message?: string): AppError;
    static forbidden(message?: string): AppError;
    static conflict(message: string): AppError;
    static internal(message?: string): AppError;
}
//# sourceMappingURL=app-error.d.ts.map