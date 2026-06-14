import {
  PrismaClient,
  InvoiceStatus,
  RegistrationStatus,
  ContractStatus,
  IncidentStatus,
  IncidentPriority,
  IncidentCategory,
} from '@prisma/client'
import type { ChatIntent } from './chatbot-intents'
import { logger } from './ai-config'
import { renewalService } from '../renewals/renewals.service'

const prisma = new PrismaClient()

const UNPAID_LIKE: InvoiceStatus[] = [
  InvoiceStatus.unpaid,
  InvoiceStatus.overdue,
  InvoiceStatus.partial,
]

function monthRange(y: number, m: number): { start: Date; end: Date } {
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0)
  const end = new Date(y, m, 0, 23, 59, 59, 999)
  return { start, end }
}

export function parseMonthHint(question: string): { year: number; month: number } | null {
  const q = question
  const now = new Date()
  const thang = q.match(/tháng\s*(\d{1,2})(?:\s*năm\s*(\d{4}))?/i)
  if (thang) {
    const month = parseInt(thang[1], 10)
    const year = thang[2] ? parseInt(thang[2], 10) : now.getFullYear()
    if (month >= 1 && month <= 12) return { year, month }
  }
  const slash = q.match(/\b(\d{1,2})\/(\d{4})\b/)
  if (slash) {
    const month = parseInt(slash[1], 10)
    const year = parseInt(slash[2], 10)
    if (month >= 1 && month <= 12) return { year, month }
  }
  return null
}

/** Tránh bắt nhầm "phòng gần nhất", "phòng nào", … làm mã phòng. */
const ROOM_NUMBER_STOPWORDS = new Set(
  [
    'gần',
    'gan',
    'nhất',
    'nhat',
    'này',
    'nay',
    'đó',
    'do',
    'mới',
    'moi',
    'trống',
    'trong',
    'nào',
    'nao',
    'đầu',
    'dau',
    'cuối',
    'cuoi',
    'tao',
    'nha',
    'cho',
    'của',
    'cua',
    'để',
    'de',
    'và',
    'va',
  ].map(s => s.toLowerCase())
)

const BUILDING_STOPWORDS = new Set(
  ['vệ', 've', 'trường', 'truong', 'xưởng', 'xuong', 'phòng', 'phong', 'ăn', 'an', 'nghỉ', 'nghi', 'máy', 'may'].map(
    s => s.toLowerCase()
  )
)

export function parseBuildingHint(question: string): string | undefined {
  const m =
    question.match(/tòa\s*([A-Za-z0-9À-ỹ]+)/i) ||
    question.match(/\bnhà\s*([A-Za-z0-9À-ỹ]+)/i)
  if (!m) return undefined
  const raw = m[1].trim().slice(0, 30)
  const key = raw.toLowerCase().normalize('NFC')
  if (BUILDING_STOPWORDS.has(key) || raw.length < 1) return undefined
  return raw
}

export function parseRoomNumberHint(question: string): string | undefined {
  const m =
    question.match(/phòng\s+([A-Za-z0-9À-ỹ]+)/i) ||
    question.match(/phòng\s*([0-9][A-Za-z0-9À-ỹ]*)/i) ||
    question.match(/\broom\s*([A-Za-z0-9]+)/i)
  if (!m) return undefined
  const raw = m[1].trim().slice(0, 20)
  const key = raw.toLowerCase().normalize('NFC')
  if (ROOM_NUMBER_STOPWORDS.has(key)) return undefined
  if (raw.length < 2 && !/\d/.test(raw)) return undefined
  return raw
}

function clampDays(n: number): number {
  return Math.min(365, Math.max(1, Number.isFinite(n) ? n : 30))
}

/** Cửa sổ ngày từ câu hỏi, vd. "trong 30 ngày", "60 ngày tới", "2 tuần". */
export function parseDaysWindowHint(question: string, defaultDays: number): number {
  const q = question
  const trongNgay = q.match(/trong\s+(\d{1,3})\s*ngày/i)
  if (trongNgay) return clampDays(parseInt(trongNgay[1], 10))
  const ngayToi = q.match(/(\d{1,3})\s*ngày\s*(?:tới|tiếp|nữa|nửa)/i)
  if (ngayToi) return clampDays(parseInt(ngayToi[1], 10))
  const tuan = q.match(/(\d{1,2})\s*tuần/i)
  if (tuan) return clampDays(parseInt(tuan[1], 10) * 7)
  return defaultDays
}

/** Trạng thái hợp đồng theo từ khóa tiếng Việt (mặc định active khi không rõ). */
export function parseContractStatusHint(question: string): ContractStatus | undefined {
  const q = question.toLowerCase()
  if (/đã\s*hết\s*hạn|hết\s*hạn\b|expired|hợp\s*đồng\s*cũ/.test(q)) return ContractStatus.expired
  if (/chấm\s*dứt|terminated|hủy\s*hợp\s*đồng|đã\s*hủy/.test(q)) return ContractStatus.terminated
  if (/chờ|pending|chưa\s*duyệt|đang\s*soạn/.test(q)) return ContractStatus.pending
  if (/đang\s*hiệu\s*lực|active|còn\s*hiệu\s*lực|đang\s*thuê/.test(q)) return ContractStatus.active
  return undefined
}

export function parseIncidentStatusHint(question: string): IncidentStatus | undefined {
  const q = question.toLowerCase()
  if (/đang\s*xử\s*lý|in[\s-]*progress|đang\s*làm/.test(q)) return IncidentStatus.in_progress
  if (/đã\s*(giải\s*quyết|xử|xong)|resolved|hoàn\s*thành/.test(q)) return IncidentStatus.resolved
  if (/đã\s*đóng|closed/.test(q)) return IncidentStatus.closed
  if (/chờ|pending|mới\s+tạo|chưa\s*xử/.test(q)) return IncidentStatus.pending
  return undefined
}

export function parseIncidentPriorityHint(question: string): IncidentPriority | undefined {
  const q = question.toLowerCase()
  if (/khẩn\s*cấp|urgent|ưu\s*tiên\s*(cao|nhất)/.test(q)) return IncidentPriority.urgent
  if (/cao|high/.test(q)) return IncidentPriority.high
  if (/thấp|low/.test(q)) return IncidentPriority.low
  if (/trung\s*bình|medium/.test(q)) return IncidentPriority.medium
  return undefined
}

export function parseIncidentCategoryHint(question: string): IncidentCategory | undefined {
  const q = question.toLowerCase()
  if (/điện|electrical|chập|hỏng\s*(đèn|ổ\s*điện)/.test(q)) return IncidentCategory.electrical
  if (/nước|plumbing|vòi|bồn\s*cầu|rò\s*rỉ|thoát\s*nước/.test(q)) return IncidentCategory.plumbing
  if (/nội\s*thất|giường|tủ|bàn|ghế|furniture/.test(q)) return IncidentCategory.furniture
  if (/mạng|wifi|internet|network/.test(q)) return IncidentCategory.network
  if (/an\s*ninh|bảo\s*vệ|security|trộm/.test(q)) return IncidentCategory.security
  return undefined
}

/** Trạng thái vi phạm (string, không phải enum). */
export function parseViolationStatusHint(question: string): string | undefined {
  const q = question.toLowerCase()
  if (/chưa\s*xử|chờ\s*xử|pending|mới\s+(tạo|báo)/.test(q)) return 'pending'
  if (/đã\s*xử|processed|đã\s*phạt/.test(q)) return 'processed'
  if (/đã\s*đóng|closed|đã\s*giải\s*quyết/.test(q)) return 'closed'
  if (/kháng|appealed|khiếu\s*nại/.test(q)) return 'appealed'
  return undefined
}

export function parsePenaltyLevelHint(question: string): string | undefined {
  const q = question.toLowerCase()
  if (/nghiêm\s*trọng|severe|cao\s*nhất/.test(q)) return 'severe'
  if (/cao|high/.test(q)) return 'high'
  if (/thấp|low/.test(q)) return 'low'
  if (/trung\s*bình|medium/.test(q)) return 'medium'
  return undefined
}

/** Mã sinh viên khi user nhắc rõ (vd. "mã sinh viên SV001", "mssv 20210001", "sinh viên SV001"). */
export function parseStudentCodeHint(question: string): string | undefined {
  const m =
    question.match(/(?:mã\s*sinh\s*viên|mssv|sv)\s*[:\-]?\s*([A-Za-z0-9]{4,20})/i) ||
    question.match(/sinh\s*viên\s+([A-Za-z]?\d{5,12})/i)
  if (!m) return undefined
  const raw = m[1].trim().slice(0, 20)
  return raw.length >= 4 ? raw : undefined
}

function money(n: { toString(): string }) {
  return n.toString()
}

class ChatbotDataService {
  /**
   * Loads redacted structured rows for LLM summarization. Caller must enforce RBAC + intent.
   * StaffInfo has no building scope yet — optional building filter comes from question text only.
   */
  async loadStructuredDataForChat(input: {
    intent: ChatIntent
    userId: string
    userRole: string
    question: string
  }): Promise<Record<string, unknown>> {
    const { intent, userId, userRole, question } = input
    const role = userRole.toLowerCase()

    try {
      if (intent === 'PAYMENT_STATUS') {
        return await this.loadPaymentData(userId, role, question)
      }
      if (intent === 'SCHEDULE') {
        return await this.loadScheduleData(question)
      }
      if (intent === 'ROOM_INFO') {
        return await this.loadRoomData(userId, role, question)
      }
      if (intent === 'STUDENT_OVERVIEW') {
        return await this.loadStudentOverviewData(userId, role)
      }
    } catch (e) {
      logger.error('chatbot structured data load failed', e)
      return { error: 'load_failed', intent }
    }

    return { intent, items: [] }
  }

  private renewalHintVi(input: {
    isEligible: boolean
    currentEndDate: Date | null
    daysUntilExpiry: number
    reason?: string
  }): string {
    if (input.isEligible) {
      if (!input.currentEndDate) {
        return 'Theo hệ thống, hợp đồng **chưa có ngày kết thúc** — thực hiện gia hạn/điều chỉnh qua mục **Gia hạn** trên cổng hoặc liên hệ KTX.'
      }
      return `**Đủ điều kiện** xem xét gia hạn trên cổng (mục **Gia hạn**). Còn khoảng **${input.daysUntilExpiry}** ngày đến ngày kết thúc hợp đồng.`
    }
    const r = input.reason || ''
    if (/not active/i.test(r)) return '**Không** gia hạn được: hợp đồng không ở trạng thái đang hiệu lực.'
    if (/30 days/i.test(r)) {
      return `**Chưa** đến thời điểm gia hạn: chỉ trong **30 ngày** trước ngày hết hạn. Hiện còn **${input.daysUntilExpiry}** ngày.`
    }
    if (/unpaid/i.test(r)) {
      return '**Chưa** gia hạn được: còn **hóa đơn chưa thanh toán** — vui lòng thanh toán trước.'
    }
    return r.trim() ? r : 'Chưa đủ điều kiện gia hạn theo dữ liệu hệ thống.'
  }

  private registrationStatusVi(s: RegistrationStatus): string {
    const m: Record<RegistrationStatus, string> = {
      [RegistrationStatus.pending]: 'Chờ duyệt hồ sơ',
      [RegistrationStatus.deposit_pending]: 'Chờ nộp cọc',
      [RegistrationStatus.deposit_paid]: 'Đã nộp cọc, chờ kế toán',
      [RegistrationStatus.deposit_confirmed]: 'Đã xác nhận cọc',
      [RegistrationStatus.approved]: 'Đã duyệt (có HĐ)',
      [RegistrationStatus.rejected]: 'Bị từ chối',
      [RegistrationStatus.cancelled]: 'Đã hủy',
    }
    return m[s] ?? s
  }

  /**
   * Gói tra cứu SV: đơn đăng ký, lịch hẹn liên quan, HĐ active, hóa đơn gần nhất, gợi ý gia hạn.
   */
  private async loadStudentOverviewData(
    userId: string,
    role: string
  ): Promise<Record<string, unknown>> {
    if (role !== 'student') {
      return {
        kind: 'student_overview',
        error: 'role_not_student',
        message: 'Tổng hợp này chỉ dành cho tài khoản sinh viên.',
      }
    }

    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        user: { select: { fullName: true } },
        contracts: {
          where: { status: 'active' },
          include: {
            room: {
              include: { roomType: { select: { name: true } } },
            },
          },
          take: 1,
        },
      },
    })

    if (!student) {
      return {
        kind: 'student_overview',
        scope: 'self',
        student: false,
      }
    }

    const [registrations, appointmentItems, invoices] = await Promise.all([
      prisma.registrationRequest.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          preferredRoomType: { select: { name: true } },
          preferredRoom: { select: { roomNumber: true, building: true } },
          assignedRoom: { select: { roomNumber: true, building: true } },
        },
      }),
      (() => {
        const from = new Date()
        from.setDate(from.getDate() - 7)
        const to = new Date()
        to.setDate(to.getDate() + 60)
        return prisma.appointmentItem.findMany({
          where: {
            registration: { studentId: student.id },
            appointment: { scheduledAt: { gte: from, lte: to } },
          },
          include: {
            appointment: {
              include: {
                room: { select: { roomNumber: true, building: true } },
              },
            },
          },
          orderBy: { appointment: { scheduledAt: 'asc' } },
          take: 20,
        })
      })(),
      prisma.invoice.findMany({
        where: { contract: { studentId: student.id } },
        orderBy: { invoiceMonth: 'desc' },
        take: 10,
        include: {
          contract: {
            include: {
              room: { select: { roomNumber: true, building: true } },
            },
          },
        },
      }),
    ])

    const active = student.contracts[0]
    let renewalBlock: Record<string, unknown> = {
      hasActiveContract: false,
      hintVi: 'Không có hợp đồng đang hiệu lực — không áp dụng gia hạn theo hợp đồng hiện tại.',
    }

    if (active) {
      const el = await renewalService.checkRenewalEligibility(active.id)
      renewalBlock = {
        hasActiveContract: true,
        contractId: active.id,
        contractStart: active.startDate.toISOString(),
        contractEnd: active.endDate?.toISOString() ?? null,
        isEligible: el.isEligible,
        daysUntilExpiry: el.daysUntilExpiry,
        hintVi: this.renewalHintVi({
          isEligible: el.isEligible,
          currentEndDate: el.currentEndDate,
          daysUntilExpiry: el.daysUntilExpiry,
          reason: el.reason,
        }),
      }
    }

    return {
      kind: 'student_overview',
      scope: 'self',
      studentCode: student.studentCode,
      fullName: student.user.fullName,
      registrations: registrations.map((r) => ({
        id: r.id,
        status: r.status,
        statusVi: this.registrationStatusVi(r.status),
        createdAt: r.createdAt.toISOString(),
        preferredRoomType: r.preferredRoomType?.name ?? null,
        preferredRoom:
          r.preferredRoom != null
            ? `${r.preferredRoom.roomNumber} (${r.preferredRoom.building})`
            : null,
        assignedRoom:
          r.assignedRoom != null
            ? `${r.assignedRoom.roomNumber} (${r.assignedRoom.building})`
            : null,
        desiredStartDate: r.desiredStartDate.toISOString(),
      })),
      appointments: appointmentItems.map((it) => ({
        scheduledAt: it.appointment.scheduledAt.toISOString(),
        appointmentStatus: it.appointment.status,
        itemStatus: it.status,
        location: it.appointment.location,
        room:
          it.appointment.room != null
            ? `${it.appointment.room.roomNumber} (${it.appointment.room.building})`
            : null,
        notes: it.appointment.notes,
      })),
      activeContract: active
        ? {
            id: active.id,
            startDate: active.startDate.toISOString(),
            endDate: active.endDate?.toISOString() ?? null,
            monthlyRent: money(active.monthlyRent),
            status: active.status,
            room: `${active.room.roomNumber} (${active.room.building})`,
            roomType: active.room.roomType?.name ?? null,
          }
        : null,
      invoices: invoices.map((inv) => ({
        status: inv.status,
        invoiceMonth: inv.invoiceMonth.toISOString(),
        dueDate: inv.dueDate.toISOString(),
        totalAmount: money(inv.totalAmount),
        paidAt: inv.paidAt?.toISOString() ?? null,
        room: inv.contract.room
          ? `${inv.contract.room.roomNumber} (${inv.contract.room.building})`
          : null,
      })),
      renewal: renewalBlock,
    }
  }

  private async loadPaymentData(
    userId: string,
    role: string,
    question: string
  ): Promise<Record<string, unknown>> {
    const monthHint = parseMonthHint(question)
    const building = parseBuildingHint(question)
    const monthFilter =
      monthHint != null
        ? monthRange(monthHint.year, monthHint.month)
        : null

    if (role === 'student') {
      const student = await prisma.student.findFirst({
        where: { userId },
        select: { id: true, studentCode: true },
      })
      if (!student) {
        return { scope: 'self', student: false, invoices: [] }
      }

      const invoices = await prisma.invoice.findMany({
        where: {
          contract: { studentId: student.id },
          status: { in: UNPAID_LIKE },
          ...(monthFilter
            ? {
                invoiceMonth: {
                  gte: monthFilter.start,
                  lte: monthFilter.end,
                },
              }
            : {}),
        },
        include: {
          contract: {
            include: {
              room: { select: { roomNumber: true, building: true } },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 40,
      })

      return {
        scope: 'self',
        studentCode: student.studentCode,
        invoices: invoices.map((inv) => ({
          status: inv.status,
          dueDate: inv.dueDate.toISOString(),
          invoiceMonth: inv.invoiceMonth.toISOString(),
          totalAmount: money(inv.totalAmount),
          room: inv.contract.room
            ? `${inv.contract.room.roomNumber} (${inv.contract.room.building})`
            : null,
        })),
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: UNPAID_LIKE },
        ...(monthFilter
          ? {
              invoiceMonth: {
                gte: monthFilter.start,
                lte: monthFilter.end,
              },
            }
          : {}),
        ...(building
          ? {
              contract: {
                room: { building: { contains: building, mode: 'insensitive' } },
              },
            }
          : {}),
      },
      include: {
        contract: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true } },
              },
            },
            room: { select: { roomNumber: true, building: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 50,
    })

    return {
      scope: 'organization',
      invoices: invoices.map((inv) => ({
        status: inv.status,
        dueDate: inv.dueDate.toISOString(),
        invoiceMonth: inv.invoiceMonth.toISOString(),
        totalAmount: money(inv.totalAmount),
        studentCode: inv.contract.student.studentCode,
        studentName: inv.contract.student.user.fullName,
        room: inv.contract.room
          ? `${inv.contract.room.roomNumber} (${inv.contract.room.building})`
          : null,
      })),
    }
  }

  private async loadScheduleData(question: string): Promise<Record<string, unknown>> {
    const from = new Date()
    const to = new Date()
    to.setDate(to.getDate() + 45)

    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: from, lte: to },
        status: 'scheduled',
      },
      include: {
        room: { select: { roomNumber: true, building: true } },
        items: {
          take: 40,
          include: {
            registration: {
              include: {
                student: {
                  select: {
                    studentCode: true,
                    user: { select: { fullName: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 30,
    })

    return {
      window: { from: from.toISOString(), to: to.toISOString() },
      appointments: appointments.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt.toISOString(),
        status: a.status,
        location: a.location,
        notes: a.notes,
        room: a.room
          ? `${a.room.roomNumber} (${a.room.building})`
          : null,
        registrants: a.items.map((it) => ({
          studentName: it.registration.student.user.fullName,
          studentCode: it.registration.student.studentCode,
          itemStatus: it.status,
        })),
      })),
    }
  }

  private async loadRoomData(
    userId: string,
    role: string,
    question: string
  ): Promise<Record<string, unknown>> {
    const building = parseBuildingHint(question)
    const roomNumber = parseRoomNumberHint(question)

    if (role === 'student' && this.questionAsksVacancy(question)) {
      return {
        scope: 'self',
        vacancyStudentHint: true,
        message:
          'Số phòng trống và chỗ còn do ban quản lý theo dõi. Bạn xem mục **Đăng ký phòng** trên cổng sinh viên hoặc liên hệ KTX.',
      }
    }

    if (role === 'student') {
      const student = await prisma.student.findFirst({
        where: { userId },
        include: {
          user: { select: { fullName: true } },
          contracts: {
            where: { status: 'active' },
            include: {
              room: {
                include: { roomType: { select: { name: true } } },
              },
            },
            take: 1,
          },
        },
      })

      if (!student) {
        return { scope: 'self', activeStay: null }
      }

      const c = student.contracts[0]
      if (!c) {
        return {
          scope: 'self',
          studentCode: student.studentCode,
          fullName: student.user.fullName,
          activeStay: null,
        }
      }

      return {
        scope: 'self',
        studentCode: student.studentCode,
        fullName: student.user.fullName,
        activeStay: {
          roomNumber: c.room.roomNumber,
          building: c.room.building,
          roomType: c.room.roomType?.name,
          contractStatus: c.status,
        },
      }
    }

    if (this.questionAsksVacancy(question)) {
      return await this.loadVacancySnapshot(question)
    }

    if (this.questionAsksRecentCheckinStudent(question)) {
      return await this.loadMostRecentActiveContractDetail()
    }

    const roomFilter: { building?: object; roomNumber?: object } = {}
    if (building) {
      roomFilter.building = { contains: building, mode: 'insensitive' as const }
    }
    if (roomNumber) {
      roomFilter.roomNumber = { contains: roomNumber, mode: 'insensitive' as const }
    }

    const contracts = await prisma.contract.findMany({
      where: {
        status: 'active',
        ...(Object.keys(roomFilter).length > 0 ? { room: roomFilter } : {}),
      },
      include: {
        room: { select: { roomNumber: true, building: true } },
        student: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: [{ room: { building: 'asc' } }, { room: { roomNumber: 'asc' } }],
      take: 80,
    })

    return {
      scope: 'organization',
      activeContracts: contracts.map((c) => ({
        studentCode: c.student.studentCode,
        studentName: c.student.user.fullName,
        roomNumber: c.room.roomNumber,
        building: c.room.building,
      })),
    }
  }

  /** SV / HĐ vừa nhận phòng gần nhất (theo ngày bắt đầu HĐ đang active). */
  private questionAsksRecentCheckinStudent(question: string): boolean {
    const q = question.toLowerCase()
    const wantsRecent =
      /gần\s+nhất|mới\s+nhất|vừa\s+mới|mới\s+(được\s+)?(nhận|vào)|cuối\s+cùng|mới\s+tạo|latest|most\s+recent|last\s+(one|student|contract)/i.test(
        q
      )
    const aboutStudent =
      /sinh\s+viên|hợp\s+đồng|nhận\s+phòng|lưu\s+trú|phân\s+phòng|student|contract|check\s*-?in/i.test(
        q
      )
    return wantsRecent && aboutStudent
  }

  private async loadMostRecentActiveContractDetail(): Promise<Record<string, unknown>> {
    const c = await prisma.contract.findFirst({
      where: { status: 'active' },
      orderBy: { startDate: 'desc' },
      include: {
        room: {
          include: {
            roomType: { select: { name: true, capacity: true } },
          },
        },
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    if (!c) {
      return { scope: 'organization', kind: 'recent_contract', empty: true }
    }

    const s = c.student
    const u = s.user

    return {
      scope: 'organization',
      kind: 'recent_contract',
      note: 'Chọn hợp đồng **active** có startDate mới nhất (đại diện nhận phòng gần nhất trong dữ liệu).',
      contract: {
        id: c.id,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate?.toISOString() ?? null,
        monthlyRent: c.monthlyRent.toString(),
        depositAmount: c.depositAmount.toString(),
        status: c.status,
      },
      student: {
        studentCode: s.studentCode,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        idCardNumber: s.idCardNumber,
        dateOfBirth: s.dateOfBirth?.toISOString() ?? null,
        gender: s.gender,
        hometown: s.hometown,
        address: s.address,
        faculty: s.faculty,
        academicYear: s.academicYear,
        priorityGroup: s.priorityGroup,
        emergencyContact: s.emergencyContact,
      },
      room: {
        roomNumber: c.room.roomNumber,
        building: c.room.building,
        floor: c.room.floor,
        roomStatus: c.room.status,
        roomTypeName: c.room.roomType?.name,
        capacity: c.room.roomType?.capacity,
      },
    }
  }

  private questionAsksVacancy(question: string): boolean {
    return /phòng\s+trống|còn\s+trống|chỗ\s+trống|giường\s+trống|phòng\s+nào\s+trống|bao\s+nhiêu\s+phòng|số\s+phòng\s+trống|còn\s+bao\s+nhiêu\s+phòng|vacant|available\s+room/i.test(
      question
    )
  }

  /** Tóm tắt chỗ còn theo `room_types.capacity` và `rooms.current_occupancy` (không bảo trì). */
  private async loadVacancySnapshot(question: string): Promise<Record<string, unknown>> {
    const building = parseBuildingHint(question)
    const rooms = await prisma.room.findMany({
      where: building
        ? { building: { contains: building, mode: 'insensitive' } }
        : {},
      include: {
        roomType: { select: { name: true, capacity: true } },
      },
      orderBy: [{ building: 'asc' }, { roomNumber: 'asc' }],
    })

    const rows = rooms.map((r) => {
      const cap = r.roomType.capacity
      const occ = r.currentOccupancy
      const freeBeds = Math.max(0, cap - occ)
      return {
        roomNumber: r.roomNumber,
        building: r.building,
        floor: r.floor,
        roomType: r.roomType.name,
        capacity: cap,
        currentOccupancy: occ,
        freeBeds,
        status: r.status,
      }
    })

    const rentable = rows.filter((x) => x.status !== 'maintenance')
    const roomsWithFreeBed = rentable.filter((x) => x.freeBeds > 0).length
    const fullyVacantRooms = rentable.filter((x) => x.currentOccupancy === 0).length
    const totalFreeBeds = rentable.reduce((s, x) => s + x.freeBeds, 0)
    const topRows = [...rentable]
      .filter((x) => x.freeBeds > 0)
      .sort((a, b) => b.freeBeds - a.freeBeds)
      .slice(0, 45)

    return {
      scope: 'organization',
      kind: 'vacancy',
      asOf: new Date().toISOString(),
      buildingFilter: building ?? null,
      summary: {
        totalRoomsListed: rooms.length,
        fullyVacantRooms,
        roomsWithAtLeastOneBed: roomsWithFreeBed,
        totalFreeBeds,
      },
      rooms: topRows,
    }
  }

  // ────────── Agent tools: organization queries (agent-only, không qua intent) ──────────

  /** Danh sách hợp đồng theo trạng thái / tòa / mã SV (organization scope). */
  async loadContracts(input: { userRole: string; question: string }): Promise<Record<string, unknown>> {
    const { question } = input
    const status = parseContractStatusHint(question) ?? ContractStatus.active
    const building = parseBuildingHint(question)
    const studentCode = parseStudentCodeHint(question)

    const contracts = await prisma.contract.findMany({
      where: {
        status,
        ...(building
          ? { room: { building: { contains: building, mode: 'insensitive' } } }
          : {}),
        ...(studentCode
          ? { student: { studentCode: { contains: studentCode, mode: 'insensitive' } } }
          : {}),
      },
      include: {
        room: { select: { roomNumber: true, building: true } },
        student: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: [{ room: { building: 'asc' } }, { startDate: 'desc' }],
      take: 80,
    })

    const now = new Date()
    return {
      scope: 'organization',
      kind: 'contracts',
      filters: { status, building: building ?? null, studentCode: studentCode ?? null },
      summary: { total: contracts.length },
      contracts: contracts.map((c) => {
        const daysUntilExpiry =
          c.endDate != null
            ? Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null
        return {
          id: c.id,
          studentCode: c.student.studentCode,
          studentName: c.student.user.fullName,
          roomNumber: c.room.roomNumber,
          building: c.room.building,
          startDate: c.startDate.toISOString(),
          endDate: c.endDate?.toISOString() ?? null,
          endDateNote:
            c.endDate == null ? 'open-ended (chưa đặt ngày kết thúc trong hệ thống)' : null,
          monthlyRent: money(c.monthlyRent),
          depositAmount: money(c.depositAmount),
          status: c.status,
          daysUntilExpiry,
        }
      }),
    }
  }

  /** Tổng hợp công nợ chưa thu (unpaid/overdue/partial), có thể lọc theo tháng. */
  async loadRevenueSummary(input: { question: string }): Promise<Record<string, unknown>> {
    const monthHint = parseMonthHint(input.question)
    const monthFilter = monthHint ? monthRange(monthHint.year, monthHint.month) : null

    const groups = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        status: { in: UNPAID_LIKE },
        ...(monthFilter
          ? { invoiceMonth: { gte: monthFilter.start, lte: monthFilter.end } }
          : {}),
      },
      _count: { _all: true },
      _sum: { totalAmount: true },
    })

    const byStatus = groups.map((g) => ({
      status: g.status,
      count: g._count._all,
      totalAmount: g._sum.totalAmount ? money(g._sum.totalAmount) : '0',
    }))
    const totalOutstanding = groups.reduce(
      (s, g) => s + (g._sum.totalAmount ? g._sum.totalAmount.toNumber() : 0),
      0
    )
    const countFor = (st: InvoiceStatus): number =>
      groups.filter((g) => g.status === st).reduce((s, g) => s + g._count._all, 0)

    return {
      scope: 'organization',
      kind: 'revenue_summary',
      month: monthHint
        ? `${monthHint.year}-${String(monthHint.month).padStart(2, '0')}`
        : null,
      asOf: new Date().toISOString(),
      totalOutstandingAmount: money(totalOutstanding),
      totalCount: groups.reduce((s, g) => s + g._count._all, 0),
      unpaidCount: countFor(InvoiceStatus.unpaid),
      overdueCount: countFor(InvoiceStatus.overdue),
      partialCount: countFor(InvoiceStatus.partial),
      byStatus,
      note: 'Chỉ gom hóa đơn chưa thanh toán (unpaid/overdue/partial). Hóa đơn đã thanh toán (paid) không tính.',
    }
  }

  /** Hợp đồng active sắp hết hạn trong cửa sổ N ngày (ứng viên gia hạn). */
  async loadRenewalsExpiring(input: { question: string }): Promise<Record<string, unknown>> {
    const days = parseDaysWindowHint(input.question, 30)
    const now = new Date()
    const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const contracts = await prisma.contract.findMany({
      where: {
        status: ContractStatus.active,
        endDate: { gte: now, lte: horizon },
      },
      include: {
        room: { select: { roomNumber: true, building: true } },
        student: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { endDate: 'asc' },
      take: 60,
    })

    return {
      scope: 'organization',
      kind: 'renewals_expiring',
      windowDays: days,
      asOf: now.toISOString(),
      horizon: horizon.toISOString(),
      summary: { count: contracts.length },
      contracts: contracts.map((c) => {
        const end = c.endDate as Date
        return {
          studentCode: c.student.studentCode,
          studentName: c.student.user.fullName,
          roomNumber: c.room.roomNumber,
          building: c.room.building,
          endDate: end.toISOString(),
          monthlyRent: money(c.monthlyRent),
          daysUntilExpiry: Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        }
      }),
      note: 'Các hợp đồng active có ngày kết thúc trong cửa sổ — nhắc sinh viên gia hạn (mục Gia hạn) trước khi hết hạn.',
    }
  }

  /** Danh sách sự cố theo trạng thái / ưu tiên / loại / phòng. */
  async loadIncidents(input: { question: string }): Promise<Record<string, unknown>> {
    const status = parseIncidentStatusHint(input.question)
    const priority = parseIncidentPriorityHint(input.question)
    const category = parseIncidentCategoryHint(input.question)
    const building = parseBuildingHint(input.question)
    const roomNumber = parseRoomNumberHint(input.question)

    const roomFilter: { building?: object; roomNumber?: object } = {}
    if (building) {
      roomFilter.building = { contains: building, mode: 'insensitive' as const }
    }
    if (roomNumber) {
      roomFilter.roomNumber = { contains: roomNumber, mode: 'insensitive' as const }
    }

    const incidents = await prisma.incident.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(category ? { category } : {}),
        ...(Object.keys(roomFilter).length > 0 ? { room: roomFilter } : {}),
      },
      include: {
        room: { select: { roomNumber: true, building: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return {
      scope: 'organization',
      kind: 'incidents',
      filters: { status, priority, category, building, roomNumber },
      summary: { total: incidents.length },
      incidents: incidents.map((i) => ({
        id: i.id,
        title: i.title,
        category: i.category,
        priority: i.priority,
        status: i.status,
        roomNumber: i.room.roomNumber,
        building: i.room.building,
        createdAt: i.createdAt.toISOString(),
        assigned: i.assignedTo != null,
        resolvedAt: i.resolvedAt?.toISOString() ?? null,
      })),
    }
  }

  /** Danh sách vi phạm theo trạng thái / mức phạt / mã SV. */
  async loadViolations(input: { question: string }): Promise<Record<string, unknown>> {
    const status = parseViolationStatusHint(input.question)
    const penaltyLevel = parsePenaltyLevelHint(input.question)
    const studentCode = parseStudentCodeHint(input.question)

    const violations = await prisma.violation.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(penaltyLevel ? { penaltyLevel } : {}),
        ...(studentCode
          ? { student: { studentCode: { contains: studentCode, mode: 'insensitive' } } }
          : {}),
      },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return {
      scope: 'organization',
      kind: 'violations',
      filters: { status, penaltyLevel, studentCode },
      summary: { total: violations.length },
      violations: violations.map((v) => ({
        id: v.id,
        studentCode: v.student.studentCode,
        studentName: v.student.user.fullName,
        type: v.type,
        penaltyLevel: v.penaltyLevel,
        penaltyAmount: v.penaltyAmount != null ? money(v.penaltyAmount) : null,
        penaltyApplied: v.penaltyApplied,
        status: v.status,
        createdAt: v.createdAt.toISOString(),
      })),
    }
  }
}

export const chatbotDataService = new ChatbotDataService()
