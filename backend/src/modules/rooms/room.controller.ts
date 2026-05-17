import { Request, Response, NextFunction } from 'express'
import { roomService } from './room.service'
import { sendSuccess, sendCreated, sendPaginated } from '../../common/utils/response'
import { RoomStatus, GenderRestriction } from '@prisma/client'

class RoomController {
  // ==================== ROOM ENDPOINTS ====================

  getMyRoom = async (req: Request, res: Response, _next: NextFunction) => {
    // Find room via active contract for the current user's student profile
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const student = await prisma.student.findFirst({
      where: { userId: req.user!.userId }
    })

    if (!student) {
      return sendSuccess(res, null)
    }

    const activeContract = await prisma.contract.findFirst({
      where: { studentId: student.id, status: 'active' },
      include: {
        room: {
          include: { roomType: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return sendSuccess(res, activeContract?.room || null)
  }

  getRooms = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      building: req.query.building as string,
      floor: req.query.floor ? parseInt(req.query.floor as string) : undefined,
      status: req.query.status as RoomStatus,
      roomTypeId: req.query.roomTypeId as string,
      search: req.query.search as string
    }

    const result = await roomService.getRooms(params)

    return sendPaginated(
      res,
      result.rooms,
      params.page,
      params.limit,
      result.total
    )
  }

  getRoomById = async (req: Request, res: Response, _next: NextFunction) => {
    const room = await roomService.getRoomById(req.params.id)
    return sendSuccess(res, room)
  }

  createRoom = async (req: Request, res: Response, _next: NextFunction) => {
    const room = await roomService.createRoom({
      roomNumber: req.body.roomNumber,
      floor: req.body.floor,
      building: req.body.building,
      roomTypeId: req.body.roomTypeId,
      status: req.body.status as RoomStatus,
      notes: req.body.notes,
      images: req.body.images,
      amenities: req.body.amenities
    })
    return sendCreated(res, room, 'Room created successfully')
  }

  updateRoom = async (req: Request, res: Response, _next: NextFunction) => {
    const room = await roomService.updateRoom(req.params.id, {
      roomNumber: req.body.roomNumber,
      floor: req.body.floor,
      building: req.body.building,
      roomTypeId: req.body.roomTypeId,
      status: req.body.status as RoomStatus,
      notes: req.body.notes,
      images: req.body.images,
      amenities: req.body.amenities
    })
    return sendSuccess(res, room, 'Room updated successfully')
  }

  deleteRoom = async (req: Request, res: Response, _next: NextFunction) => {
    await roomService.deleteRoom(req.params.id)
    return sendSuccess(res, null, 'Room deleted successfully')
  }

  getAvailableRooms = async (_req: Request, res: Response, _next: NextFunction) => {
    const result = await roomService.getAvailableRooms()
    return sendSuccess(res, result)
  }

  getRoomStats = async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await roomService.getRoomStats()
    return sendSuccess(res, stats)
  }

  // ==================== ROOM TYPE ENDPOINTS ====================

  getRoomTypes = async (req: Request, res: Response, _next: NextFunction) => {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string
    }

    const result = await roomService.getRoomTypes(params)

    return sendPaginated(
      res,
      result.roomTypes,
      params.page,
      params.limit,
      result.total
    )
  }

  getRoomTypeById = async (req: Request, res: Response, _next: NextFunction) => {
    const roomType = await roomService.getRoomTypeById(req.params.id)
    return sendSuccess(res, roomType)
  }

  createRoomType = async (req: Request, res: Response, _next: NextFunction) => {
    const roomType = await roomService.createRoomType({
      name: req.body.name,
      capacity: req.body.capacity,
      monthlyPrice: req.body.monthlyPrice,
      amenities: req.body.amenities,
      description: req.body.description,
      genderRestriction: req.body.genderRestriction as GenderRestriction
    })
    return sendCreated(res, roomType, 'Room type created successfully')
  }

  updateRoomType = async (req: Request, res: Response, _next: NextFunction) => {
    const roomType = await roomService.updateRoomType(req.params.id, {
      name: req.body.name,
      capacity: req.body.capacity,
      monthlyPrice: req.body.monthlyPrice,
      amenities: req.body.amenities,
      description: req.body.description,
      genderRestriction: req.body.genderRestriction as GenderRestriction
    })
    return sendSuccess(res, roomType, 'Room type updated successfully')
  }

  deleteRoomType = async (req: Request, res: Response, _next: NextFunction) => {
    await roomService.deleteRoomType(req.params.id)
    return sendSuccess(res, null, 'Room type deleted successfully')
  }
}

export const roomController = new RoomController()
