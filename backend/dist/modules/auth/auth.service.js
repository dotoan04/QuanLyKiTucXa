"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const email_1 = require("../../common/utils/email");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
class AuthService {
    generateTokens(payload) {
        const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN
        });
        return { accessToken, refreshToken };
    }
    async register(data) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            throw app_error_1.AppError.conflict('Email already registered');
        }
        if (data.studentCode) {
            const existingStudent = await prisma.student.findUnique({
                where: { studentCode: data.studentCode }
            });
            if (existingStudent) {
                throw app_error_1.AppError.conflict('Student code already registered');
            }
        }
        const passwordHash = await bcrypt_1.default.hash(data.password, 12);
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    role: client_1.UserRole.student,
                    fullName: data.fullName,
                    phone: data.phone
                }
            });
            const student = await tx.student.create({
                data: {
                    userId: user.id,
                    studentCode: data.studentCode || `STU${Date.now()}`,
                    idCardNumber: data.idCardNumber,
                    dateOfBirth: data.dateOfBirth,
                    gender: data.gender,
                    hometown: data.hometown,
                    faculty: data.faculty,
                    academicYear: data.academicYear
                }
            });
            return { user, student };
        });
        const tokens = this.generateTokens({
            userId: result.user.id,
            email: result.user.email,
            role: result.user.role
        });
        return {
            user: {
                id: result.user.id,
                email: result.user.email,
                fullName: result.user.fullName,
                role: result.user.role
            },
            ...tokens
        };
    }
    async login(email, password) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { student: true, staffInfo: true }
        });
        if (!user || !user.isActive) {
            throw app_error_1.AppError.unauthorized('Invalid credentials');
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw app_error_1.AppError.unauthorized('Invalid credentials');
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        const tokens = this.generateTokens({
            userId: user.id,
            email: user.email,
            role: user.role
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                student: user.student,
                staffInfo: user.staffInfo
            },
            ...tokens
        };
    }
    async refreshToken(refreshToken) {
        try {
            const payload = jsonwebtoken_1.default.verify(refreshToken, JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: payload.userId }
            });
            if (!user || !user.isActive) {
                throw app_error_1.AppError.unauthorized('Invalid refresh token');
            }
            return this.generateTokens({
                userId: user.id,
                email: user.email,
                role: user.role
            });
        }
        catch {
            throw app_error_1.AppError.unauthorized('Invalid refresh token');
        }
    }
    async logout(_refreshToken) {
        return true;
    }
    async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { student: true, staffInfo: true }
        });
        if (!user) {
            throw app_error_1.AppError.notFound('User');
        }
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async updateUser(userId, data) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                fullName: data.fullName,
                phone: data.phone,
                avatarUrl: data.avatarUrl
            }
        });
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw app_error_1.AppError.notFound('User');
        }
        const isPasswordValid = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw app_error_1.AppError.badRequest('Current password is incorrect');
        }
        const passwordHash = await bcrypt_1.default.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash }
        });
        return true;
    }
    async forgotPassword(email) {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return true;
        }
        const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, purpose: 'reset-password' }, JWT_SECRET, { expiresIn: '1h' });
        await (0, email_1.sendResetPasswordEmail)(email, resetToken);
        return true;
    }
    async resetPassword(token, password) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (payload.purpose !== 'reset-password') {
                throw app_error_1.AppError.badRequest('Invalid reset token');
            }
            const passwordHash = await bcrypt_1.default.hash(password, 12);
            await prisma.user.update({
                where: { id: payload.userId },
                data: { passwordHash }
            });
            return true;
        }
        catch {
            throw app_error_1.AppError.badRequest('Invalid or expired reset token');
        }
    }
    async getUsers(query) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const skip = (page - 1) * limit;
        const where = {};
        if (query.role) {
            where.role = query.role;
        }
        if (query.search) {
            where.OR = [
                { fullName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } }
            ];
        }
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    phone: true,
                    isActive: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);
        return { users, page, limit, total };
    }
    async deleteUser(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false }
        });
        return true;
    }
    async createUser(data) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            throw app_error_1.AppError.conflict('Email đã được sử dụng');
        }
        const passwordHash = await bcrypt_1.default.hash(data.password, 12);
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: data.email,
                    passwordHash,
                    role: data.role,
                    fullName: data.fullName,
                    phone: data.phone,
                    isActive: true
                }
            });
            if (data.role === 'staff' || data.role === 'accountant' || data.role === 'technician' || data.role === 'director') {
                await tx.staffInfo.create({
                    data: {
                        userId: newUser.id,
                        position: data.position || 'Nhân viên',
                        department: data.department || 'Ban quản lý KTX'
                    }
                });
            }
            return newUser;
        });
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            phone: user.phone,
            isActive: user.isActive,
            createdAt: user.createdAt
        };
    }
}
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map