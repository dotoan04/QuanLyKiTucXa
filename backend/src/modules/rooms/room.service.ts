import { PrismaClient, Prisma, RoomStatus, GenderRestriction } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'

const prisma = new PrismaClient()

interface CreateRoomInput {
  roomNumber: string
  floor: number
  building: string
  roomTypeId: string
  status?: RoomStatus
  notes?: string
  images?: string[]
  /** CSVC theo phòng (thường string[]); ưu tiên khi lập phiếu bàn giao */
  amenities?: unknown
}

interface UpdateRoomInput {
  roomNumber?: string
  floor?: number
  building?: string
  roomTypeId?: string
  status?: RoomStatus
  notes?: string
  images?: string[]
  amenities?: unknown | null
}

interface CreateRoomTypeInput {
  name: string
  capacity: number
  monthlyPrice: number
  amenities?: string[]
  description?: string
  genderRestriction?: GenderRestriction
}

interface UpdateRoomTypeInput {
  name?: string
  capacity?: number
  monthlyPrice?: number
  amenities?: string[]
  description?: string
  genderRestriction?: GenderRestriction
}

interface RoomQueryParams {
  page?: number
  limit?: number
  building?: string
  floor?: number
  status?: RoomStatus
  roomTypeId?: string
  search?: string
}

interface RoomTypeQueryParams {
  page?: number
  limit?: number
  search?: string
}

class RoomService {
  // ==================== ROOM METHODS ====================

  async getRooms(params: RoomQueryParams) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}

    if (params.building) {
      where.building = { equals: params.building, mode: 'insensitive' }
    }
    if (params.floor) {
      where.floor = params.floor
    }
    if (params.status) {
      where.status = params.status
    }
    if (params.roomTypeId) {
      where.roomTypeId = params.roomTypeId
    }
    if (params.search) {
      where.OR = [
        { roomNumber: { contains: params.search, mode: 'insensitive' } },
        { building: { contains: params.search, mode: 'insensitive' } }
      ]
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
    ])

    const roomsWithOccupancy = rooms.map(room => ({
      ...room,
      currentOccupancy: room._count.contracts
    }))

    return { rooms: roomsWithOccupancy, total }
  }

  async getRoomById(id: string) {
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
    })

    if (!room) {
      throw AppError.notFound('Room')
    }

    return {
      ...room,
      currentOccupancy: room._count.contracts
    }
  }

  async createRoom(data: CreateRoomInput) {
    const existingRoom = await prisma.room.findUnique({
      where: { roomNumber: data.roomNumber }
    })

    if (existingRoom) {
      throw AppError.conflict('Room number already exists')
    }

    const roomType = await prisma.roomType.findUnique({
      where: { id: data.roomTypeId }
    })

    if (!roomType) {
      throw AppError.notFound('Room type')
    }

    const room = await prisma.room.create({
      data: {
        roomNumber: data.roomNumber,
        floor: data.floor,
        building: data.building,
        roomTypeId: data.roomTypeId,
        status: data.status || RoomStatus.available,
        notes: data.notes,
        images: data.images || [],
        ...(data.amenities !== undefined
          ? { amenities: data.amenities as Prisma.InputJsonValue }
          : {})
      },
      include: {
        roomType: true
      }
    })

    return room
  }

  async updateRoom(id: string, data: UpdateRoomInput) {
    const existingRoom = await prisma.room.findUnique({
      where: { id }
    })

    if (!existingRoom) {
      throw AppError.notFound('Room')
    }

    if (data.roomNumber && data.roomNumber !== existingRoom.roomNumber) {
      const roomWithNumber = await prisma.room.findUnique({
        where: { roomNumber: data.roomNumber }
      })
      if (roomWithNumber) {
        throw AppError.conflict('Room number already exists')
      }
    }

    if (data.roomTypeId) {
      const roomType = await prisma.roomType.findUnique({
        where: { id: data.roomTypeId }
      })
      if (!roomType) {
        throw AppError.notFound('Room type')
      }
    }

    const patch: Prisma.RoomUncheckedUpdateInput = {}
    if (data.roomNumber !== undefined) patch.roomNumber = data.roomNumber
    if (data.floor !== undefined) patch.floor = data.floor
    if (data.building !== undefined) patch.building = data.building
    if (data.roomTypeId !== undefined) patch.roomTypeId = data.roomTypeId
    if (data.status !== undefined) patch.status = data.status
    if (data.notes !== undefined) patch.notes = data.notes
    if (data.images !== undefined) patch.images = data.images
    if (data.amenities !== undefined) {
      patch.amenities =
        data.amenities === null ? Prisma.DbNull : (data.amenities as Prisma.InputJsonValue)
    }

    const room = await prisma.room.update({
      where: { id },
      data: patch,
      include: {
        roomType: true
      }
    })

    return room
  }

  async deleteRoom(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        contracts: {
          where: { status: 'active' }
        }
      }
    })

    if (!room) {
      throw AppError.notFound('Room')
    }

    if (room.contracts.length > 0) {
      throw AppError.badRequest('Cannot delete room with active contracts')
    }

    await prisma.room.delete({
      where: { id }
    })

    return true
  }

  async getRoomStats() {
    const [totalRooms, availableRooms, occupiedRooms, maintenanceRooms, reservedRooms] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: RoomStatus.available } }),
      prisma.room.count({ where: { status: RoomStatus.occupied } }),
      prisma.room.count({ where: { status: RoomStatus.maintenance } }),
      prisma.room.count({ where: { status: RoomStatus.reserved } })
    ])

    const buildings = await prisma.room.groupBy({
      by: ['building'],
      _count: {
        id: true
      },
      orderBy: {
        building: 'asc'
      }
    })

    const floorsByBuilding = await prisma.room.groupBy({
      by: ['building', 'floor'],
      _count: {
        id: true
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' }
      ]
    })

    const roomTypesStats = await prisma.roomType.findMany({
      include: {
        _count: {
          select: { rooms: true }
        }
      }
    })

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
    }
  }

  // ==================== ROOM TYPE METHODS ====================

  async getRoomTypes(params: RoomTypeQueryParams) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } }
      ]
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
    ])

    const roomTypesWithCount = roomTypes.map(rt => ({
      ...rt,
      roomCount: rt._count.rooms
    }))

    return { roomTypes: roomTypesWithCount, total }
  }

  async getRoomTypeById(id: string) {
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
    })

    if (!roomType) {
      throw AppError.notFound('Room type')
    }

    return {
      ...roomType,
      roomCount: roomType._count.rooms
    }
  }

  async createRoomType(data: CreateRoomTypeInput) {
    if (!data.genderRestriction) {
      throw AppError.badRequest(
        'Vui lòng chọn giới tính áp dụng cho loại phòng: Nam riêng, Nữ riêng, hoặc Khác (hỗn hợp — chỉ dành cho SV chọn "Khác").'
      )
    }

    const existingType = await prisma.roomType.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } }
    })

    if (existingType) {
      throw AppError.conflict('Room type with this name already exists')
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
    })

    return roomType
  }

  async updateRoomType(id: string, data: UpdateRoomTypeInput) {
    const existingType = await prisma.roomType.findUnique({
      where: { id }
    })

    if (!existingType) {
      throw AppError.notFound('Room type')
    }

    if (data.name) {
      const typeWithName = await prisma.roomType.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          id: { not: id }
        }
      })
      if (typeWithName) {
        throw AppError.conflict('Room type with this name already exists')
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
    })

    return roomType
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
    })

    // Filter to rooms that still have slots
    const availableRooms = rooms
      .map(room => ({
        id: room.id,
        roomNumber: room.roomNumber,
        building: room.building,
        floor: room.floor,
        status: room.status,
        amenities: room.amenities,
        roomType: room.roomType,
        activeContracts: room._count.contracts,
        slotsLeft: room.roomType.capacity - room._count.contracts
      }))
      .filter(room => room.slotsLeft > 0)

    // Group by building → floor
    const buildingMap: Record<string, Record<number, typeof availableRooms>> = {}
    for (const room of availableRooms) {
      if (!buildingMap[room.building]) buildingMap[room.building] = {}
      if (!buildingMap[room.building][room.floor]) buildingMap[room.building][room.floor] = []
      buildingMap[room.building][room.floor].push(room)
    }

    const buildings = Object.entries(buildingMap).map(([name, floors]) => ({
      name,
      floors: Object.entries(floors).map(([floorNum, roomList]) => ({
        number: parseInt(floorNum),
        rooms: roomList
      })).sort((a, b) => a.number - b.number)
    })).sort((a, b) => a.name.localeCompare(b.name))

    return { buildings, rooms: availableRooms }
  }

  async deleteRoomType(id: string) {
    const roomType = await prisma.roomType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { rooms: true }
        }
      }
    })

    if (!roomType) {
      throw AppError.notFound('Room type')
    }

    if (roomType._count.rooms > 0) {
      throw AppError.badRequest('Cannot delete room type that is being used by rooms')
    }

    await prisma.roomType.delete({
      where: { id }
    })

    return true
  }
}

export const roomService = new RoomService()
