"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const prisma = new client_1.PrismaClient();
class ReturnService {
    async createReturnRequest(data, userId) {
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
            throw app_error_1.AppError.badRequest('Contract is not active');
        }
        const student = await prisma.student.findFirst({
            where: { userId }
        });
        if (!student || contract.studentId !== student.id) {
            throw app_error_1.AppError.forbidden('You can only return your own contract');
        }
        const minReturnDate = new Date();
        minReturnDate.setDate(minReturnDate.getDate() + 7);
        if (new Date(data.returnDate) < minReturnDate) {
            throw app_error_1.AppError.badRequest('Return date must be at least 7 days from now');
        }
        const unpaidInvoices = await prisma.invoice.count({
            where: {
                contractId: data.contractId,
                status: { in: ['unpaid', 'overdue', 'partial'] }
            }
        });
        if (unpaidInvoices > 0) {
            throw app_error_1.AppError.badRequest(`You have ${unpaidInvoices} unpaid invoice(s). Please pay before returning room.`);
        }
        const existingReturn = await prisma.contract.findFirst({
            where: {
                studentId: student.id,
                status: client_1.ContractStatus.pending
            }
        });
        if (existingReturn) {
            throw app_error_1.AppError.conflict('Return request already exists');
        }
        const returnRequest = await prisma.$transaction(async (tx) => {
            const request = await tx.returnRequest.create({
                data: {
                    contractId: data.contractId,
                    returnDate: data.returnDate,
                    reason: data.reason,
                    status: 'pending'
                }
            });
            await tx.contract.update({
                where: { id: data.contractId },
                data: { status: client_1.ContractStatus.pending }
            });
            return request;
        });
        const admins = await prisma.user.findMany({
            where: { role: 'admin', isActive: true }
        });
        await Promise.all(admins.map(admin => prisma.notification.create({
            data: {
                userId: admin.id,
                type: 'room_approved',
                title: 'New Return Request',
                message: `Student ${contract.student.user.fullName} requested to return room ${contract.room.roomNumber}`,
                referenceId: returnRequest.id,
                referenceType: 'return_request'
            }
        })));
        return returnRequest;
    }
    async scheduleInspection(data) {
        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: data.returnRequestId },
            include: {
                contract: {
                    include: {
                        student: { include: { user: true } },
                        room: true
                    }
                }
            }
        });
        if (!returnRequest) {
            throw app_error_1.AppError.notFound('Return request');
        }
        if (returnRequest.status !== 'pending') {
            throw app_error_1.AppError.badRequest('Return request is not in pending status');
        }
        const inspector = await prisma.user.findFirst({
            where: {
                id: data.inspectorId,
                role: { in: ['admin', 'staff'] }
            }
        });
        if (!inspector) {
            throw app_error_1.AppError.notFound('Inspector');
        }
        const updated = await prisma.returnRequest.update({
            where: { id: data.returnRequestId },
            data: {
                scheduledDate: data.scheduledDate,
                inspectorId: data.inspectorId,
                status: 'scheduled'
            }
        });
        await prisma.notification.create({
            data: {
                userId: returnRequest.contract.student.userId,
                type: 'room_approved',
                title: 'Inspection Scheduled',
                message: `Your room inspection is scheduled for ${new Date(data.scheduledDate).toLocaleDateString('vi-VN')} at ${new Date(data.scheduledDate).toLocaleTimeString('vi-VN')}`,
                referenceId: returnRequest.id,
                referenceType: 'return_request'
            }
        });
        await prisma.notification.create({
            data: {
                userId: data.inspectorId,
                type: 'room_approved',
                title: 'Inspection Assignment',
                message: `You are assigned to inspect room ${returnRequest.contract.room.roomNumber} on ${new Date(data.scheduledDate).toLocaleDateString('vi-VN')}`,
                referenceId: returnRequest.id,
                referenceType: 'return_request'
            }
        });
        return updated;
    }
    async completeInspection(data) {
        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: data.returnRequestId },
            include: {
                contract: {
                    include: {
                        student: { include: { user: true } },
                        room: true
                    }
                }
            }
        });
        if (!returnRequest) {
            throw app_error_1.AppError.notFound('Return request');
        }
        if (returnRequest.status !== 'scheduled') {
            throw app_error_1.AppError.badRequest('Return request is not scheduled');
        }
        const updated = await prisma.returnRequest.update({
            where: { id: data.returnRequestId },
            data: {
                damageNotes: data.damageNotes,
                damagePhotos: data.damagePhotos || [],
                damageAmount: data.damageAmount || 0,
                inspectionNotes: data.inspectionNotes,
                status: 'inspected'
            }
        });
        await prisma.notification.create({
            data: {
                userId: returnRequest.contract.student.userId,
                type: 'room_approved',
                title: 'Inspection Completed',
                message: `Your room inspection has been completed. ${data.damageAmount ? `Damage fee: ${data.damageAmount.toLocaleString('vi-VN')}đ` : 'No damage found.'}`,
                referenceId: returnRequest.id,
                referenceType: 'return_request'
            }
        });
        return updated;
    }
    async processRefund(data) {
        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: data.returnRequestId },
            include: {
                contract: {
                    include: {
                        student: { include: { user: true } },
                        room: { include: { roomType: true } }
                    }
                }
            }
        });
        if (!returnRequest) {
            throw app_error_1.AppError.notFound('Return request');
        }
        if (returnRequest.status !== 'inspected') {
            throw app_error_1.AppError.badRequest('Return request must be inspected first');
        }
        const contract = returnRequest.contract;
        const depositAmount = contract.depositAmount.toNumber();
        const damageAmount = returnRequest.damageAmount?.toNumber() || 0;
        const refundAmount = Math.max(0, depositAmount - damageAmount);
        const result = await prisma.$transaction(async (tx) => {
            await tx.contract.update({
                where: { id: contract.id },
                data: {
                    status: client_1.ContractStatus.terminated,
                    terminationReason: returnRequest.reason || 'Room return',
                    updatedAt: new Date()
                }
            });
            await tx.room.update({
                where: { id: contract.roomId },
                data: {
                    status: client_1.RoomStatus.available,
                    currentOccupancy: { decrement: 1 }
                }
            });
            const refund = await tx.returnRequest.update({
                where: { id: data.returnRequestId },
                data: {
                    status: 'completed',
                    refundAmount,
                    bankAccount: data.bankAccount,
                    bankName: data.bankName,
                    completedAt: new Date()
                }
            });
            return refund;
        });
        await prisma.notification.create({
            data: {
                userId: contract.student.userId,
                type: 'room_approved',
                title: 'Refund Processed',
                message: `Your deposit refund of ${refundAmount.toLocaleString('vi-VN')}đ has been processed. It will be transferred within 7 business days.`,
                referenceId: returnRequest.id,
                referenceType: 'return_request'
            }
        });
        return {
            ...result,
            depositAmount,
            damageAmount,
            refundAmount
        };
    }
    async getMyReturnRequests(userId) {
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
        const returnRequests = await prisma.returnRequest.findMany({
            where: {
                contractId: { in: contractIds }
            },
            include: {
                contract: {
                    include: {
                        room: {
                            include: { roomType: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return returnRequests;
    }
    async getAllReturnRequests(params) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.status) {
            where.status = params.status;
        }
        const [requests, total] = await Promise.all([
            prisma.returnRequest.findMany({
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
                    },
                    inspector: { select: { id: true, fullName: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.returnRequest.count({ where })
        ]);
        return { requests, page, limit, total };
    }
    async getReturnRequestById(id) {
        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id },
            include: {
                contract: {
                    include: {
                        student: {
                            include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
                        },
                        room: { include: { roomType: true } },
                        assetHandover: true
                    }
                },
                inspector: { select: { id: true, fullName: true, email: true } }
            }
        });
        if (!returnRequest) {
            throw app_error_1.AppError.notFound('Return request');
        }
        return returnRequest;
    }
    async cancelReturnRequest(id, userId) {
        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id },
            include: {
                contract: {
                    include: { student: true }
                }
            }
        });
        if (!returnRequest) {
            throw app_error_1.AppError.notFound('Return request');
        }
        const student = await prisma.student.findFirst({
            where: { userId }
        });
        if (!student || returnRequest.contract.studentId !== student.id) {
            throw app_error_1.AppError.forbidden('You can only cancel your own return request');
        }
        if (returnRequest.status !== 'pending') {
            throw app_error_1.AppError.badRequest('Can only cancel pending return requests');
        }
        await prisma.$transaction(async (tx) => {
            await tx.returnRequest.update({
                where: { id },
                data: { status: 'cancelled' }
            });
            await tx.contract.update({
                where: { id: returnRequest.contractId },
                data: { status: client_1.ContractStatus.active }
            });
        });
        return true;
    }
}
exports.returnService = new ReturnService();
//# sourceMappingURL=returns.service.js.map