"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const library_1 = require("@prisma/client/runtime/library");
const prisma = new client_1.PrismaClient();
class TransferService {
    async createTransferRequest(data, userId) {
        const contract = await prisma.contract.findUnique({
            where: { id: data.contractId },
            include: {
                student: { include: { user: true } },
                room: { include: { roomType: true } }
            }
        });
        if (!contract) {
            throw app_error_1.AppError.notFound('Contract');
        }
        if (contract.status !== client_1.ContractStatus.active) {
            throw app_error_1.AppError.badRequest('Can only transfer active contracts');
        }
        const student = await prisma.student.findFirst({
            where: { userId }
        });
        if (!student || contract.studentId !== student.id) {
            throw app_error_1.AppError.forbidden('You can only transfer your own contract');
        }
        const toRoom = await prisma.room.findUnique({
            where: { id: data.toRoomId },
            include: {
                roomType: true,
                _count: {
                    select: {
                        contracts: {
                            where: { status: client_1.ContractStatus.active }
                        }
                    }
                }
            }
        });
        if (!toRoom) {
            throw app_error_1.AppError.notFound('Target room');
        }
        if (toRoom.status !== client_1.RoomStatus.available && toRoom.status !== client_1.RoomStatus.occupied) {
            throw app_error_1.AppError.badRequest('Target room is not available');
        }
        if (toRoom._count.contracts >= toRoom.roomType.capacity) {
            throw app_error_1.AppError.badRequest('Target room is at full capacity');
        }
        const existingTransfer = await prisma.roomTransfer.findFirst({
            where: {
                contractId: data.contractId,
                status: 'pending'
            }
        });
        if (existingTransfer) {
            throw app_error_1.AppError.conflict('You already have a pending transfer request');
        }
        const transferFee = toRoom.roomType.monthlyPrice.greaterThan(contract.room.roomType.monthlyPrice)
            ? new library_1.Decimal(200000)
            : new library_1.Decimal(0);
        const transfer = await prisma.roomTransfer.create({
            data: {
                contractId: data.contractId,
                fromRoomId: contract.roomId,
                toRoomId: data.toRoomId,
                reason: data.reason,
                status: 'pending',
                transferFee
            },
            include: {
                contract: {
                    include: {
                        student: {
                            include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
                        }
                    }
                },
                fromRoom: { include: { roomType: true } },
                toRoom: { include: { roomType: true } }
            }
        });
        const admins = await prisma.user.findMany({
            where: { role: 'admin', isActive: true }
        });
        await Promise.all(admins.map(admin => prisma.notification.create({
            data: {
                userId: admin.id,
                type: 'room_approved',
                title: 'New Transfer Request',
                message: `Student ${contract.student.user.fullName} requests to transfer from room ${contract.room.roomNumber} to room ${toRoom.roomNumber}`,
                referenceId: transfer.id,
                referenceType: 'room_transfer'
            }
        })));
        return transfer;
    }
    async getAllTransfers(params) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.status) {
            where.status = params.status;
        }
        const [transfers, total] = await Promise.all([
            prisma.roomTransfer.findMany({
                where,
                skip,
                take: limit,
                include: {
                    contract: {
                        include: {
                            student: {
                                include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
                            }
                        }
                    },
                    fromRoom: { include: { roomType: true } },
                    toRoom: { include: { roomType: true } },
                    reviewer: { select: { id: true, fullName: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.roomTransfer.count({ where })
        ]);
        return { transfers, page, limit, total };
    }
    async getMyTransfers(userId) {
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
        return prisma.roomTransfer.findMany({
            where: {
                contractId: { in: contractIds }
            },
            include: {
                fromRoom: { include: { roomType: true } },
                toRoom: { include: { roomType: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async processTransfer(data, reviewerId) {
        const transfer = await prisma.roomTransfer.findUnique({
            where: { id: data.transferId },
            include: {
                contract: {
                    include: {
                        student: { include: { user: true } }
                    }
                },
                fromRoom: true,
                toRoom: {
                    include: {
                        roomType: true,
                        _count: {
                            select: {
                                contracts: {
                                    where: { status: client_1.ContractStatus.active }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!transfer) {
            throw app_error_1.AppError.notFound('Transfer request');
        }
        if (transfer.status !== 'pending') {
            throw app_error_1.AppError.badRequest('Transfer has already been processed');
        }
        if (data.status === 'rejected') {
            await prisma.roomTransfer.update({
                where: { id: data.transferId },
                data: {
                    status: 'rejected',
                    reviewedBy: reviewerId,
                    reviewedAt: new Date(),
                    reviewNote: data.reviewNote
                }
            });
            await prisma.notification.create({
                data: {
                    userId: transfer.contract.student.userId,
                    type: 'room_approved',
                    title: 'Transfer Request Rejected',
                    message: `Your transfer request to room ${transfer.toRoom.roomNumber} has been rejected. ${data.reviewNote || ''}`,
                    referenceId: transfer.id,
                    referenceType: 'room_transfer'
                }
            });
            return { status: 'rejected' };
        }
        if (transfer.toRoom._count.contracts >= transfer.toRoom.roomType.capacity) {
            throw app_error_1.AppError.badRequest('Target room is now at full capacity');
        }
        const result = await prisma.$transaction(async (tx) => {
            await tx.contract.update({
                where: { id: transfer.contractId },
                data: {
                    roomId: transfer.toRoomId,
                    monthlyRent: transfer.toRoom.roomType.monthlyPrice
                }
            });
            await tx.room.update({
                where: { id: transfer.fromRoomId },
                data: {
                    currentOccupancy: { decrement: 1 }
                }
            });
            await tx.room.update({
                where: { id: transfer.toRoomId },
                data: {
                    currentOccupancy: { increment: 1 },
                    status: client_1.RoomStatus.occupied
                }
            });
            await tx.assetHandover.create({
                data: {
                    contractId: transfer.contractId,
                    items: transfer.toRoom.roomType.amenities || []
                }
            });
            return tx.roomTransfer.update({
                where: { id: data.transferId },
                data: {
                    status: 'completed',
                    reviewedBy: reviewerId,
                    reviewedAt: new Date(),
                    reviewNote: data.reviewNote
                }
            });
        });
        await prisma.notification.create({
            data: {
                userId: transfer.contract.student.userId,
                type: 'room_approved',
                title: 'Transfer Completed',
                message: `Your transfer to room ${transfer.toRoom.roomNumber} has been completed. Please check your new room.`,
                referenceId: transfer.id,
                referenceType: 'room_transfer'
            }
        });
        return result;
    }
    async cancelTransfer(transferId, userId) {
        const transfer = await prisma.roomTransfer.findUnique({
            where: { id: transferId },
            include: {
                contract: {
                    include: { student: true }
                }
            }
        });
        if (!transfer) {
            throw app_error_1.AppError.notFound('Transfer request');
        }
        const student = await prisma.student.findFirst({
            where: { userId }
        });
        if (!student || transfer.contract.studentId !== student.id) {
            throw app_error_1.AppError.forbidden('You can only cancel your own transfer request');
        }
        if (transfer.status !== 'pending') {
            throw app_error_1.AppError.badRequest('Can only cancel pending transfers');
        }
        await prisma.roomTransfer.update({
            where: { id: transferId },
            data: { status: 'cancelled' }
        });
        return true;
    }
    async getTransferFee(fromRoomId, toRoomId) {
        const [fromRoom, toRoom] = await Promise.all([
            prisma.room.findUnique({
                where: { id: fromRoomId },
                include: { roomType: true }
            }),
            prisma.room.findUnique({
                where: { id: toRoomId },
                include: { roomType: true }
            })
        ]);
        if (!fromRoom || !toRoom) {
            throw app_error_1.AppError.notFound('Room');
        }
        const fee = toRoom.roomType.monthlyPrice.greaterThan(fromRoom.roomType.monthlyPrice)
            ? new library_1.Decimal(200000)
            : new library_1.Decimal(0);
        return {
            fromRoom: {
                id: fromRoom.id,
                roomNumber: fromRoom.roomNumber,
                price: fromRoom.roomType.monthlyPrice.toNumber()
            },
            toRoom: {
                id: toRoom.id,
                roomNumber: toRoom.roomNumber,
                price: toRoom.roomType.monthlyPrice.toNumber()
            },
            fee: fee.toNumber()
        };
    }
}
exports.transferService = new TransferService();
//# sourceMappingURL=transfers.service.js.map