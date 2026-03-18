"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AuditLogService {
    async create(data) {
        return prisma.auditLog.create({ data: data });
    }
    async getAll({ page, limit, action, entity, userId, startDate, endDate }) {
        const skip = (page - 1) * limit;
        const where = {};
        if (action)
            where.action = action;
        if (entity)
            where.entity = entity;
        if (userId)
            where.userId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true, fullName: true } } }
            }),
            prisma.auditLog.count({ where })
        ]);
        return { items: logs, page, limit, total };
    }
    async getById(id) {
        return prisma.auditLog.findUnique({
            where: { id },
            include: { user: { select: { id: true, email: true, fullName: true } } }
        });
    }
    async getByEntity(entity, entityId) {
        return prisma.auditLog.findMany({
            where: { entity, entityId },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, email: true, fullName: true } } }
        });
    }
}
exports.auditLogService = new AuditLogService();
//# sourceMappingURL=audit-log.service.js.map