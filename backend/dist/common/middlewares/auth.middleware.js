"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const app_error_1 = require("../utils/app-error");
const prisma = new client_1.PrismaClient();
const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new app_error_1.AppError('UNAUTHORIZED', 'Access token required', 401);
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new app_error_1.AppError('SERVER_ERROR', 'JWT secret not configured', 500);
        }
        const payload = jsonwebtoken_1.default.verify(token, secret);
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, role: true, isActive: true }
        });
        if (!user || !user.isActive) {
            throw new app_error_1.AppError('UNAUTHORIZED', 'User not found or inactive', 401);
        }
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new app_error_1.AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
const requireRole = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new app_error_1.AppError('UNAUTHORIZED', 'Authentication required', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new app_error_1.AppError('FORBIDDEN', 'Insufficient permissions', 403));
        }
        next();
    };
};
exports.requireRole = requireRole;
const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET;
            if (secret) {
                const payload = jsonwebtoken_1.default.verify(token, secret);
                req.user = payload;
            }
        }
        next();
    }
    catch {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map