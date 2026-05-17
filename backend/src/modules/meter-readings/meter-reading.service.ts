import { PrismaClient, MeterReadingStatus, UserRole } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'

const prisma = new PrismaClient()

/** Tháng đã "Chốt & báo kế toán" — kỹ thuật không được sửa/ghi mới trừ bản ghi đang `remeasure` */
const METER_MONTHS_SUBMITTED_KEY = 'meter_reading_months_submitted_to_accountant'

function isValidMonthKey(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month)
}

interface RecordReadingInput {
  roomId: string
  month: string // "YYYY-MM"
  electricityNew: number
  waterNew: number
  electricityPhoto?: string
  waterPhoto?: string
}

class MeterReadingService {
  private async readSubmittedMonths(): Promise<string[]> {
    const row = await prisma.systemConfig.findUnique({ where: { key: METER_MONTHS_SUBMITTED_KEY } })
    if (!row?.value) return []
    try {
      const parsed = JSON.parse(row.value) as unknown
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
      return []
    }
  }

  private async writeSubmittedMonths(months: string[]) {
    const unique = [...new Set(months)].filter(isValidMonthKey).sort()
    await prisma.systemConfig.upsert({
      where: { key: METER_MONTHS_SUBMITTED_KEY },
      create: {
        key: METER_MONTHS_SUBMITTED_KEY,
        value: JSON.stringify(unique),
        description: 'Tháng (YYYY-MM) đã chốt gửi kế toán — kỹ thuật không sửa trừ remeasure',
      },
      update: { value: JSON.stringify(unique) },
    })
  }

  async isMonthSubmittedToAccountant(month: string): Promise<boolean> {
    if (!isValidMonthKey(month)) return false
    const months = await this.readSubmittedMonths()
    return months.includes(month)
  }

  /** Admin: mở khóa để kỹ thuật chỉnh lại (chốt nhầm) */
  async unlockMonthForTechnician(month: string) {
    if (!isValidMonthKey(month)) {
      throw AppError.badRequest('month phải là YYYY-MM')
    }
    const months = await this.readSubmittedMonths()
    await this.writeSubmittedMonths(months.filter((m) => m !== month))
    return { month, unlocked: true }
  }

  // 1. Get List of Rooms to read for a specific month
  // UC27: Technician sees list of occupied rooms, with prev month's indices
  async getRoomsToRead(month: string) {
    // Find all rooms that are currently occupied
    const occupiedRooms = await prisma.room.findMany({
      where: {
        status: 'occupied',
      },
      include: {
        roomType: true,
        meterReadings: {
          where: { month }, // check if already read this month
        }
      },
      orderBy: [{ building: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }]
    })

    // Calculate previous month string
    // e.g. "2026-03" -> "2026-02", "2026-01" -> "2025-12"
    const [yearStr, monthStr] = month.split('-')
    let prevYear = parseInt(yearStr)
    let prevMonth = parseInt(monthStr) - 1
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear--
    }
    const prevMonthStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`

    // Fetch previous month readings for these rooms
    const prevReadings = await prisma.meterReading.findMany({
      where: {
        roomId: { in: occupiedRooms.map(r => r.id) },
        month: prevMonthStr
      }
    })

    const prevReadingMap = new Map(prevReadings.map(r => [r.roomId, r]))
    const monthSubmittedToAccountant = await this.isMonthSubmittedToAccountant(month)

    const rooms = occupiedRooms.map(room => {
      const currentReading = room.meterReadings[0] // Since we filtered by month, there's at most 1
      const prevReading = prevReadingMap.get(room.id)

      return {
        room: {
          id: room.id,
          roomNumber: room.roomNumber,
          building: room.building,
          floor: room.floor
        },
        status: currentReading ? currentReading.status : 'not_started',
        readingId: currentReading?.id,
        prevElectricity: prevReading ? prevReading.electricityNew : 0,
        prevWater: prevReading ? prevReading.waterNew : 0,
        currentReading: currentReading ? {
          electricityNew: currentReading.electricityNew,
          waterNew: currentReading.waterNew,
          electricityPhoto: currentReading.electricityPhoto,
          waterPhoto: currentReading.waterPhoto,
          isAnomaly: currentReading.isAnomaly,
          unreadable: currentReading.unreadable
        } : null
      }
    })

    return { rooms, monthSubmittedToAccountant }
  }

  // 2. Record a reading (UC27)
  async record(data: RecordReadingInput, recordedBy: string, actorRole: UserRole) {
    if (!isValidMonthKey(data.month)) {
      throw AppError.badRequest('month phải là YYYY-MM')
    }

    const bypassMonthLock = actorRole === 'admin'

    const existingEarly = await prisma.meterReading.findUnique({
      where: { roomId_month: { roomId: data.roomId, month: data.month } },
    })

    if (existingEarly && existingEarly.status === 'approved') {
      throw AppError.badRequest('Chỉ số tháng này đã được kế toán duyệt, không thể sửa đổi')
    }

    const monthLocked = await this.isMonthSubmittedToAccountant(data.month)
    if (monthLocked && !bypassMonthLock) {
      if (!existingEarly) {
        throw AppError.badRequest(
          'Tháng này đã chốt gửi kế toán, không thể thêm chỉ số mới. Liên hệ quản trị nếu cần mở khóa tháng.'
        )
      }
      if (existingEarly.status !== 'remeasure') {
        throw AppError.badRequest(
          'Tháng đã chốt gửi kế toán. Chỉ được ghi lại khi kế toán yêu cầu đo lại (trạng thái "Đo lại").'
        )
      }
    }

    // Determine previous readings to assert new >= old
    // Calculate previous month
    const [yearStr, monthStr] = data.month.split('-')
    let prevYear = parseInt(yearStr)
    let prevMonth = parseInt(monthStr) - 1
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear--
    }
    const prevMonthStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`

    const prevReading = await prisma.meterReading.findFirst({
      where: { roomId: data.roomId, month: prevMonthStr }
    })

    const electricityOld = prevReading ? prevReading.electricityNew.toNumber() : 0
    const waterOld = prevReading ? prevReading.waterNew.toNumber() : 0

    if (data.electricityNew < electricityOld) {
      throw AppError.badRequest(`Chỉ số điện mới (${data.electricityNew}) không được nhỏ hơn chỉ số cũ (${electricityOld})`)
    }
    if (data.waterNew < waterOld) {
      throw AppError.badRequest(`Chỉ số nước mới (${data.waterNew}) không được nhỏ hơn chỉ số cũ (${waterOld})`)
    }

    // Default anomaly detection
    let isAnomaly = false
    let anomalyNote = ''

    if (prevReading) {
      const prevElecConsumption = prevReading.electricityNew.toNumber() - prevReading.electricityOld.toNumber()
      const prevWaterConsumption = prevReading.waterNew.toNumber() - prevReading.waterOld.toNumber()
      const currElecConsumption = data.electricityNew - electricityOld
      const currWaterConsumption = data.waterNew - waterOld

      // Anomaly: Jump > 50% compared to previous month, AND base consumption is significant (> 10)
      if (prevElecConsumption > 10 && currElecConsumption > prevElecConsumption * 1.5) {
        isAnomaly = true
        anomalyNote += `Điện tiêu thụ tăng ${(currElecConsumption / prevElecConsumption * 100 - 100).toFixed(0)}%. `
      }
      if (prevWaterConsumption > 2 && currWaterConsumption > prevWaterConsumption * 1.5) {
        isAnomaly = true
        anomalyNote += `Nước tiêu thụ tăng ${(currWaterConsumption / prevWaterConsumption * 100 - 100).toFixed(0)}%. `
      }
    }

    const existing = existingEarly

    const readingData = {
      roomId: data.roomId,
      month: data.month,
      electricityOld,
      electricityNew: data.electricityNew,
      waterOld,
      waterNew: data.waterNew,
      electricityPhoto: data.electricityPhoto,
      waterPhoto: data.waterPhoto,
      isAnomaly,
      anomalyNote: anomalyNote || null,
      status: 'submitted' as MeterReadingStatus,
      recordedBy,
      unreadable: false,
      unreadableReason: null
    }

    if (existing) {
      return prisma.meterReading.update({
        where: { id: existing.id },
        data: readingData
      })
    } else {
      return prisma.meterReading.create({
        data: readingData
      })
    }
  }

  // 3. Mark unreadable (UC27)
  async markUnreadable(roomId: string, month: string, reason: string, recordedBy: string, actorRole: UserRole) {
    if (!isValidMonthKey(month)) {
      throw AppError.badRequest('month phải là YYYY-MM')
    }

    const bypassMonthLock = actorRole === 'admin'
    const existing = await prisma.meterReading.findUnique({
      where: { roomId_month: { roomId, month } }
    })

    if (existing && existing.status === 'approved') {
      throw AppError.badRequest('Chỉ số tháng này đã được duyệt')
    }

    const monthLocked = await this.isMonthSubmittedToAccountant(month)
    if (monthLocked && !bypassMonthLock) {
      if (!existing) {
        throw AppError.badRequest('Tháng đã chốt gửi kế toán, không thể báo sự cố mới cho phòng này.')
      }
      if (existing.status !== 'remeasure') {
        throw AppError.badRequest(
          'Tháng đã chốt gửi kế toán. Chỉ được báo lại khi kế toán yêu cầu đo lại.'
        )
      }
    }

    // Auto-create an emergency maintenance ticket
    await prisma.scheduledMaintenance.create({
      data: {
        title: `Sửa chữa công tơ/đồng hồ phòng ${roomId}`,
        description: `Báo cáo không đọc được chỉ số tháng ${month}. Lý do: ${reason}`,
        type: 'emergency',
        status: 'scheduled',
        roomId: roomId,
        scheduledAt: new Date(),
      }
    })

    const data = {
      roomId,
      month,
      electricityOld: 0, // Placeholder
      electricityNew: 0,
      waterOld: 0,
      waterNew: 0,
      unreadable: true,
      unreadableReason: reason,
      isAnomaly: true,
      anomalyNote: 'Không đọc được đồng hồ',
      status: 'submitted' as MeterReadingStatus,
      recordedBy
    }

    if (existing) {
      return prisma.meterReading.update({
        where: { id: existing.id },
        data
      })
    } else {
      return prisma.meterReading.create({
        data
      })
    }
  }

  // 4. Submit all (Notify Accountant + khóa tháng đối với kỹ thuật)
  async submitMonth(month: string) {
    if (!isValidMonthKey(month)) {
      throw AppError.badRequest('month phải là YYYY-MM')
    }

    const submittedCount = await prisma.meterReading.count({
      where: { month, status: 'submitted' }
    })

    const alreadySubmitted = await this.isMonthSubmittedToAccountant(month)
    if (alreadySubmitted) {
      return { submitted: submittedCount, alreadySubmitted: true as const }
    }

    const accountants = await prisma.user.findMany({
      where: { role: 'accountant', isActive: true }
    })

    await Promise.all(
      accountants.map(acc => 
        prisma.notification.create({
          data: {
            userId: acc.id,
            type: 'system',
            title: `Chỉ số điện nước tháng ${month} đã sẵn sàng`,
            message: `Kỹ thuật đã chốt ${submittedCount} bản ghi chờ duyệt (tháng ${month}). Mở portal Kế toán → mục "Duyệt chỉ số", chọn đúng tháng, lọc "Chờ duyệt" rồi duyệt từng phòng để dùng cho tạo hóa đơn.`,
            // reference_id là UUID trong DB; tháng (YYYY-MM) không thể lưu ở đây
            referenceId: null,
            referenceType: 'meter_reading_month'
          }
        })
      )
    )

    const months = await this.readSubmittedMonths()
    if (!months.includes(month)) months.push(month)
    await this.writeSubmittedMonths(months)

    return { submitted: submittedCount, alreadySubmitted: false as const }
  }

  // 5. Accountant Approves Reading (UC14 partial)
  async approve(id: string, reviewedBy: string) {
    const reading = await prisma.meterReading.findUnique({ where: { id } })
    if (!reading) throw AppError.notFound('Meter reading')
    if (reading.status !== 'submitted' && reading.status !== 'remeasure') {
      throw AppError.badRequest('Chỉ có thể duyệt chỉ số đang chờ')
    }

    return prisma.meterReading.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedBy,
        reviewNote: null
      }
    })
  }

  // 6. Accountant rejects / requests remeasure
  async requestRemeasure(id: string, note: string, reviewedBy: string) {
    const reading = await prisma.meterReading.findUnique({ where: { id }, include: { room: true } })
    if (!reading) throw AppError.notFound('Meter reading')

    const updated = await prisma.meterReading.update({
      where: { id },
      data: {
        status: 'remeasure',
        reviewedBy,
        reviewNote: note
      }
    })

    // Notify the technician who recorded it
    await prisma.notification.create({
      data: {
        userId: reading.recordedBy,
        type: 'system',
        title: `Yêu cầu đo lại phòng ${reading.room.roomNumber}`,
        message: `Kế toán yêu cầu đo lại phòng ${reading.room.roomNumber} (tháng ${reading.month}). Ghi chú: ${note}`,
        referenceId: reading.id,
        referenceType: 'meter_reading'
      }
    })

    return updated
  }

  // 7. Get all readings for accountant
  async findAll(params: { month?: string; status?: MeterReadingStatus; roomId?: string; page?: number; limit?: number }) {
    const page = params.page || 1
    const limit = params.limit || 50
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.month) where.month = params.month
    if (params.status) where.status = params.status
    if (params.roomId) where.roomId = params.roomId

    const [readings, total] = await Promise.all([
      prisma.meterReading.findMany({
        where,
        skip,
        take: limit,
        include: {
          room: { select: { id: true, roomNumber: true, building: true, floor: true } },
          recorder: { select: { id: true, fullName: true, email: true } },
          reviewer: { select: { id: true, fullName: true, email: true } }
        },
        orderBy: [{ isAnomaly: 'desc' }, { room: { building: 'asc' } }, { room: { roomNumber: 'asc' } }]
      }),
      prisma.meterReading.count({ where })
    ])

    return { readings, page, limit, total }
  }
}

export const meterReadingService = new MeterReadingService()
