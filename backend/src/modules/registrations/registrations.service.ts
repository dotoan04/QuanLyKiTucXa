import { PrismaClient, Gender, GenderRestriction, RegistrationStatus } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'
import { buildHandoverItemsForRoom } from '../../common/utils/handover-items'
import {
  occupantsGendersAllowStudent,
  studentGenderMatchesRoomTypeRestriction,
} from '../../common/utils/room-gender'

const prisma = new PrismaClient()

interface CreateRegistrationInput {
  studentId: string
  preferredRoomTypeId: string
  preferredRoomId?: string
  desiredStartDate: Date
  desiredDuration?: number // months
  documents?: string[]
}

const MAX_DOC_LINKS = 5
const MAX_URL_LEN = 2048

/** Minh chứng qua link công khai (Google Drive, v.v.) — bắt buộc ít nhất 1 link hợp lệ */
function normalizeAndValidateDocumentLinks(documents: string[] | undefined): string[] {
  const list = (documents || [])
    .map(s => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean)
    .slice(0, MAX_DOC_LINKS)

  if (list.length === 0) {
    throw AppError.badRequest(
      'Vui lòng dán ít nhất một link công khai (Google Drive) minh chứng bản thân (CCCD/thẻ SV).'
    )
  }

  for (const url of list) {
    if (url.length > MAX_URL_LEN) {
      throw AppError.badRequest('Mỗi link không quá 2048 ký tự.')
    }
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      throw AppError.badRequest('Link minh chứng không hợp lệ. Dùng địa chỉ https:// đầy đủ.')
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw AppError.badRequest('Chỉ chấp nhận link http(s).')
    }
    if (parsed.protocol === 'http:' && process.env.NODE_ENV === 'production') {
      throw AppError.badRequest('Vui lòng dùng link https (chia sẻ công khai an toàn hơn).')
    }
  }

  return list
}

class RegistrationService {
  private async assertNoActiveContractForStudentId(studentId: string) {
    const activeContract = await prisma.contract.findFirst({
      where: { studentId, status: 'active' },
      select: { id: true },
    })
    if (activeContract) {
      throw AppError.conflict(
        'Bạn đang có hợp đồng ở KTX còn hiệu lực nên không thể đăng ký phòng mới. Nếu muốn đổi chỗ ở, vui lòng sử dụng chức năng Chuyển phòng.'
      )
    }
  }

  /**
   * Gợi ý phòng khi duyệt đơn: chỉ phòng còn chỗ + đúng loại giới tính + không ghép khác giới trong phòng.
   */
  private applyGenderFilterToPreferredRooms(registration: {
    student?: { gender: Gender | null }
    preferredRoomType?: {
      rooms?: Array<{
        id: string
        roomNumber: string
        floor: number
        building: string
        status?: string
        currentOccupancy?: number
        roomType?: { genderRestriction: GenderRestriction | null; capacity?: number }
        contracts?: Array<{ student: { gender: Gender | null } }>
        assignedRegistrations?: Array<{ id: string }>
      }>
    } | null
  }) {
    const g = registration.student?.gender
    const rooms = registration.preferredRoomType?.rooms
    if (!rooms?.length) return registration
    if (!g) {
      registration.preferredRoomType!.rooms = []
      return registration
    }

    registration.preferredRoomType!.rooms = rooms
      .filter((rm) => {
        if (!studentGenderMatchesRoomTypeRestriction(g, rm.roomType?.genderRestriction ?? null)) {
          return false
        }
        const occ = (rm.contracts || []).map((c) => c.student?.gender)
        return occupantsGendersAllowStudent(occ, g)
      })
      .map((rm) => {
        const capacity = rm.roomType?.capacity ?? 0
        const lockedBeds = rm.assignedRegistrations?.length ?? 0
        const currentOccupancy = rm.currentOccupancy ?? 0
        const slotsLeft = Math.max(0, capacity - currentOccupancy - lockedBeds)
        const activeContracts = rm.contracts?.length ?? 0
        return {
          id: rm.id,
          roomNumber: rm.roomNumber,
          floor: rm.floor,
          building: rm.building,
          status: rm.status,
          capacity,
          currentOccupancy,
          activeContracts,
          lockedBeds,
          slotsLeft,
        }
      })
      .sort((a, b) => {
        if (b.slotsLeft !== a.slotsLeft) return b.slotsLeft - a.slotsLeft
        if (a.building !== b.building) return a.building.localeCompare(b.building, 'vi')
        if (a.floor !== b.floor) return a.floor - b.floor
        return a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true })
      })

    return registration
  }

  /**
   * Lấy toàn bộ phòng thuộc các loại phòng (theo `roomTypeId`) — không dùng nested `roomType.rooms`
   * để tránh thiếu bản ghi khi duyệt đơn; sau đó gán vào `preferredRoomType.rooms` rồi lọc giới tính.
   */
  private async fetchRoomsByRoomTypeIds(roomTypeIds: string[]) {
    const uniq = [...new Set(roomTypeIds.filter(Boolean))]
    if (uniq.length === 0) return new Map<string, any[]>()

    const all = await prisma.room.findMany({
      where: {
        roomTypeId: { in: uniq },
        status: { notIn: ['maintenance'] },
      },
      include: {
        roomType: { select: { genderRestriction: true, capacity: true } },
        contracts: {
          where: { status: 'active' },
          select: { student: { select: { gender: true } } },
        },
        assignedRegistrations: {
          where: { status: { in: ['deposit_pending', 'deposit_paid', 'deposit_confirmed'] } },
          select: { id: true },
        },
      },
      orderBy: [{ building: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }],
    })

    const map = new Map<string, typeof all>()
    for (const id of uniq) map.set(id, [])
    for (const rm of all) {
      map.get(rm.roomTypeId)!.push(rm)
    }
    return map
  }

  private attachAssignableRoomsFromMap(registration: {
    preferredRoomTypeId: string
    preferredRoomType?: { rooms?: unknown } | null
  }, roomMap: Map<string, any[]>) {
    if (!registration.preferredRoomType) return
    const raw = roomMap.get(registration.preferredRoomTypeId) || []
    ;(registration.preferredRoomType as { rooms: unknown[] }).rooms = raw
    this.applyGenderFilterToPreferredRooms(registration as any)
  }

  // ============ QUERIES ============

  async findAll(params: { page?: number; limit?: number; status?: string; studentId?: string }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit
    const where: any = {}

    if (params.status) {
      if (params.status.includes(',')) {
        const parts = params.status.split(',').map((s) => s.trim()).filter(Boolean)
        if (parts.length) where.status = { in: parts as RegistrationStatus[] }
      } else {
        where.status = params.status
      }
    }
    if (params.studentId) where.studentId = params.studentId

    const [registrations, total] = await Promise.all([
      prisma.registrationRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true, studentCode: true, faculty: true, priorityGroup: true,
              idCardNumber: true,
              gender: true,
              user: { select: { fullName: true, email: true, phone: true } }
            }
          },
          preferredRoomType: {
            select: {
              id: true,
              name: true,
              capacity: true,
              monthlyPrice: true,
            },
          },
          preferredRoom: { select: { id: true, roomNumber: true, floor: true, building: true } },
          assignedRoom: { select: { id: true, roomNumber: true, floor: true, building: true } },
          reviewer: { select: { id: true, fullName: true, email: true } },
          depositConfirmer: { select: { id: true, fullName: true, email: true } }
        },
        orderBy: [{ priorityScore: 'desc' }, { createdAt: 'desc' }]
      }),
      prisma.registrationRequest.count({ where })
    ])

    const roomMap = await this.fetchRoomsByRoomTypeIds(registrations.map((r) => r.preferredRoomTypeId))
    for (const reg of registrations) {
      this.attachAssignableRoomsFromMap(reg as any, roomMap)
    }

    return { registrations, page, limit, total }
  }

  async findById(id: string) {
    const registration = await prisma.registrationRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true, studentCode: true, faculty: true, priorityGroup: true,
            idCardNumber: true, emergencyContact: true, dateOfBirth: true, gender: true, hometown: true,
            user: { select: { fullName: true, email: true, phone: true, avatarUrl: true } }
          }
        },
        preferredRoomType: {
          select: {
            id: true,
            name: true,
            capacity: true,
            monthlyPrice: true,
          },
        },
        preferredRoom: { select: { id: true, roomNumber: true, floor: true, building: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
        depositConfirmer: { select: { id: true, fullName: true, email: true } }
      }
    })
    if (!registration) throw AppError.notFound('Registration request')
    const roomMap = await this.fetchRoomsByRoomTypeIds([registration.preferredRoomTypeId])
    this.attachAssignableRoomsFromMap(registration as any, roomMap)
    return registration
  }

  async getMyRegistrations(studentId: string) {
    return prisma.registrationRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        preferredRoomType: true,
        preferredRoom: { select: { id: true, roomNumber: true, floor: true, building: true } },
        assignedRoom: { select: { id: true, roomNumber: true, floor: true, building: true } }
      }
    })
  }

  async getMyRegistrationsByUserId(userId: string) {
    const student = await prisma.student.findFirst({ where: { userId } })
    if (!student) return []
    return this.getMyRegistrations(student.id)
  }

  /**
   * Danh sách phòng dành cho staff phân phòng khi duyệt đơn.
   * Trả về mọi phòng cùng loại (không lọc giới tính — backend đã kiểm tra khi approve).
   */
  async getAssignableRooms(roomTypeId: string) {
    if (!roomTypeId) throw AppError.badRequest('roomTypeId là bắt buộc')

    await this.cancelExpiredReservations()

    const rooms = await prisma.room.findMany({
      where: { roomTypeId, status: { notIn: ['maintenance'] } },
      include: {
        roomType: { select: { capacity: true, genderRestriction: true } },
        contracts: {
          where: { status: 'active' },
          select: { id: true },
        },
        assignedRegistrations: {
          where: { status: { in: ['deposit_pending', 'deposit_paid', 'deposit_confirmed'] } },
          select: { id: true },
        },
      },
      orderBy: [{ building: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }],
    })

    return rooms.map((r) => {
      const capacity = r.roomType?.capacity ?? 0
      const currentOccupancy = r.contracts.length
      const lockedBeds = r.assignedRegistrations.length
      const slotsLeft = Math.max(0, capacity - currentOccupancy - lockedBeds)
      return {
        id: r.id,
        roomNumber: r.roomNumber,
        floor: r.floor,
        building: r.building,
        status: r.status,
        capacity,
        currentOccupancy,
        lockedBeds,
        slotsLeft,
        genderRestriction: r.roomType?.genderRestriction,
      }
    })
  }

  /** Danh sách loại phòng SV được phép đăng ký theo giới tính hồ sơ */
  async getRoomTypesForRegistration(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId },
      select: { id: true, gender: true },
    })
    if (!student) throw AppError.notFound('Hồ sơ sinh viên')
    await this.assertNoActiveContractForStudentId(student.id)
    if (!student.gender) {
      throw AppError.badRequest(
        'Vui lòng cập nhật giới tính trong hồ sơ để hệ thống hiển thị đúng loại phòng (nam/nữ tách riêng).'
      )
    }

    const all = await prisma.roomType.findMany({ orderBy: { name: 'asc' } })
    return all.filter((rt) =>
      studentGenderMatchesRoomTypeRestriction(student.gender!, rt.genderRestriction)
    )
  }

  async getAvailableRooms(roomTypeId?: string, building?: string, userId?: string) {
    await this.cancelExpiredReservations()
    if (!userId) {
      throw AppError.unauthorized('Vui lòng đăng nhập sinh viên để xem phòng phù hợp.')
    }

    const student = await prisma.student.findFirst({
      where: { userId },
      select: { id: true, gender: true },
    })
    if (!student) throw AppError.notFound('Hồ sơ sinh viên')
    await this.assertNoActiveContractForStudentId(student.id)
    if (!student.gender) {
      throw AppError.badRequest(
        'Vui lòng cập nhật giới tính ở bước thông tin cá nhân trước khi chọn phòng.'
      )
    }
    const studentGender = student.gender as Gender

    const where: Record<string, unknown> = { status: { in: ['available', 'occupied'] } }
    if (roomTypeId) where.roomTypeId = roomTypeId
    if (building) where.building = building

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
            description: true,
          },
        },
        assignedRegistrations: {
          where: { status: { in: ['deposit_pending', 'deposit_paid', 'deposit_confirmed'] } },
        },
        contracts: {
          where: { status: 'active' },
          select: { student: { select: { gender: true } } },
        },
      },
      orderBy: [{ building: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }],
    })

    const availableRooms = rooms
      .map((r) => {
        const lockedBeds = r.assignedRegistrations.length
        const slotsLeft = (r.roomType?.capacity ?? 0) - r.currentOccupancy - lockedBeds
        const { contracts, assignedRegistrations, ...rest } = r
        return { ...rest, slotsLeft, lockedBeds, _occ: contracts.map((c) => c.student.gender) }
      })
      .filter((r) => r.slotsLeft > 0)
      .filter((r) => {
        if (!studentGenderMatchesRoomTypeRestriction(studentGender, r.roomType?.genderRestriction)) {
          return false
        }
        return occupantsGendersAllowStudent(r._occ, studentGender)
      })
      .map(({ _occ, ...pub }) => pub)

    // Group by building → floor
    const grouped: Record<string, Record<number, typeof availableRooms>> = {}
    availableRooms.forEach((room) => {
      if (!grouped[room.building]) grouped[room.building] = {}
      if (!grouped[room.building][room.floor]) grouped[room.building][room.floor] = []
      grouped[room.building][room.floor].push(room)
    })
    return grouped
  }

  async getStats() {
    await this.cancelExpiredReservations()
    const [total, pending, depositPending, depositPaid, depositConfirmed, approved, rejected] = await Promise.all([
      prisma.registrationRequest.count(),
      prisma.registrationRequest.count({ where: { status: 'pending' } }),
      prisma.registrationRequest.count({ where: { status: 'deposit_pending' } }),
      prisma.registrationRequest.count({ where: { status: 'deposit_paid' } }),
      prisma.registrationRequest.count({ where: { status: 'deposit_confirmed' } }),
      prisma.registrationRequest.count({ where: { status: 'approved' } }),
      prisma.registrationRequest.count({ where: { status: 'rejected' } }),
    ])
    return { total, pending, depositPending, depositPaid, depositConfirmed, approved, rejected }
  }

  // ============ HELPERS ============
  async cancelExpiredReservations() {
    // 3 days in milliseconds
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    
    const expired = await prisma.registrationRequest.findMany({
      where: {
        status: 'deposit_pending',
        reviewedAt: { lt: threeDaysAgo }
      }
    })

    if (expired.length === 0) return

    for (const req of expired) {
      await prisma.registrationRequest.update({
        where: { id: req.id },
        data: {
          status: 'rejected',
          reviewNote: 'Hết hạn giữ chỗ 3 ngày không nộp tiền cọc. Đơn đăng ký đã bị tự động hủy và giải phóng phòng.'
        }
      })
      
      // Notify student
      await prisma.notification.create({
        data: {
          userId: req.studentId, // We technically need to look up userId but studentId works as a fallback if properly mapped or we lookup
          type: 'system',
          title: 'Hết hạn nộp cọc',
          message: 'Đơn đăng ký của bạn đã bị hủy do quá 3 ngày không nộp tiền cọc.',
        }
      })
    }
  }

  // ============ STUDENT ACTIONS ============

  /** Phòng + loại phòng + người đang ở phải khớp giới tính SV */
  private async assertSelectedRoomMatchesStudentGender(roomId: string, studentGender: Gender) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomType: true,
        contracts: {
          where: { status: 'active' },
          select: { student: { select: { gender: true } } },
        },
      },
    })
    if (!room) throw AppError.notFound('Phòng không tồn tại')
    if (!studentGenderMatchesRoomTypeRestriction(studentGender, room.roomType.genderRestriction)) {
      throw AppError.badRequest('Phòng không phù hợp với giới tính của bạn.')
    }
    const occ = room.contracts.map((c) => c.student.gender)
    if (!occupantsGendersAllowStudent(occ, studentGender)) {
      throw AppError.badRequest('Phòng đang có sinh viên khác giới — không thể chọn phòng này.')
    }
  }

  async createForUser(data: Omit<CreateRegistrationInput, 'studentId'>, userId: string) {
    const student = await prisma.student.findFirst({ where: { userId } })
    if (!student) throw AppError.notFound('Student profile')
    return this.create({ ...data, studentId: student.id }, userId)
  }

  async create(data: CreateRegistrationInput, _userId: string) {
    // Parse date string to Date object
    if (typeof (data as any).desiredStartDate === 'string') {
      (data as any).desiredStartDate = new Date((data as any).desiredStartDate)
    }

    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { user: true }
    })
    if (!student) throw AppError.notFound('Student')

    await this.assertNoActiveContractForStudentId(data.studentId)

    // Check for existing pending/deposit_pending/deposit_paid registration
    const existingReg = await prisma.registrationRequest.findFirst({
      where: { studentId: data.studentId, status: { in: ['pending', 'deposit_pending', 'deposit_paid', 'deposit_confirmed'] } }
    })

    let replacedRegistrationId: string | undefined

    if (existingReg) {
      if (['deposit_pending', 'deposit_paid', 'deposit_confirmed'].includes(existingReg.status)) {
        throw AppError.conflict('Bạn đã có đơn đăng ký đang chờ nộp/xác nhận cọc. Vui lòng liên hệ quản lý nếu muốn hủy.')
      }

      // Auto-cancel old pending registration
      await prisma.registrationRequest.update({
        where: { id: existingReg.id },
        data: {
          status: 'cancelled',
          reviewNote: 'Sinh viên đã tạo đơn đăng ký mới, đơn cũ tự động hủy.'
        }
      })
      replacedRegistrationId = existingReg.id

      // Notify staff about the cancellation
      const staffUsers = await prisma.user.findMany({
        where: { role: { in: ['admin', 'staff'] }, isActive: true }
      })
      await Promise.all(
        staffUsers.map(u =>
          prisma.notification.create({
            data: {
              userId: u.id,
              type: 'system',
              title: 'Đơn đăng ký cũ đã hủy (sinh viên tạo đơn mới)',
              message: `${student.user?.fullName || student.id} (${student.studentCode}) đã hủy đơn đăng ký phòng cũ (mã: ${existingReg.id.slice(0, 8)}) và sẽ gửi đơn mới.`,
              referenceId: existingReg.id,
              referenceType: 'registration'
            }
          })
        )
      )
    }

    // Validate room type + giới tính
    const roomType = await prisma.roomType.findUnique({ where: { id: data.preferredRoomTypeId } })
    if (!roomType) throw AppError.notFound('Loại phòng không tồn tại')

    if (!student.gender) {
      throw AppError.badRequest('Vui lòng cập nhật giới tính trong hồ sơ trước khi đăng ký phòng.')
    }
    if (!studentGenderMatchesRoomTypeRestriction(student.gender, roomType.genderRestriction)) {
      throw AppError.badRequest('Loại phòng không phù hợp với giới tính của bạn (nam/nữ ở phòng riêng).')
    }

    if (data.preferredRoomId) {
      await this.assertSelectedRoomMatchesStudentGender(data.preferredRoomId, student.gender)
    }

    const documents = normalizeAndValidateDocumentLinks(data.documents)

    // Priority score
    const priorityScore = await this.calculatePriorityScore(student)

    const registration = await prisma.registrationRequest.create({
      data: {
        studentId: data.studentId,
        preferredRoomTypeId: data.preferredRoomTypeId,
        preferredRoomId: data.preferredRoomId || undefined,
        desiredStartDate: data.desiredStartDate,
        desiredDuration: data.desiredDuration || undefined,
        documents,
        priorityScore,
        status: 'pending'
      },
      include: {
        student: { select: { studentCode: true, user: { select: { fullName: true } } } },
        preferredRoomType: true
      }
    })

    // Notify admins/staff
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['admin', 'staff'] }, isActive: true }
    })
    const newRegMessage = replacedRegistrationId
      ? `${(registration.student as any).user?.fullName} (${registration.student.studentCode}) đã gửi đơn đăng ký phòng ${registration.preferredRoomType.name}. Đơn cũ (mã ${replacedRegistrationId.slice(0, 8)}) đã được hủy tự động.`
      : `${(registration.student as any).user?.fullName} (${registration.student.studentCode}) đã gửi đơn đăng ký phòng ${registration.preferredRoomType.name}`

    await Promise.all(
      staffUsers.map(u =>
        prisma.notification.create({
          data: {
            userId: u.id,
            type: 'room_approved',
            title: 'Đơn đăng ký phòng mới',
            message: newRegMessage,
            referenceId: registration.id,
            referenceType: 'registration'
          }
        })
      )
    )

    return registration
  }

  /** Student cancels own registration while still pending (not yet approved by staff) */
  async cancelByStudent(registrationId: string, userId: string) {
    const student = await prisma.student.findFirst({ where: { userId } })
    if (!student) throw AppError.notFound('Student profile')

    const reg = await prisma.registrationRequest.findUnique({
      where: { id: registrationId },
      include: {
        student: { include: { user: true } },
        preferredRoomType: true
      }
    })
    if (!reg) throw AppError.notFound('Registration')
    if (reg.studentId !== student.id) throw AppError.forbidden('Không có quyền')
    if (reg.status !== 'pending') {
      throw AppError.badRequest('Chỉ có thể hủy đơn đang chờ duyệt (chưa được quản lý duyệt).')
    }

    await prisma.registrationRequest.update({
      where: { id: registrationId },
      data: {
        status: 'cancelled',
        reviewNote: 'Sinh viên chủ động hủy đơn.'
      }
    })

    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['admin', 'staff'] }, isActive: true }
    })
    await Promise.all(
      staffUsers.map(u =>
        prisma.notification.create({
          data: {
            userId: u.id,
            type: 'system',
            title: 'Sinh viên hủy đơn đăng ký',
            message: `${reg.student.user?.fullName} (${reg.student.studentCode}) đã hủy đơn đăng ký phòng ${reg.preferredRoomType.name} (mã: ${registrationId.slice(0, 8)}).`,
            referenceId: registrationId,
            referenceType: 'registration'
          }
        })
      )
    )

    await prisma.notification.create({
      data: {
        userId,
        type: 'system',
        title: 'Đã hủy đơn đăng ký',
        message: `Bạn đã hủy đơn đăng ký phòng ${reg.preferredRoomType.name}. Bạn có thể gửi đơn mới khi cần.`,
        referenceId: registrationId,
        referenceType: 'registration'
      }
    })

    return { cancelled: true }
  }

  /** Admin/Staff cancel registration (pending, chờ cọc, đã nộp cọc — giải phóng giữ chỗ) */
  async cancelByStaff(registrationId: string, staffUserId: string, reviewNote?: string) {
    const registration = await prisma.registrationRequest.findUnique({
      where: { id: registrationId },
      include: {
        student: { include: { user: true } },
        preferredRoomType: true
      }
    })
    if (!registration) throw AppError.notFound('Registration request')

    if (!['pending', 'deposit_pending', 'deposit_paid', 'deposit_confirmed'].includes(registration.status)) {
      throw AppError.badRequest('Chỉ có thể hủy đơn ở trạng thái chờ duyệt, chờ nộp cọc, đã nộp cọc hoặc cọc đã xác nhận (chưa ký hợp đồng).')
    }

    const note =
      (reviewNote && reviewNote.trim()) ||
      'Đơn đăng ký đã được quản lý hủy.'

    await prisma.registrationRequest.update({
      where: { id: registrationId },
      data: {
        status: 'cancelled',
        reviewNote: note,
        reviewedBy: staffUserId,
        reviewedAt: new Date()
      }
    })

    await prisma.notification.create({
      data: {
        userId: registration.student.userId,
        type: 'system',
        title: 'Đơn đăng ký đã bị hủy',
        message: `Đơn đăng ký phòng ${registration.preferredRoomType.name} của bạn đã bị quản lý hủy. Lý do: ${note}`,
        referenceId: registrationId,
        referenceType: 'registration'
      }
    })

    return { cancelled: true }
  }

  /** Student uploads payment proof → status: deposit_paid */
  async uploadPaymentProof(registrationId: string, paymentProofUrl: string, userId: string) {
    const student = await prisma.student.findFirst({ where: { userId } })
    if (!student) throw AppError.notFound('Student profile')

    const reg = await prisma.registrationRequest.findUnique({
      where: { id: registrationId },
      include: { student: { include: { user: true } } }
    })
    if (!reg) throw AppError.notFound('Registration')
    if (reg.studentId !== student.id) throw AppError.forbidden('Không có quyền')
    if (reg.status !== 'deposit_pending') {
      throw AppError.badRequest('Đơn đăng ký không ở trạng thái chờ nộp cọc')
    }

    const updated = await prisma.registrationRequest.update({
      where: { id: registrationId },
      data: {
        paymentProofUrl,
        status: 'deposit_paid'
      }
    })

    // Notify accountants
    const accountantUsers = await prisma.user.findMany({
      where: { role: 'accountant', isActive: true }
    })
    await Promise.all(
      accountantUsers.map(u =>
        prisma.notification.create({
          data: {
            userId: u.id,
            type: 'deposit_submitted' as any,
            title: 'SV đã nộp biên lai cọc',
            message: `${reg.student.user?.fullName || reg.student.studentCode} đã upload biên lai cọc cho đơn đăng ký #${registrationId.slice(0, 8)}. Vui lòng kiểm tra và xác nhận.`,
            referenceId: registrationId,
            referenceType: 'registration'
          }
        })
      )
    )

    // Also notify staff/admin
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['admin', 'staff'] }, isActive: true }
    })
    await Promise.all(
      staffUsers.map(u =>
        prisma.notification.create({
          data: {
            userId: u.id,
            type: 'system',
            title: 'Sinh viên đã nộp biên lai',
            message: `Sinh viên đã upload biên lai cho đơn đăng ký #${registrationId.slice(0, 8)}`,
            referenceId: registrationId,
            referenceType: 'registration'
          }
        })
      )
    )

    return updated
  }

  // ============ STAFF ACTIONS ============

  /** Staff approves registration → status: deposit_pending, assigns room, holds for 3 days */
  async approve(data: { registrationId: string; roomId: string; reviewNote?: string }, approvedBy: string) {
    const registration = await prisma.registrationRequest.findUnique({
      where: { id: data.registrationId },
      include: {
        student: { include: { user: true } },
        preferredRoomType: true
      }
    })
    if (!registration) throw AppError.notFound('Registration request')
    if (registration.status !== 'pending') {
      throw AppError.badRequest('Đơn không ở trạng thái chờ duyệt')
    }

    if (!data.roomId) {
      throw AppError.badRequest('Vui lòng chọn phòng để gán cho sinh viên')
    }

    // Validate room capacity with locks
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: {
        roomType: true,
        assignedRegistrations: {
          where: { status: { in: ['deposit_pending', 'deposit_paid', 'deposit_confirmed'] } }
        }
      }
    })
    if (!room) throw AppError.notFound('Phòng không tồn tại')

    if (!registration.student.gender) {
      throw AppError.badRequest('Sinh viên chưa có giới tính trên hồ sơ — không thể phân phòng.')
    }
    await this.assertSelectedRoomMatchesStudentGender(data.roomId, registration.student.gender)

    const lockedBeds = room.assignedRegistrations.length
    if (room.currentOccupancy + lockedBeds >= room.roomType.capacity) {
      throw AppError.conflict('Phòng đã hết chỗ (bao gồm các chỗ đang được giữ)')
    }

    // Calculate deposit (2 months rent)
    const depositAmount = registration.preferredRoomType.monthlyPrice.toNumber() * 2

    await prisma.registrationRequest.update({
      where: { id: registration.id },
      data: {
        status: 'deposit_pending',
        depositAmount,
        assignedRoomId: data.roomId,
        reviewedBy: approvedBy,
        reviewedAt: new Date(),
        reviewNote: data.reviewNote || undefined,
        contractNotes: `Hợp đồng ${registration.desiredDuration || 12} tháng, tiền phòng ${registration.preferredRoomType.monthlyPrice.toNumber().toLocaleString('vi-VN')}đ/tháng`
      }
    })

    // Notify student
    await prisma.notification.create({
      data: {
        userId: registration.student.userId,
        type: 'room_approved',
        title: 'Hồ sơ đăng ký được chấp nhận',
        message: `Hồ sơ của bạn đã được duyệt và gán phòng ${room.roomNumber}. Vui lòng nộp tiền cọc ${depositAmount.toLocaleString('vi-VN')}đ trong vòng 3 ngày để hoàn tất.`,
        referenceId: registration.id,
        referenceType: 'registration'
      }
    })

    // Notify accountants
    const accountantUsers = await prisma.user.findMany({
      where: { role: 'accountant', isActive: true }
    })
    await Promise.all(
      accountantUsers.map(u =>
        prisma.notification.create({
          data: {
            userId: u.id,
            type: 'system',
            title: 'Đơn đăng ký mới chờ xác nhận cọc',
            message: `Đơn đăng ký #${registration.id.slice(0, 8)} của ${registration.student.user?.fullName || registration.student.studentCode} đã được duyệt. Chờ sinh viên nộp cọc.`,
            referenceId: registration.id,
            referenceType: 'registration'
          }
        })
      )
    )

    return { registrationId: registration.id, depositAmount }
  }

  /** Staff confirms payment + assigns room + creates contract → status: approved */
  async confirmPaymentAndAssignRoom(
    data: { registrationId: string; reviewNote?: string },
    confirmedBy: string
  ) {
    const registration = await prisma.registrationRequest.findUnique({
      where: { id: data.registrationId },
      include: {
        student: { include: { user: true } },
        preferredRoomType: true
      }
    })
    if (!registration) throw AppError.notFound('Registration')
    if (registration.status !== 'deposit_confirmed') {
      throw AppError.badRequest('Đơn chưa ở trạng thái cọc đã xác nhận. Vui lòng chờ kế toán xác nhận cọc trước.')
    }

    // Validate room
    const room = await prisma.room.findUnique({
      where: { id: registration.assignedRoomId! },
      include: { roomType: true }
    })
    if (!room) throw AppError.notFound('Room')
    if (room.currentOccupancy >= room.roomType!.capacity) {
      throw AppError.conflict('Phòng đã đầy')
    }

    if (!registration.student.gender) {
      throw AppError.badRequest('Sinh viên chưa có giới tính trên hồ sơ — không thể tạo hợp đồng.')
    }
    await this.assertSelectedRoomMatchesStudentGender(registration.assignedRoomId!, registration.student.gender)

    const monthlyRent = room.roomType!.monthlyPrice
    const depositAmount = registration.depositAmount?.toNumber() || monthlyRent.toNumber() * 2
    const startDate = registration.desiredStartDate || new Date()
    const durationMonths = registration.desiredDuration || 12
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + durationMonths)

    // Transaction: create contract + update room + update registration
    const result = await prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          studentId: registration.studentId,
          roomId: registration.assignedRoomId!,
          startDate,
          endDate,
          status: 'active',
          monthlyRent,
          depositAmount,
          approvedBy: confirmedBy
        }
      })

      await tx.room.update({
        where: { id: registration.assignedRoomId! },
        data: {
          currentOccupancy: room.currentOccupancy + 1,
          status: room.currentOccupancy + 1 >= room.roomType!.capacity ? 'occupied' : room.status
        }
      })

      await tx.registrationRequest.update({
        where: { id: registration.id },
        data: {
          status: 'approved',
          reviewNote: data.reviewNote || undefined
        }
      })

      // Asset handover — CSVC theo phòng / loại phòng (không lưu raw amenities JSON)
      await tx.assetHandover.create({
        data: {
          contractId: contract.id,
          confirmedBy: confirmedBy,
          items: buildHandoverItemsForRoom(room) as any
        }
      })

      return contract
    })

    // Notify student
    await prisma.notification.create({
      data: {
        userId: registration.student.userId,
        type: 'room_approved',
        title: 'Đã phân phòng thành công',
        message: `Bạn đã được phân vào phòng ${room.roomNumber}. Hợp đồng có hiệu lực từ ${startDate.toLocaleDateString('vi-VN')}.`,
        referenceId: result.id,
        referenceType: 'contract'
      }
    })

    return { contract: result, registrationId: registration.id }
  }

  // ============ ACCOUNTANT ACTIONS ============

  async confirmDeposit(registrationId: string, accountantId: string) {
    const registration = await prisma.registrationRequest.findUnique({
      where: { id: registrationId },
      include: {
        student: { include: { user: true } },
        preferredRoomType: true,
        assignedRoom: true
      }
    })
    if (!registration) throw AppError.notFound('Registration request')
    if (registration.status !== 'deposit_paid') {
      throw AppError.badRequest('Đơn không ở trạng thái đã nộp biên lai cọc')
    }

    const updated = await prisma.registrationRequest.update({
      where: { id: registrationId },
      data: {
        status: 'deposit_confirmed',
        depositConfirmedBy: accountantId,
        depositConfirmedAt: new Date()
      }
    })

    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['admin', 'staff'] }, isActive: true }
    })
    await Promise.all(
      staffUsers.map(u =>
        prisma.notification.create({
          data: {
            userId: u.id,
            type: 'deposit_confirmed' as any,
            title: 'Cọc đã xác nhận',
            message: `Đơn đăng ký #${registrationId.slice(0, 8)} của ${registration.student.user?.fullName || registration.student.studentCode} đã được xác nhận cọc. Sẵn sàng tạo hợp đồng.`,
            referenceId: registrationId,
            referenceType: 'registration'
          }
        })
      )
    )

    await prisma.notification.create({
      data: {
        userId: registration.student.userId,
        type: 'deposit_confirmed' as any,
        title: 'Cọc đã xác nhận',
        message: `Biên lai cọc của bạn đã được xác nhận. Vui lòng chờ ký hợp đồng.`,
        referenceId: registrationId,
        referenceType: 'registration'
      }
    })

    return updated
  }

  async rejectDeposit(registrationId: string, accountantId: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw AppError.badRequest('Lý do từ chối phải có ít nhất 5 ký tự.')
    }

    const registration = await prisma.registrationRequest.findUnique({
      where: { id: registrationId },
      include: {
        student: { include: { user: true } },
        preferredRoomType: true
      }
    })
    if (!registration) throw AppError.notFound('Registration request')
    if (registration.status !== 'deposit_paid') {
      throw AppError.badRequest('Đơn không ở trạng thái đã nộp biên lai cọc')
    }

    const updated = await prisma.registrationRequest.update({
      where: { id: registrationId },
      data: {
        status: 'deposit_pending',
        depositRejectReason: reason.trim(),
        paymentProofUrl: null
      }
    })

    await prisma.notification.create({
      data: {
        userId: registration.student.userId,
        type: 'deposit_rejected' as any,
        title: 'Biên lai cọc bị từ chối',
        message: `Biên lai cọc của bạn không được chấp nhận. Lý do: ${reason.trim()}. Vui lòng nộp lại.`,
        referenceId: registrationId,
        referenceType: 'registration'
      }
    })

    return updated
  }

  async reject(data: { registrationId: string; reviewNote: string }, rejectedBy: string) {
    const registration = await prisma.registrationRequest.findUnique({
      where: { id: data.registrationId },
      include: { student: true }
    })
    if (!registration) throw AppError.notFound('Registration request')
    if (!['pending', 'deposit_pending'].includes(registration.status)) {
      throw AppError.badRequest('Không thể từ chối đơn ở trạng thái này')
    }

    await prisma.registrationRequest.update({
      where: { id: registration.id },
      data: {
        status: 'rejected',
        reviewedBy: rejectedBy,
        reviewedAt: new Date(),
        reviewNote: data.reviewNote
      }
    })

    await prisma.notification.create({
      data: {
        userId: registration.student.userId,
        type: 'room_approved',
        title: 'Đơn đăng ký bị từ chối',
        message: `Đơn đăng ký đã bị từ chối: ${data.reviewNote}`,
        referenceId: registration.id,
        referenceType: 'registration'
      }
    })

    return true
  }

  // ============ HELPERS ============

  async calculatePriorityScore(student: any): Promise<number> {
    let score = 0
    if (student.priorityGroup === 'A') score += 5
    else if (student.priorityGroup === 'B') score += 3
    else if (student.priorityGroup === 'C') score += 2

    const facultyPriority: Record<string, number> = {
      'Khoa học máy tính': 3, 'Khoa học dữ liệu': 3,
      'Kỹ thuật điện': 2, 'Kỹ thuật cơ khí': 2,
      'Kinh tế': 1, 'Quản trị kinh doanh': 1
    }
    if (student.faculty && facultyPriority[student.faculty]) {
      score += facultyPriority[student.faculty]
    }
    if (student.academicYear && student.academicYear <= 1) score += 1
    return score
  }
}

export const registrationService = new RegistrationService()
