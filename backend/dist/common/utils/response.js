"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNoContent = exports.sendCreated = exports.sendError = exports.sendPaginated = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message, statusCode = 200) => {
    const response = {
        success: true,
        data,
        ...(message && { message })
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendPaginated = (res, data, page, limit, total, extraMeta) => {
    const response = {
        success: true,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            ...(extraMeta || {})
        }
    };
    return res.status(200).json(response);
};
exports.sendPaginated = sendPaginated;
const sendError = (res, code, message, statusCode = 400, details) => {
    const errorPayload = {
        code,
        message
    };
    if (details !== undefined) {
        errorPayload.details = details;
    }
    const response = {
        success: false,
        error: errorPayload
    };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
const sendCreated = (res, data, message) => {
    return (0, exports.sendSuccess)(res, data, message, 201);
};
exports.sendCreated = sendCreated;
const sendNoContent = (res) => {
    return res.status(204).send();
};
exports.sendNoContent = sendNoContent;
//# sourceMappingURL=response.js.map