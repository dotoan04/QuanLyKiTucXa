import { PrismaClient, NotificationType } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'
import { notificationService } from '../notifications/notification.service'

const prisma = new PrismaClient()

function formatAppointmentWhen(scheduledAt: Date): string {
  return new Date(scheduledAt).toLocaleString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function roomLine(room: { building: string; floor: number; roomNumber: string } | null | undefined): string | null {
  if (!room) return null
  return `Phòng dự kiến: ${room.roomNumber} (Tòa ${room.building}, tầng ${room.floor})`
}

/** Đơn đủ điều kiện xếp lịch hẹn xem phòng (trước khi tạo HĐ) */
const APPOINTMENT_ELIGIBLE_REGISTRATION_STATUSES = ['deposit_paid', 'deposit_confirmed'] as const

function isEligibleRegistrationStatus(status: string): boolean {
  return (APPOINTMENT_ELIGIBLE_REGISTRATION_STATUSES as readonly string[]).includes(status)
}

const INCLUDE_FULL = {
  createdBy: { select: { id: true, fullName: true, email: true } },
  room: { select: { id: true, roomNumber: true, building: true, floor: true } },
  items: {
    include: {
      registration: {
        select: {
          id: true,
          status: true,
          desiredStartDate: true,
          assignedRoom: { select: { id: true, roomNumber: true, building: true, floor: true } },
          preferredRoomType: { select: { id: true, name: true } },
          student: {
            select: {
              id: true,
              studentCode: true,
              faculty: true,
              user: { select: { id: true, fullName: true, email: true, phone: true } }
            }
          }
        }
      }
    }
  }
} as const

class AppointmentsService {
  /**
   * Sinh viên: các lịch hẹn xem phòng gắn với đơn đăng ký của mình.
   */
  async findMineForStudentUser(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId },
      select: { id: true }
    })
    if (!student) return []

    const rows = await prisma.appointmentItem.findMany({
      where: { registration: { studentId: student.id } },
      include: {
        appointment: {
          include: {
            room: { select: { id: true, roomNumber: true, building: true, floor: true } }
          }
        },
        registration: {
          select: {
            id: true,
            status: true,
            assignedRoom: { select: { id: true, roomNumber: true, building: true, floor: true } },
            preferredRoomType: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { appointment: { scheduledAt: 'desc' } }
    })

    return rows.map((row) => ({
      itemId: row.id,
      itemStatus: row.status,
      registrationId: row.registrationId,
      appointment: {
        id: row.appointment.id,
        scheduledAt: row.appointment.scheduledAt,
        status: row.appointment.status,
        location: row.appointment.location,
        notes: row.appointment.notes,
        room: row.appointment.room
      },
      registration: row.registration
    }))
  }

  private async notifyRegistrationsAppointmentEvent(
    registrationIds: string[],
    appointmentId: string,
    event: 'scheduled' | 'updated' | 'cancelled' | 'added_to_schedule'
  ) {
    if (!registrationIds.length) return

    const regs = await prisma.registrationRequest.findMany({
      where: { id: { in: registrationIds } },
      select: {
        student: { select: { userId: true } }
      }
    })
    const userIds = [...new Set(regs.map((r) => r.student.userId))]
    if (!userIds.length) return

    const apt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { room: { select: { roomNumber: true, building: true, floor: true } } }
    })
    if (!apt) return

    const when = formatAppointmentWhen(apt.scheduledAt)
    const loc = apt.location?.trim()
    const rLine = roomLine(apt.room)

    let title: string
    let message: string
    if (event === 'cancelled') {
      title = 'Hủy lịch hẹn xem phòng'
      message = `Lịch hẹn xem phòng (${when}) đã được hủy. Vui lòng mở mục Lịch hẹn xem phòng trên cổng sinh viên để xem chi tiết.`
    } else if (event === 'updated') {
      title = 'Cập nhật lịch hẹn xem phòng'
      message = `Lịch hẹn đã thay đổi: ${when}.`
      if (loc) message += ` Địa điểm: ${loc}.`
      if (rLine) message += ` ${rLine}.`
      if (apt.notes?.trim()) message += ` Ghi chú: ${apt.notes.trim()}.`
    } else {
      title = 'Lịch hẹn xem phòng'
      message =
        event === 'added_to_schedule'
          ? `Bạn được thêm vào một lịch hẹn xem phòng: ${when}.`
          : `Bạn có lịch hẹn xem phòng: ${when}.`
      if (loc) message += ` Địa điểm: ${loc}.`
      if (rLine) message += ` ${rLine}.`
      if (apt.notes?.trim()) message += ` Ghi chú: ${apt.notes.trim()}.`
    }

    await notificationService.createBatchNotifications(
      userIds.map((userId) => ({
        userId,
        type: NotificationType.system,
        title,
        message,
        referenceId: appointmentId,
        referenceType: 'appointment'
      }))
    )
  }

  async findAll(query: {
    page?: string
    limit?: string
    status?: string
    date?: string
    roomId?: string
  }) {
    const page = parseInt(query.page || '1')
    const limit = parseInt(query.limit || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (query.status) where.status = query.status
    if (query.roomId) where.roomId = query.roomId
    if (query.date) {
      const d = new Date(query.date)
      const start = new Date(d)
      start.setHours(0, 0, 0, 0)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)
      where.scheduledAt = { gte: start, lte: end }
    }

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: INCLUDE_FULL,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit
      }),
      prisma.appointment.count({ where })
    ])

    return { items, total, page, limit }
  }

  async findById(id: string) {
    const apt = await prisma.appointment.findUnique({
      where: { id },
      include: INCLUDE_FULL
    })
    if (!apt) throw AppError.notFound('Appointment')
    return apt
  }

  async create(data: {
    scheduledAt: string
    roomId?: string
    location?: string
    notes?: string
    registrationIds: string[]
    createdById: string
  }) {
    if (!data.registrationIds?.length) {
      throw AppError.badRequest('Phải chọn ít nhất 1 sinh viên')
    }

    const regs = await prisma.registrationRequest.findMany({
      where: { id: { in: data.registrationIds } },
      select: { id: true, status: true, student: { select: { user: { select: { fullName: true } } } } }
    })

    const invalid = regs.filter(r => !isEligibleRegistrationStatus(r.status))
    if (invalid.length > 0) {
      throw AppError.badRequest(
        `Chỉ được chọn đơn đang chờ xác nhận cọc / cọc đã xác nhận (chưa tạo HĐ). Không hợp lệ: ${invalid.map(r => r.student.user.fullName).join(', ')}`
      )
    }

    const apt = await prisma.appointment.create({
      data: {
        scheduledAt: new Date(data.scheduledAt),
        roomId: data.roomId || null,
        location: data.location,
        notes: data.notes,
        createdById: data.createdById,
        items: {
          create: data.registrationIds.map(rid => ({
            registrationId: rid,
            status: 'pending' as const
          }))
        }
      },
      include: INCLUDE_FULL
    })

    await this.notifyRegistrationsAppointmentEvent(data.registrationIds, apt.id, 'scheduled')

    return apt
  }

  async update(id: string, data: {
    scheduledAt?: string
    roomId?: string | null
    location?: string
    notes?: string
    status?: string
  }) {
    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { items: { select: { registrationId: true } } }
    })
    if (!existing) throw AppError.notFound('Appointment')

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.roomId !== undefined && { roomId: data.roomId }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status as any })
      },
      include: INCLUDE_FULL
    })

    if (updated.status === 'scheduled') {
      const regIds = updated.items.map((i) => i.registrationId)
      const timeChanged = existing.scheduledAt.getTime() !== updated.scheduledAt.getTime()
      const locChanged = (existing.location ?? '') !== (updated.location ?? '')
      const roomChanged = (existing.roomId ?? '') !== (updated.roomId ?? '')
      const notesChanged = (existing.notes ?? '') !== (updated.notes ?? '')
      const becameScheduledAgain = existing.status !== 'scheduled' && updated.status === 'scheduled'
      if (timeChanged || locChanged || roomChanged || notesChanged || becameScheduledAgain) {
        await this.notifyRegistrationsAppointmentEvent(regIds, updated.id, 'updated')
      }
    }

    return updated
  }

  async updateItemStatus(appointmentId: string, registrationId: string, status: 'pending' | 'attended' | 'absent', note?: string) {
    const item = await prisma.appointmentItem.findFirst({
      where: { appointmentId, registrationId }
    })
    if (!item) throw AppError.notFound('AppointmentItem')

    return prisma.appointmentItem.update({
      where: { id: item.id },
      data: { status, note }
    })
  }

  async addRegistrations(appointmentId: string, registrationIds: string[]) {
    const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } })
    if (!existing) throw AppError.notFound('Appointment')

    const regs = await prisma.registrationRequest.findMany({
      where: { id: { in: registrationIds } },
      select: { id: true, status: true, student: { select: { user: { select: { fullName: true } } } } }
    })
    const invalid = regs.filter(r => !isEligibleRegistrationStatus(r.status))
    if (invalid.length > 0) {
      throw AppError.badRequest(
        `Chỉ thêm đơn chờ KT xác nhận cọc hoặc cọc đã xác nhận: ${invalid.map(r => r.student.user.fullName).join(', ')}`
      )
    }

    await prisma.appointmentItem.createMany({
      data: registrationIds.map(rid => ({ appointmentId, registrationId: rid, status: 'pending' as const })),
      skipDuplicates: true
    })

    const full = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: INCLUDE_FULL })
    if (full?.status === 'scheduled') {
      await this.notifyRegistrationsAppointmentEvent(registrationIds, appointmentId, 'added_to_schedule')
    }
    return full
  }

  async removeRegistration(appointmentId: string, registrationId: string) {
    await prisma.appointmentItem.deleteMany({ where: { appointmentId, registrationId } })
  }

  async complete(id: string) {
    const apt = await prisma.appointment.findUnique({ where: { id } })
    if (!apt) throw AppError.notFound('Appointment')
    if (apt.status === 'completed') throw AppError.badRequest('Lịch hẹn đã hoàn thành')

    return prisma.appointment.update({
      where: { id },
      data: { status: 'completed' },
      include: INCLUDE_FULL
    })
  }

  async cancel(id: string) {
    const apt = await prisma.appointment.findUnique({
      where: { id },
      include: { items: { select: { registrationId: true } } }
    })
    if (!apt) throw AppError.notFound('Appointment')
    if (apt.status === 'completed') throw AppError.badRequest('Không thể hủy lịch đã hoàn thành')

    const regIds = apt.items.map((i) => i.registrationId)

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
      include: INCLUDE_FULL
    })

    await this.notifyRegistrationsAppointmentEvent(regIds, id, 'cancelled')

    return updated
  }

  /**
   * Đơn đã nộp chứng từ cọc (deposit_paid) hoặc kế toán đã xác nhận (deposit_confirmed),
   * chưa gắn vào lịch hẹn đang trạng thái scheduled — chưa tạo hợp đồng.
   */
  async getPendingRegistrations(query: { roomTypeId?: string }) {
    const scheduledRegistrationIds = await prisma.appointmentItem.findMany({
      where: { appointment: { status: 'scheduled' } },
      select: { registrationId: true }
    }).then(items => items.map(i => i.registrationId))

    return prisma.registrationRequest.findMany({
      where: {
        status: { in: [...APPOINTMENT_ELIGIBLE_REGISTRATION_STATUSES] },
        ...(query.roomTypeId && { preferredRoomTypeId: query.roomTypeId }),
        id: { notIn: scheduledRegistrationIds }
      },
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            faculty: true,
            user: { select: { id: true, fullName: true, email: true, phone: true } }
          }
        },
        preferredRoomType: { select: { id: true, name: true } },
        assignedRoom: { select: { id: true, roomNumber: true, building: true, floor: true } }
      },
      orderBy: [{ priorityScore: 'desc' }, { createdAt: 'asc' }]
    })
  }
}

export const appointmentsService = new AppointmentsService()
