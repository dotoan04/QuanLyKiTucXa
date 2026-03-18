"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(code, message, statusCode, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
    static notFound(resource = 'Resource') {
        return new AppError('NOT_FOUND', `${resource} not found`, 404);
    }
    static badRequest(message, details) {
        return new AppError('BAD_REQUEST', message, 400, details);
    }
    static unauthorized(message = 'Unauthorized') {
        return new AppError('UNAUTHORIZED', message, 401);
    }
    static forbidden(message = 'Forbidden') {
        return new AppError('FORBIDDEN', message, 403);
    }
    static conflict(message) {
        return new AppError('CONFLICT', message, 409);
    }
    static internal(message = 'Internal server error') {
        return new AppError('INTERNAL_ERROR', message, 500);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app-error.js.map