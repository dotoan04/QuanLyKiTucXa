"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const library_1 = require("@prisma/client/runtime/library");
const prisma = new client_1.PrismaClient();
class ContractService {
    async findAll(params) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.search) {
            where.OR = [
                { student: { user: { fullName: { contains: params.search, mode: 'insensitive' } } } },
                { student: { studentCode: { contains: params.search, mode: 'insensitive' } } },
                { room: { roomNumber: { contains: params.search, mode: 'insensitive' } } }
            ];
        }
        if (params.status) {
            where.status = params.status;
        }
        if (params.studentId) {
            where.studentId = params.studentId;
        }
        if (params.roomId) {
            where.roomId = params.roomId;
        }
        const [contracts, total] = await Promise.all([
            prisma.contract.findMany({
                where,
                skip,
                take: limit,
                include: {
                    student: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    },
                    room: {
                        include: {
                            roomType: true
                        }
                    },
                    approver: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.contract.count({ where })
        ]);
        return {
            contracts,
            page,
            limit,
            total
        };
    }
    async findById(id) {
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true,
                                avatarUrl: true
                            }
                        }
                    }
                },
                room: {
                    include: {
                        roomType: true
                    }
                },
                approver: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                invoices: {
                    orderBy: { invoiceMonth: 'desc' },
                    take: 6
                }
            }
        });
        if (!contract) {
            throw app_error_1.AppError.notFound('Contract');
        }
        return contract;
    }
    async create(data) {
        // Check if student already has an active contract
        const existingContract = await prisma.contract.findFirst({
            where: {
                studentId: data.studentId,
                status: client_1.ContractStatus.active
            }
        });
        if (existingContract) {
            throw app_error_1.AppError.conflict('Student already has an active contract');
        }
        // Check if room exists and has capacity
        const room = await prisma.room.findFirst({
            where: { id: data.roomId },
            include: {
                roomType: true,
                _count: {
                    select: {
                        contracts: {
                            where: { status: 'active' }
                        }
                    }
                }
            }
        });
        if (!room) {
            throw app_error_1.AppError.notFound('Room');
        }
        if (room._count.contracts >= room.roomType.capacity) {
            throw app_error_1.AppError.badRequest(`Room is at full capacity (${room.roomType.capacity})`);
        }
        // Create contract
        const contract = await prisma.contract.create({
            data: {
                studentId: data.studentId,
                roomId: data.roomId,
                startDate: data.startDate,
                endDate: data.endDate,
                status: client_1.ContractStatus.active,
                monthlyRent: new library_1.Decimal(data.monthlyRent),
                depositAmount: new library_1.Decimal(data.depositAmount || 0),
                contractPdfUrl: data.contractPdfUrl,
                approvedBy: data.approvedBy
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true
                            }
                        }
                    }
                },
                room: {
                    include: {
                        roomType: true
                    }
                }
            }
        });
        return contract;
    }
    async update(id, data) {
        const contract = await prisma.contract.findUnique({
            where: { id }
        });
        if (!contract) {
            throw app_error_1.AppError.notFound('Contract');
        }
        // Check if trying to activate a contract when student already has an active one
        if (data.status === client_1.ContractStatus.active && contract.status !== client_1.ContractStatus.active) {
            const existingActive = await prisma.contract.findFirst({
                where: {
                    studentId: contract.studentId,
                    status: client_1.ContractStatus.active,
                    id: { not: id }
                }
            });
            if (existingActive) {
                throw app_error_1.AppError.conflict('Student already has an active contract');
            }
        }
        // Validate room capacity if changing rooms
        if (data.endDate && new Date(data.endDate) < new Date()) {
            throw app_error_1.AppError.badRequest('End date cannot be in the past');
        }
        const updatedContract = await prisma.contract.update({
            where: { id },
            data: {
                endDate: data.endDate,
                status: data.status,
                monthlyRent: data.monthlyRent ? new library_1.Decimal(data.monthlyRent) : undefined,
                depositAmount: data.depositAmount !== undefined ? new library_1.Decimal(data.depositAmount) : undefined,
                contractPdfUrl: data.contractPdfUrl,
                approvedBy: data.approvedBy
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true
                            }
                        }
                    }
                },
                room: {
                    include: {
                        roomType: true
                    }
                }
            }
        });
        return updatedContract;
    }
    async terminate(id, terminationReason, approvedBy) {
        const contract = await prisma.contract.findUnique({
            where: { id }
        });
        if (!contract) {
            throw app_error_1.AppError.notFound('Contract');
        }
        if (contract.status === client_1.ContractStatus.expired || contract.status === client_1.ContractStatus.terminated) {
            throw app_error_1.AppError.badRequest('Contract already terminated or expired');
        }
        const updatedContract = await prisma.contract.update({
            where: { id },
            data: {
                status: client_1.ContractStatus.terminated,
                endDate: new Date(),
                terminationReason,
                approvedBy
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true
                            }
                        }
                    }
                },
                room: {
                    include: {
                        roomType: true
                    }
                }
            }
        });
        return updatedContract;
    }
    // ==================== REGISTRATION REQUEST METHODS ====================
    async createRegistrationRequest(data) {
        // Check if student already has an active contract
        const activeContract = await prisma.contract.findFirst({
            where: {
                studentId: data.studentId,
                status: client_1.ContractStatus.active
            }
        });
        if (activeContract) {
            throw app_error_1.AppError.conflict('Student already has an active contract');
        }
        // Check for pending registration
        const pendingRegistration = await prisma.registrationRequest.findFirst({
            where: {
                studentId: data.studentId,
                status: 'pending'
            }
        });
        if (pendingRegistration) {
            throw app_error_1.AppError.conflict('Student already has a pending registration request');
        }
        // Check if room type exists
        const roomType = await prisma.roomType.findUnique({
            where: { id: data.preferredRoomTypeId }
        });
        if (!roomType) {
            throw app_error_1.AppError.notFound('Room type');
        }
        // Check if preferred room exists if specified
        if (data.preferredRoomId) {
            const room = await prisma.room.findUnique({
                where: { id: data.preferredRoomId },
                include: { roomType: true }
            });
            if (!room || room.roomTypeId !== data.preferredRoomTypeId) {
                throw app_error_1.AppError.badRequest('Invalid preferred room for the selected room type');
            }
        }
        const registration = await prisma.registrationRequest.create({
            data: {
                studentId: data.studentId,
                preferredRoomTypeId: data.preferredRoomTypeId,
                preferredRoomId: data.preferredRoomId,
                desiredStartDate: data.desiredStartDate,
                status: 'pending'
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                phone: true
                            }
                        }
                    }
                },
                preferredRoomType: true,
                preferredRoom: {
                    include: {
                        roomType: true
                    }
                }
            }
        });
        return registration;
    }
    async getRegistrationRequests(params) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.status) {
            where.status = params.status;
        }
        if (params.search) {
            where.OR = [
                { student: { user: { fullName: { contains: params.search, mode: 'insensitive' } } } },
                { student: { studentCode: { contains: params.search, mode: 'insensitive' } } }
            ];
        }
        const [requests, total] = await Promise.all([
            prisma.registrationRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    student: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                    phone: true,
                                    avatarUrl: true
                                }
                            }
                        }
                    },
                    preferredRoomType: true,
                    preferredRoom: {
                        include: {
                            roomType: true
                        }
                    },
                    reviewer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.registrationRequest.count({ where })
        ]);
        return {
            requests,
            page,
            limit,
            total
        };
    }
    async approveRegistrationRequest(id, roomId, reviewerId, reviewNote) {
        const request = await prisma.registrationRequest.findUnique({
            where: { id },
            include: {
                student: true
            }
        });
        if (!request) {
            throw app_error_1.AppError.notFound('Registration request');
        }
        if (request.status !== 'pending') {
            throw app_error_1.AppError.badRequest('Registration request has already been processed');
        }
        // Check if room exists and has capacity
        const room = await prisma.room.findFirst({
            where: { id: roomId },
            include: {
                roomType: true,
                _count: {
                    select: {
                        contracts: {
                            where: { status: 'active' }
                        }
                    }
                }
            }
        });
        if (!room) {
            throw app_error_1.AppError.notFound('Room');
        }
        if (room._count.contracts >= room.roomType.capacity) {
            throw app_error_1.AppError.badRequest(`Room is at full capacity (${room.roomType.capacity})`);
        }
        // Create contract from registration request
        await prisma.$transaction(async (tx) => {
            await tx.contract.create({
                data: {
                    studentId: request.studentId,
                    roomId: roomId,
                    startDate: request.desiredStartDate,
                    status: client_1.ContractStatus.active,
                    monthlyRent: room.roomType.monthlyPrice,
                    depositAmount: room.roomType.monthlyPrice,
                    approvedBy: reviewerId
                }
            });
            await tx.registrationRequest.update({
                where: { id },
                data: {
                    status: 'approved',
                    reviewNote,
                    reviewedBy: reviewerId,
                    reviewedAt: new Date()
                }
            });
        });
        return { success: true, message: 'Registration approved and contract created' };
    }
    async rejectRegistrationRequest(id, reviewerId, reviewNote) {
        const request = await prisma.registrationRequest.findUnique({
            where: { id }
        });
        if (!request) {
            throw app_error_1.AppError.notFound('Registration request');
        }
        if (request.status !== 'pending') {
            throw app_error_1.AppError.badRequest('Registration request has already been processed');
        }
        await prisma.registrationRequest.update({
            where: { id },
            data: {
                status: 'rejected',
                reviewNote,
                reviewedBy: reviewerId,
                reviewedAt: new Date()
            }
        });
        return { success: true, message: 'Registration rejected' };
    }
    // ==================== ASSET HANDOVER METHODS ====================
    async createHandover(contractId, confirmedBy, items) {
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { assetHandover: true }
        });
        if (!contract) {
            throw app_error_1.AppError.notFound('Contract');
        }
        if (contract.assetHandover) {
            throw app_error_1.AppError.conflict('Handover record already exists for this contract');
        }
        const handover = await prisma.assetHandover.create({
            data: {
                contractId,
                confirmedBy,
                items: items,
                handoverAt: new Date()
            },
            include: {
                confirmer: {
                    select: { id: true, fullName: true, email: true }
                }
            }
        });
        return handover;
    }
    async getHandover(contractId) {
        const handover = await prisma.assetHandover.findUnique({
            where: { contractId },
            include: {
                confirmer: {
                    select: { id: true, fullName: true, email: true }
                }
            }
        });
        return handover;
    }
    async getStats() {
        const [total, active, expired, terminated, pending] = await Promise.all([
            prisma.contract.count(),
            prisma.contract.count({ where: { status: client_1.ContractStatus.active } }),
            prisma.contract.count({ where: { status: client_1.ContractStatus.expired } }),
            prisma.contract.count({ where: { status: client_1.ContractStatus.terminated } }),
            prisma.registrationRequest.count({ where: { status: 'pending' } })
        ]);
        return {
            total,
            active,
            expired,
            terminated,
            pending,
            occupancyRate: total > 0 ? Math.round((active / total) * 100) : 0
        };
    }
}
exports.contractService = new ContractService();
//# sourceMappingURL=contract.service.js.map