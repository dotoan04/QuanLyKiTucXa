"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.temporaryLeaveService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const prisma = new client_1.PrismaClient();
class TemporaryLeaveService {
    async create(data, userId) {
        const contract = await prisma.contract.findUnique({
            where: { id: data.contractId },
            include: {
                student: {
                    include: { user: true }
                },
                room: true
            }
        });
        if (!contract) {
            throw app_error_1.AppError.notFound('Contract');
        }
        if (contract.status !== 'active') {
            throw app_error_1.AppError.badRequest('Can only register leave for active contracts');
        }
        const student = await prisma.student.findFirst({
            where: { userId }
        });
        if (!student || contract.studentId !== student.id) {
            throw app_error_1.AppError.forbidden('You can only register leave for your own contract');
        }
        if (new Date(data.leaveDate) < new Date()) {
            throw app_error_1.AppError.badRequest('Leave date cannot be in the past');
        }
        if (new Date(data.returnDate) <= new Date(data.leaveDate)) {
            throw app_error_1.AppError.badRequest('Return date must be after leave date');
        }
        const maxLeaveDays = 30;
        const leaveDuration = Math.ceil((new Date(data.returnDate).getTime() - new Date(data.leaveDate).getTime()) / (1000 * 60 * 60 * 24));
        if (leaveDuration > maxLeaveDays) {
            throw app_error_1.AppError.badRequest(`Maximum leave duration is ${maxLeaveDays} days`);
        }
        const existingLeave = await prisma.temporaryLeave.findFirst({
            where: {
                contractId: data.contractId,
                status: 'active'
            }
        });
        if (existingLeave) {
            throw app_error_1.AppError.conflict('You already have an active temporary leave registration');
        }
        const leave = await prisma.temporaryLeave.create({
            data: {
                contractId: data.contractId,
                leaveDate: data.leaveDate,
                returnDate: data.returnDate,
                reason: data.reason,
                contactPhone: data.contactPhone,
                emergencyContact: data.emergencyContact,
                status: 'active'
            },
            include: {
                contract: {
                    include: {
                        student: {
                            include: { user: { select: { id: true, fullName: true, email: true } } }
                        },
                        room: { include: { roomType: true } }
                    }
                }
            }
        });
        const admins = await prisma.user.findMany({
            where: { role: 'admin', isActive: true }
        });
        await Promise.all(admins.map(admin => prisma.notification.create({
            data: {
                userId: admin.id,
                type: 'room_approved',
                title: 'New Temporary Leave Registration',
                message: `Student ${contract.student.user.fullName} has registered temporary leave from ${new Date(data.leaveDate).toLocaleDateString('vi-VN')} to ${new Date(data.returnDate).toLocaleDateString('vi-VN')}`,
                referenceId: leave.id,
                referenceType: 'temporary_leave'
            }
        })));
        return leave;
    }
    async getMyLeaves(userId) {
        const student = await prisma.student.findFirst({
            where: { userId }
        });
        if (!student) {
            throw app_error_1.AppError.notFound('Student');
        }
        const contracts = await prisma.contract.findMany({
            where: { studentId: student.id },
            select: { id: true }
        });
        const contractIds = contracts.map(c => c.id);
        const leaves = await prisma.temporaryLeave.findMany({
            where: {
                contractId: { in: contractIds }
            },
            include: {
                contract: {
                    include: {
                        room: { include: { roomType: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const now = new Date();
        return leaves.map(leave => {
            const daysRemaining = Math.ceil((new Date(leave.returnDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysRemaining < 0 && leave.status === 'active';
            return {
                ...leave,
                reason: leave.reason ?? undefined,
                daysRemaining,
                isOverdue
            };
        });
    }
    async getAllLeaves(params) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.status) {
            where.status = params.status;
        }
        const [leaves, total] = await Promise.all([
            prisma.temporaryLeave.findMany({
                where,
                skip,
                take: limit,
                include: {
                    contract: {
                        include: {
                            student: {
                                include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
                            },
                            room: { include: { roomType: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.temporaryLeave.count({ where })
        ]);
        return { leaves, page, limit, total };
    }
    async markAsReturned(id) {
        const leave = await prisma.temporaryLeave.findUnique({
            where: { id },
            include: {
                contract: {
                    include: {
                        student: { include: { user: true } }
                    }
                }
            }
        });
        if (!leave) {
            throw app_error_1.AppError.notFound('Temporary leave');
        }
        if (leave.status !== 'active') {
            throw app_error_1.AppError.badRequest('Leave is not active');
        }
        const updated = await prisma.temporaryLeave.update({
            where: { id },
            data: {
                status: 'returned',
                actualReturnDate: new Date()
            }
        });
        await prisma.notification.create({
            data: {
                userId: leave.contract.student.userId,
                type: 'room_approved',
                title: 'Welcome Back',
                message: `Your temporary leave has been marked as returned. Welcome back!`,
                referenceId: leave.id,
                referenceType: 'temporary_leave'
            }
        });
        return updated;
    }
    async cancel(id, userId) {
        const leave = await prisma.temporaryLeave.findUnique({
            where: { id },
            include: {
                contract: {
                    include: { student: true }
                }
            }
        });
        if (!leave) {
            throw app_error_1.AppError.notFound('Temporary leave');
        }
        const student = await prisma.student.findFirst({
            where: { userId }
        });
        if (!student || leave.contract.studentId !== student.id) {
            throw app_error_1.AppError.forbidden('You can only cancel your own leave registration');
        }
        if (leave.status !== 'active') {
            throw app_error_1.AppError.badRequest('Can only cancel active leave registrations');
        }
        await prisma.temporaryLeave.update({
            where: { id },
            data: { status: 'cancelled' }
        });
        return true;
    }
    async checkOverdueLeaves() {
        const now = new Date();
        const overdueLeaves = await prisma.temporaryLeave.findMany({
            where: {
                status: 'active',
                returnDate: { lt: now }
            },
            include: {
                contract: {
                    include: {
                        student: {
                            include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
                        },
                        room: { include: { roomType: true } }
                    }
                }
            }
        });
        await Promise.all(overdueLeaves.map(leave => prisma.temporaryLeave.update({
            where: { id: leave.id },
            data: { status: 'overdue' }
        })));
        await Promise.all(overdueLeaves.map(leave => prisma.notification.create({
            data: {
                userId: leave.contract.student.user.id,
                type: 'room_approved',
                title: 'Overdue Leave',
                message: `Your temporary leave is overdue. Please return immediately or contact admin.`,
                referenceId: leave.id,
                referenceType: 'temporary_leave'
            }
        })));
        return {
            overdueCount: overdueLeaves.length,
            leaves: overdueLeaves
        };
    }
}
exports.temporaryLeaveService = new TemporaryLeaveService();
//# sourceMappingURL=temporary-leave.service.js.map