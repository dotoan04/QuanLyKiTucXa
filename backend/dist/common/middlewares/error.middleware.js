"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const app_error_1 = require("../utils/app-error");
const errorHandler = (err, req, res, _next) => {
    if (err instanceof app_error_1.AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details
            }
        });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
        }
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map