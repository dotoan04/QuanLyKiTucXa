"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class MaintenanceService {
    async getAll({ page, limit, status, type, roomId, startDate, endDate }) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        if (roomId)
            where.roomId = roomId;
        if (startDate || endDate) {
            where.scheduledAt = {};
            if (startDate)
                where.scheduledAt.gte = startDate;
            if (endDate)
                where.scheduledAt.lte = endDate;
        }
        const [items, total] = await Promise.all([
            prisma.scheduledMaintenance.findMany({
                where,
                skip,
                take: limit,
                orderBy: { scheduledAt: 'asc' },
                include: {
                    room: { select: { id: true, roomNumber: true, building: true, floor: true } },
                    assignee: { select: { id: true, fullName: true, email: true } }
                }
            }),
            prisma.scheduledMaintenance.count({ where })
        ]);
        return { items, page, limit, total };
    }
    async getById(id) {
        return prisma.scheduledMaintenance.findUnique({
            where: { id },
            include: {
                room: { select: { id: true, roomNumber: true, building: true, floor: true } },
                assignee: { select: { id: true, fullName: true, email: true } }
            }
        });
    }
    async create(data) {
        return prisma.scheduledMaintenance.create({
            data: {
                title: data.title,
                description: data.description,
                type: data.type,
                roomId: data.roomId,
                area: data.area,
                scheduledAt: data.scheduledAt,
                assigneeId: data.assigneeId,
                status: 'scheduled'
            },
            include: {
                room: { select: { id: true, roomNumber: true, building: true, floor: true } },
                assignee: { select: { id: true, fullName: true, email: true } }
            }
        });
    }
    async update(id, data) {
        return prisma.scheduledMaintenance.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                type: data.type,
                roomId: data.roomId,
                area: data.area,
                scheduledAt: data.scheduledAt,
                assigneeId: data.assigneeId
            },
            include: {
                room: { select: { id: true, roomNumber: true, building: true, floor: true } },
                assignee: { select: { id: true, fullName: true, email: true } }
            }
        });
    }
    async complete(id, notes, cost) {
        return prisma.scheduledMaintenance.update({
            where: { id },
            data: {
                status: 'completed',
                completedAt: new Date(),
                notes,
                cost: cost ? cost : undefined
            },
            include: {
                room: { select: { id: true, roomNumber: true, building: true, floor: true } },
                assignee: { select: { id: true, fullName: true, email: true } }
            }
        });
    }
    async delete(id) {
        return prisma.scheduledMaintenance.delete({ where: { id } });
    }
}
exports.maintenanceService = new MaintenanceService();
//# sourceMappingURL=maintenance.service.js.map