"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomController = void 0;
const room_service_1 = require("./room.service");
const response_1 = require("../../common/utils/response");
class RoomController {
    // ==================== ROOM ENDPOINTS ====================
    getMyRoom = async (req, res, _next) => {
        // Find room via active contract for the current user's student profile
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const student = await prisma.student.findFirst({
            where: { userId: req.user.userId }
        });
        if (!student) {
            return (0, response_1.sendSuccess)(res, null);
        }
        const activeContract = await prisma.contract.findFirst({
            where: { studentId: student.id, status: 'active' },
            include: {
                room: {
                    include: { roomType: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return (0, response_1.sendSuccess)(res, activeContract?.room || null);
    };
    getRooms = async (req, res, _next) => {
        const params = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            building: req.query.building,
            floor: req.query.floor ? parseInt(req.query.floor) : undefined,
            status: req.query.status,
            roomTypeId: req.query.roomTypeId,
            search: req.query.search
        };
        const result = await room_service_1.roomService.getRooms(params);
        return (0, response_1.sendPaginated)(res, result.rooms, params.page, params.limit, result.total);
    };
    getRoomById = async (req, res, _next) => {
        const room = await room_service_1.roomService.getRoomById(req.params.id);
        return (0, response_1.sendSuccess)(res, room);
    };
    createRoom = async (req, res, _next) => {
        const room = await room_service_1.roomService.createRoom({
            roomNumber: req.body.roomNumber,
            floor: req.body.floor,
            building: req.body.building,
            roomTypeId: req.body.roomTypeId,
            status: req.body.status,
            notes: req.body.notes,
            images: req.body.images
        });
        return (0, response_1.sendCreated)(res, room, 'Room created successfully');
    };
    updateRoom = async (req, res, _next) => {
        const room = await room_service_1.roomService.updateRoom(req.params.id, {
            roomNumber: req.body.roomNumber,
            floor: req.body.floor,
            building: req.body.building,
            roomTypeId: req.body.roomTypeId,
            status: req.body.status,
            notes: req.body.notes,
            images: req.body.images
        });
        return (0, response_1.sendSuccess)(res, room, 'Room updated successfully');
    };
    deleteRoom = async (req, res, _next) => {
        await room_service_1.roomService.deleteRoom(req.params.id);
        return (0, response_1.sendSuccess)(res, null, 'Room deleted successfully');
    };
    getAvailableRooms = async (_req, res, _next) => {
        const result = await room_service_1.roomService.getAvailableRooms();
        return (0, response_1.sendSuccess)(res, result);
    };
    getRoomStats = async (_req, res, _next) => {
        const stats = await room_service_1.roomService.getRoomStats();
        return (0, response_1.sendSuccess)(res, stats);
    };
    // ==================== ROOM TYPE ENDPOINTS ====================
    getRoomTypes = async (req, res, _next) => {
        const params = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            search: req.query.search
        };
        const result = await room_service_1.roomService.getRoomTypes(params);
        return (0, response_1.sendPaginated)(res, result.roomTypes, params.page, params.limit, result.total);
    };
    getRoomTypeById = async (req, res, _next) => {
        const roomType = await room_service_1.roomService.getRoomTypeById(req.params.id);
        return (0, response_1.sendSuccess)(res, roomType);
    };
    createRoomType = async (req, res, _next) => {
        const roomType = await room_service_1.roomService.createRoomType({
            name: req.body.name,
            capacity: req.body.capacity,
            monthlyPrice: req.body.monthlyPrice,
            amenities: req.body.amenities,
            description: req.body.description,
            genderRestriction: req.body.genderRestriction
        });
        return (0, response_1.sendCreated)(res, roomType, 'Room type created successfully');
    };
    updateRoomType = async (req, res, _next) => {
        const roomType = await room_service_1.roomService.updateRoomType(req.params.id, {
            name: req.body.name,
            capacity: req.body.capacity,
            monthlyPrice: req.body.monthlyPrice,
            amenities: req.body.amenities,
            description: req.body.description,
            genderRestriction: req.body.genderRestriction
        });
        return (0, response_1.sendSuccess)(res, roomType, 'Room type updated successfully');
    };
    deleteRoomType = async (req, res, _next) => {
        await room_service_1.roomService.deleteRoomType(req.params.id);
        return (0, response_1.sendSuccess)(res, null, 'Room type deleted successfully');
    };
}
exports.roomController = new RoomController();
//# sourceMappingURL=room.controller.js.map