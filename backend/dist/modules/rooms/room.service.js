"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const prisma = new client_1.PrismaClient();
class RoomService {
    // ==================== ROOM METHODS ====================
    async getRooms(params) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.building) {
            where.building = { equals: params.building, mode: 'insensitive' };
        }
        if (params.floor) {
            where.floor = params.floor;
        }
        if (params.status) {
            where.status = params.status;
        }
        if (params.roomTypeId) {
            where.roomTypeId = params.roomTypeId;
        }
        if (params.search) {
            where.OR = [
                { roomNumber: { contains: params.search, mode: 'insensitive' } },
                { building: { contains: params.search, mode: 'insensitive' } }
            ];
        }
        const [rooms, total] = await Promise.all([
            prisma.room.findMany({
                where,
                skip,
                take: limit,
                include: {
                    roomType: {
                        select: {
                            id: true,
                            name: true,
                            capacity: true,
                            monthlyPrice: true,
                            genderRestriction: true
                        }
                    },
                    contracts: {
                        where: { status: 'active' },
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
                            }
                        }
                    },
                    _count: {
                        select: { contracts: { where: { status: 'active' } } }
                    }
                },
                orderBy: [
                    { building: 'asc' },
                    { floor: 'asc' },
                    { roomNumber: 'asc' }
                ]
            }),
            prisma.room.count({ where })
        ]);
        const roomsWithOccupancy = rooms.map(room => ({
            ...room,
            currentOccupancy: room._count.contracts
        }));
        return { rooms: roomsWithOccupancy, total };
    }
    async getRoomById(id) {
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                roomType: true,
                contracts: {
                    where: { status: 'active' },
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
                        }
                    }
                },
                incidents: {
                    where: {
                        status: { in: ['pending', 'in_progress'] }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                _count: {
                    select: { contracts: { where: { status: 'active' } } }
                }
            }
        });
        if (!room) {
            throw app_error_1.AppError.notFound('Room');
        }
        return {
            ...room,
            currentOccupancy: room._count.contracts
        };
    }
    async createRoom(data) {
        const existingRoom = await prisma.room.findUnique({
            where: { roomNumber: data.roomNumber }
        });
        if (existingRoom) {
            throw app_error_1.AppError.conflict('Room number already exists');
        }
        const roomType = await prisma.roomType.findUnique({
            where: { id: data.roomTypeId }
        });
        if (!roomType) {
            throw app_error_1.AppError.notFound('Room type');
        }
        const room = await prisma.room.create({
            data: {
                roomNumber: data.roomNumber,
                floor: data.floor,
                building: data.building,
                roomTypeId: data.roomTypeId,
                status: data.status || client_1.RoomStatus.available,
                notes: data.notes,
                images: data.images || []
            },
            include: {
                roomType: true
            }
        });
        return room;
    }
    async updateRoom(id, data) {
        const existingRoom = await prisma.room.findUnique({
            where: { id }
        });
        if (!existingRoom) {
            throw app_error_1.AppError.notFound('Room');
        }
        if (data.roomNumber && data.roomNumber !== existingRoom.roomNumber) {
            const roomWithNumber = await prisma.room.findUnique({
                where: { roomNumber: data.roomNumber }
            });
            if (roomWithNumber) {
                throw app_error_1.AppError.conflict('Room number already exists');
            }
        }
        if (data.roomTypeId) {
            const roomType = await prisma.roomType.findUnique({
                where: { id: data.roomTypeId }
            });
            if (!roomType) {
                throw app_error_1.AppError.notFound('Room type');
            }
        }
        const room = await prisma.room.update({
            where: { id },
            data: {
                roomNumber: data.roomNumber,
                floor: data.floor,
                building: data.building,
                roomTypeId: data.roomTypeId,
                status: data.status,
                notes: data.notes,
                images: data.images
            },
            include: {
                roomType: true
            }
        });
        return room;
    }
    async deleteRoom(id) {
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                contracts: {
                    where: { status: 'active' }
                }
            }
        });
        if (!room) {
            throw app_error_1.AppError.notFound('Room');
        }
        if (room.contracts.length > 0) {
            throw app_error_1.AppError.badRequest('Cannot delete room with active contracts');
        }
        await prisma.room.delete({
            where: { id }
        });
        return true;
    }
    async getRoomStats() {
        const [totalRooms, availableRooms, occupiedRooms, maintenanceRooms, reservedRooms] = await Promise.all([
            prisma.room.count(),
            prisma.room.count({ where: { status: client_1.RoomStatus.available } }),
            prisma.room.count({ where: { status: client_1.RoomStatus.occupied } }),
            prisma.room.count({ where: { status: client_1.RoomStatus.maintenance } }),
            prisma.room.count({ where: { status: client_1.RoomStatus.reserved } })
        ]);
        const buildings = await prisma.room.groupBy({
            by: ['building'],
            _count: {
                id: true
            },
            orderBy: {
                building: 'asc'
            }
        });
        const floorsByBuilding = await prisma.room.groupBy({
            by: ['building', 'floor'],
            _count: {
                id: true
            },
            orderBy: [
                { building: 'asc' },
                { floor: 'asc' }
            ]
        });
        const roomTypesStats = await prisma.roomType.findMany({
            include: {
                _count: {
                    select: { rooms: true }
                }
            }
        });
        return {
            total: totalRooms,
            available: availableRooms,
            occupied: occupiedRooms,
            maintenance: maintenanceRooms,
            reserved: reservedRooms,
            buildings: buildings.map(b => ({
                name: b.building,
                count: b._count.id
            })),
            floorsByBuilding: floorsByBuilding.map(f => ({
                building: f.building,
                floor: f.floor,
                count: f._count.id
            })),
            roomTypes: roomTypesStats.map(rt => ({
                id: rt.id,
                name: rt.name,
                capacity: rt.capacity,
                roomCount: rt._count.rooms
            }))
        };
    }
    // ==================== ROOM TYPE METHODS ====================
    async getRoomTypes(params) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { description: { contains: params.search, mode: 'insensitive' } }
            ];
        }
        const [roomTypes, total] = await Promise.all([
            prisma.roomType.findMany({
                where,
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { rooms: true }
                    }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.roomType.count({ where })
        ]);
        const roomTypesWithCount = roomTypes.map(rt => ({
            ...rt,
            roomCount: rt._count.rooms
        }));
        return { roomTypes: roomTypesWithCount, total };
    }
    async getRoomTypeById(id) {
        const roomType = await prisma.roomType.findUnique({
            where: { id },
            include: {
                rooms: {
                    select: {
                        id: true,
                        roomNumber: true,
                        building: true,
                        floor: true,
                        status: true
                    },
                    take: 10
                },
                _count: {
                    select: { rooms: true }
                }
            }
        });
        if (!roomType) {
            throw app_error_1.AppError.notFound('Room type');
        }
        return {
            ...roomType,
            roomCount: roomType._count.rooms
        };
    }
    async createRoomType(data) {
        const existingType = await prisma.roomType.findFirst({
            where: { name: { equals: data.name, mode: 'insensitive' } }
        });
        if (existingType) {
            throw app_error_1.AppError.conflict('Room type with this name already exists');
        }
        const roomType = await prisma.roomType.create({
            data: {
                name: data.name,
                capacity: data.capacity,
                monthlyPrice: data.monthlyPrice,
                amenities: data.amenities || [],
                description: data.description,
                genderRestriction: data.genderRestriction
            }
        });
        return roomType;
    }
    async updateRoomType(id, data) {
        const existingType = await prisma.roomType.findUnique({
            where: { id }
        });
        if (!existingType) {
            throw app_error_1.AppError.notFound('Room type');
        }
        if (data.name) {
            const typeWithName = await prisma.roomType.findFirst({
                where: {
                    name: { equals: data.name, mode: 'insensitive' },
                    id: { not: id }
                }
            });
            if (typeWithName) {
                throw app_error_1.AppError.conflict('Room type with this name already exists');
            }
        }
        const roomType = await prisma.roomType.update({
            where: { id },
            data: {
                name: data.name,
                capacity: data.capacity,
                monthlyPrice: data.monthlyPrice,
                amenities: data.amenities,
                description: data.description,
                genderRestriction: data.genderRestriction
            }
        });
        return roomType;
    }
    async getAvailableRooms() {
        const rooms = await prisma.room.findMany({
            where: {
                status: { notIn: ['maintenance', 'reserved'] }
            },
            include: {
                roomType: {
                    select: {
                        id: true,
                        name: true,
                        capacity: true,
                        monthlyPrice: true,
                        genderRestriction: true,
                        amenities: true
                    }
                },
                _count: {
                    select: { contracts: { where: { status: 'active' } } }
                }
            },
            orderBy: [
                { building: 'asc' },
                { floor: 'asc' },
                { roomNumber: 'asc' }
            ]
        });
        // Filter to rooms that still have slots
        const availableRooms = rooms
            .map(room => ({
            id: room.id,
            roomNumber: room.roomNumber,
            building: room.building,
            floor: room.floor,
            status: room.status,
            roomType: room.roomType,
            activeContracts: room._count.contracts,
            slotsLeft: room.roomType.capacity - room._count.contracts
        }))
            .filter(room => room.slotsLeft > 0);
        // Group by building → floor
        const buildingMap = {};
        for (const room of availableRooms) {
            if (!buildingMap[room.building])
                buildingMap[room.building] = {};
            if (!buildingMap[room.building][room.floor])
                buildingMap[room.building][room.floor] = [];
            buildingMap[room.building][room.floor].push(room);
        }
        const buildings = Object.entries(buildingMap).map(([name, floors]) => ({
            name,
            floors: Object.entries(floors).map(([floorNum, roomList]) => ({
                number: parseInt(floorNum),
                rooms: roomList
            })).sort((a, b) => a.number - b.number)
        })).sort((a, b) => a.name.localeCompare(b.name));
        return { buildings, rooms: availableRooms };
    }
    async deleteRoomType(id) {
        const roomType = await prisma.roomType.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { rooms: true }
                }
            }
        });
        if (!roomType) {
            throw app_error_1.AppError.notFound('Room type');
        }
        if (roomType._count.rooms > 0) {
            throw app_error_1.AppError.badRequest('Cannot delete room type that is being used by rooms');
        }
        await prisma.roomType.delete({
            where: { id }
        });
        return true;
    }
}
exports.roomService = new RoomService();
//# sourceMappingURL=room.service.js.map