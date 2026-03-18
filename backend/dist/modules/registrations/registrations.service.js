"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const prisma = new client_1.PrismaClient();
class RegistrationService {
    async findAll(params) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.status) {
            where.status = params.status;
        }
        if (params.studentId) {
            where.studentId = params.studentId;
        }
        if (params.sortBy) {
            const orderBy = { [params.sortBy]: params.sortOrder || 'asc' };
            if (params.sortBy === 'priorityScore') {
                orderBy[params.sortBy] = 'desc';
            }
        }
        const [registrations, total] = await Promise.all([
            prisma.registrationRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    student: {
                        select: {
                            id: true,
                            studentCode: true,
                            faculty: true,
                            priorityGroup: true,
                            user: {
                                select: {
                                    fullName: true,
                                    email: true,
                                    phone: true
                                }
                            }
                        }
                    },
                    preferredRoomType: {
                        include: {
                            rooms: {
                                where: { status: 'available' },
                                select: {
                                    id: true,
                                    roomNumber: true,
                                    floor: true,
                                    building: true
                                }
                            }
                        }
                    },
                    preferredRoom: {
                        select: {
                            id: true,
                            roomNumber: true,
                            floor: true,
                            building: true
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
                orderBy: [
                    { priorityScore: 'desc' },
                    { createdAt: 'desc' }
                ]
            }),
            prisma.registrationRequest.count({ where })
        ]);
        return {
            registrations,
            page,
            limit,
            total
        };
    }
    async findById(id) {
        const registration = await prisma.registrationRequest.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        studentCode: true,
                        faculty: true,
                        priorityGroup: true,
                        idCardNumber: true,
                        emergencyContact: true,
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                                phone: true,
                                avatarUrl: true
                            }
                        }
                    }
                },
                preferredRoomType: {
                    include: {
                        rooms: {
                            where: { status: 'available' }
                        }
                    }
                },
                preferredRoom: {
                    select: {
                        id: true,
                        roomNumber: true,
                        floor: true,
                        building: true,
                        images: true,
                        notes: true
                    }
                },
                reviewer: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });
        if (!registration) {
            throw app_error_1.AppError.notFound('Registration request');
        }
        return registration;
    }
    async calculatePriorityScore(student) {
        let score = 0;
        // Priority group A = 5 points, B = 3 points, C = 2 points
        if (student.priorityGroup === 'A') {
            score += 5;
        }
        else if (student.priorityGroup === 'B') {
            score += 3;
        }
        else if (student.priorityGroup === 'C') {
            score += 2;
        }
        // Faculty priority (points based on faculty)
        const facultyPriority = {
            'Khoa học máy tính': 3,
            'Khoa học dữ liệu': 3,
            'Kỹ thuật điện': 2,
            'Kỹ thuật cơ khí': 2,
            'Kinh tế': 1,
            'Quản trị kinh doanh': 1
        };
        if (facultyPriority[student.faculty]) {
            score += facultyPriority[student.faculty];
        }
        // Freshman (1 point)
        if (student.academicYear && student.academicYear <= 1) {
            score += 1;
        }
        return score;
    }
    // Create registration from a logged-in student user (no studentId in body)
    async createForUser(data, userId) {
        const student = await prisma.student.findFirst({ where: { userId } });
        if (!student)
            throw app_error_1.AppError.notFound('Student profile');
        return this.create({ ...data, studentId: student.id }, userId);
    }
    // Get registrations for logged-in student user
    async getMyRegistrationsByUserId(userId) {
        const student = await prisma.student.findFirst({ where: { userId } });
        if (!student)
            return [];
        return this.getMyRegistrations(student.id);
    }
    async create(data, userId) {
        // Check if student exists
        const student = await prisma.student.findUnique({
            where: { id: data.studentId },
            include: {
                user: true
            }
        });
        if (!student) {
            throw app_error_1.AppError.notFound('Student');
        }
        // Check if student already has an active contract
        const activeContract = await prisma.contract.findFirst({
            where: {
                studentId: data.studentId,
                status: 'active'
            }
        });
        if (activeContract) {
            throw app_error_1.AppError.conflict('Sinh viên đã có hợp đồng đang hoạt động. Không thể đăng ký thêm phòng mới.');
        }
        // Check if room type exists
        const roomType = await prisma.roomType.findUnique({
            where: { id: data.preferredRoomTypeId }
        });
        if (!roomType) {
            throw app_error_1.AppError.notFound('Loại phòng không tồn tại');
        }
        // If specific room is selected, check if it's available
        if (data.preferredRoomId) {
            const room = await prisma.room.findUnique({
                where: { id: data.preferredRoomId }
            });
            if (!room) {
                throw app_error_1.AppError.notFound('Phòng không tồn tại');
            }
            if (room.roomTypeId !== data.preferredRoomTypeId) {
                throw app_error_1.AppError.badRequest('Phòng đã chọn không thuộc loại phòng đã chọn');
            }
            if (room.status !== 'available') {
                throw app_error_1.AppError.conflict('Phòng này hiện không còn trống');
            }
            if (room.currentOccupancy >= roomType.capacity) {
                throw app_error_1.AppError.conflict('Phòng này đã đầy chỗ');
            }
        }
        // Calculate priority score
        const priorityScore = await this.calculatePriorityScore(student);
        // Create registration request
        const registration = await prisma.registrationRequest.create({
            data: {
                studentId: data.studentId,
                preferredRoomTypeId: data.preferredRoomTypeId,
                preferredRoomId: data.preferredRoomId,
                desiredStartDate: data.desiredStartDate,
                documents: data.documents || [],
                priorityScore,
                status: 'pending'
            },
            include: {
                student: {
                    select: {
                        id: true,
                        studentCode: true,
                        faculty: true,
                        priorityGroup: true,
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                                phone: true
                            }
                        }
                    }
                },
                preferredRoomType: true
            }
        });
        // Notify admin
        const adminUsers = await prisma.user.findMany({
            where: {
                role: 'admin',
                isActive: true
            }
        });
        await Promise.all(adminUsers.map(admin => prisma.notification.create({
            data: {
                userId: admin.id,
                type: 'room_approved',
                title: 'New Registration Request',
                message: `New registration request from ${registration.student.user?.fullName || registration.student.studentCode} (Code: ${registration.student.studentCode})`,
                referenceId: registration.id,
                referenceType: 'registration'
            }
        })));
        return registration;
    }
    async approve(data, approvedBy) {
        const registration = await prisma.registrationRequest.findUnique({
            where: { id: data.registrationId },
            include: {
                student: {
                    include: {
                        user: true
                    }
                },
                preferredRoomType: true,
                preferredRoom: true
            }
        });
        if (!registration) {
            throw app_error_1.AppError.notFound('Registration request');
        }
        if (registration.status !== 'pending') {
            throw app_error_1.AppError.badRequest('Registration is not in pending status');
        }
        if (!data.roomId && !registration.preferredRoomId) {
            throw app_error_1.AppError.badRequest('Room ID is required');
        }
        // Use preferred room if no room ID provided
        const roomId = data.roomId ?? registration.preferredRoomId ?? undefined;
        if (!roomId)
            throw app_error_1.AppError.badRequest('Room ID is required');
        // Check room availability
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { roomType: true }
        });
        if (!room) {
            throw app_error_1.AppError.notFound('Room');
        }
        if (room.currentOccupancy >= room.roomType.capacity) {
            throw app_error_1.AppError.conflict('Room is full');
        }
        if (room.status !== 'available') {
            throw app_error_1.AppError.conflict('Room is not available');
        }
        // Get room type price
        const monthlyRent = room.roomType.monthlyPrice;
        // Calculate deposit (2 months)
        const depositAmount = monthlyRent.toNumber() * 2;
        // Get contract start date (default to preferred start date or today)
        const startDate = registration.desiredStartDate || new Date();
        // Create contract
        const contract = await prisma.contract.create({
            data: {
                studentId: registration.studentId,
                roomId: roomId,
                startDate,
                endDate: new Date(startDate.getFullYear() + 1, startDate.getMonth(), 1),
                status: 'active',
                monthlyRent,
                depositAmount,
                approvedBy: approvedBy ?? undefined
            }
        });
        // Update room status
        await prisma.room.update({
            where: { id: roomId },
            data: {
                status: 'occupied',
                currentOccupancy: room.currentOccupancy + 1
            }
        });
        // Update registration status
        await prisma.registrationRequest.update({
            where: { id: registration.id },
            data: {
                status: 'approved',
                reviewedBy: approvedBy ?? undefined,
                reviewedAt: new Date(),
                reviewNote: data.reviewNote ?? undefined
            }
        });
        // Create asset handover for new contract
        // amenities is a Json array (e.g. ["Bed", "Desk"]), use directly as items
        await prisma.assetHandover.create({
            data: {
                contractId: contract.id,
                items: room.roomType.amenities || []
            }
        });
        // Notify student
        await prisma.notification.create({
            data: {
                userId: registration.student.userId,
                type: 'room_approved',
                title: 'Room Registration Approved',
                message: `Your registration has been approved! Room ${room.roomNumber} is now reserved for you. Please proceed to pay the deposit within 7 days.`,
                referenceId: contract.id,
                referenceType: 'contract'
            }
        });
        return {
            contract,
            registrationId: registration.id
        };
    }
    async reject(data, rejectedBy) {
        const registration = await prisma.registrationRequest.findUnique({
            where: { id: data.registrationId },
            include: {
                student: true
            }
        });
        if (!registration) {
            throw app_error_1.AppError.notFound('Registration request');
        }
        if (registration.status !== 'pending') {
            throw app_error_1.AppError.badRequest('Registration is not in pending status');
        }
        // Update registration status
        await prisma.registrationRequest.update({
            where: { id: registration.id },
            data: {
                status: 'rejected',
                reviewedBy: rejectedBy,
                reviewedAt: new Date(),
                reviewNote: data.reviewNote
            }
        });
        // Notify student
        await prisma.notification.create({
            data: {
                userId: registration.student.userId,
                type: 'room_approved',
                title: 'Registration Rejected',
                message: `Your registration request has been rejected: ${data.reviewNote || 'No specific reason provided'}`,
                referenceId: registration.id,
                referenceType: 'registration'
            }
        });
        return true;
    }
    async getAvailableRooms(roomTypeId, building, genderRestriction) {
        const where = {
            status: { in: ['available', 'occupied'] }
        };
        if (roomTypeId) {
            where.roomTypeId = roomTypeId;
        }
        if (building) {
            where.building = building;
        }
        const rooms = await prisma.room.findMany({
            where,
            include: {
                roomType: {
                    select: {
                        id: true,
                        name: true,
                        capacity: true,
                        monthlyPrice: true,
                        genderRestriction: true,
                        amenities: true,
                        description: true
                    }
                }
            },
            orderBy: [
                { building: 'asc' },
                { floor: 'asc' },
                { roomNumber: 'asc' }
            ]
        });
        // Filter out full rooms
        const availableRooms = rooms.filter(room => room.currentOccupancy < (room.roomType?.capacity ?? 0));
        // Group rooms by building -> floor
        const roomsByBuilding = {};
        availableRooms.forEach(room => {
            if (!roomsByBuilding[room.building]) {
                roomsByBuilding[room.building] = {};
            }
            if (!roomsByBuilding[room.building][room.floor]) {
                roomsByBuilding[room.building][room.floor] = [];
            }
            roomsByBuilding[room.building][room.floor].push(room);
        });
        return roomsByBuilding;
    }
    async getMyRegistrations(studentId) {
        const registrations = await prisma.registrationRequest.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
            include: {
                preferredRoomType: true,
                preferredRoom: {
                    select: {
                        id: true,
                        roomNumber: true,
                        floor: true,
                        building: true
                    }
                }
            }
        });
        return registrations;
    }
    async getStats() {
        const [total, pending, approved, rejected] = await Promise.all([
            prisma.registrationRequest.count(),
            prisma.registrationRequest.count({ where: { status: 'pending' } }),
            prisma.registrationRequest.count({ where: { status: 'approved' } }),
            prisma.registrationRequest.count({ where: { status: 'rejected' } }),
        ]);
        return { total, pending, approved, rejected };
    }
}
exports.registrationService = new RegistrationService();
//# sourceMappingURL=registrations.service.js.map