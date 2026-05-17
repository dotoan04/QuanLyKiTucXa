import type { ChatIntent } from './chatbot-intents'

const STATUS_VI: Record<string, string> = {
  unpaid: 'Chưa thanh toán',
  overdue: 'Quá hạn',
  partial: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('vi-VN')
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('vi-VN')
}

function fmtMoney(s: string) {
  const n = Number(s.replace(/,/g, ''))
  if (Number.isFinite(n)) {
    return n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ'
  }
  return s + ' đ'
}

function asRecordArray(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is Record<string, unknown> => x !== null && typeof x === 'object')
}

function formatPayment(payload: Record<string, unknown>): string {
  if (payload.error === 'load_failed') {
    return 'Không tải được dữ liệu thanh toán. Vui lòng thử lại sau hoặc xem mục **Hóa đơn** trên hệ thống.'
  }

  const scope = payload.scope
  if (scope === 'self' && payload.student === false) {
    return 'Tài khoản chưa được gắn hồ sơ sinh viên, nên không tra cứu được hóa đơn cá nhân.'
  }

  const invoices = asRecordArray(payload.invoices)
  if (scope === 'self') {
    const code = typeof payload.studentCode === 'string' ? payload.studentCode : ''
    const head = code ? `**Mã SV:** ${code}\n\n` : ''
    if (invoices.length === 0) {
      return `${head}Bạn **không có** hóa đơn nào đang ở trạng thái chưa thanh toán / quá hạn (theo dữ liệu hiện tại).`
    }
    const lines = invoices.map((inv) => {
      const st = typeof inv.status === 'string' ? STATUS_VI[inv.status] || inv.status : '—'
      const due = typeof inv.dueDate === 'string' ? fmtDate(inv.dueDate) : '—'
      const month = typeof inv.invoiceMonth === 'string' ? fmtDate(inv.invoiceMonth) : '—'
      const amt = typeof inv.totalAmount === 'string' ? fmtMoney(inv.totalAmount) : String(inv.totalAmount ?? '—')
      const room = inv.room != null ? String(inv.room) : '—'
      return `- **${month}** · ${amt} · hạn **${due}** · ${st} · phòng ${room}`
    })
    return `${head}### Hóa đơn cần xử lý\n\n${lines.join('\n')}`
  }

  if (scope === 'organization') {
    if (invoices.length === 0) {
      return '**Không có** hóa đơn chưa thanh toán / quá hạn khớp bộ lọc (hoặc danh sách trống).'
    }
    const lines = invoices.map((inv) => {
      const st = typeof inv.status === 'string' ? STATUS_VI[inv.status] || inv.status : '—'
      const due = typeof inv.dueDate === 'string' ? fmtDate(inv.dueDate) : '—'
      const month = typeof inv.invoiceMonth === 'string' ? fmtDate(inv.invoiceMonth) : '—'
      const amt = typeof inv.totalAmount === 'string' ? fmtMoney(inv.totalAmount) : String(inv.totalAmount ?? '—')
      const code = typeof inv.studentCode === 'string' ? inv.studentCode : '—'
      const name = typeof inv.studentName === 'string' ? inv.studentName : '—'
      const room = inv.room != null ? String(inv.room) : '—'
      return `| ${code} | ${name} | ${room} | ${month} | ${amt} | ${due} | ${st} |`
    })
    return (
      '### Hóa đơn chưa xử lý (tóm tắt)\n\n' +
      '| Mã SV | Họ tên | Phòng | Kỳ HĐ | Số tiền | Hạn | Trạng thái |\n' +
      '| --- | --- | --- | --- | --- | --- | --- |\n' +
      lines.join('\n')
    )
  }

  return '_Không có dữ liệu thanh toán phù hợp._'
}

function formatSchedule(payload: Record<string, unknown>): string {
  const win = payload.window as { from?: string; to?: string } | undefined
  const from = win?.from ? fmtDate(win.from) : '—'
  const to = win?.to ? fmtDate(win.to) : '—'
  const appointments = asRecordArray(payload.appointments)

  if (appointments.length === 0) {
    return `Trong khoảng **${from}** → **${to}**, không có lịch hẹn nào ở trạng thái *đã lên lịch*.`
  }

  const blocks = appointments.map((a) => {
    const when = typeof a.scheduledAt === 'string' ? fmtDateTime(a.scheduledAt) : '—'
    const room = a.room != null ? String(a.room) : '—'
    const loc = typeof a.location === 'string' && a.location ? a.location : '—'
    const notes = typeof a.notes === 'string' && a.notes ? a.notes : ''
    const regs = asRecordArray(a.registrants)
    const regLine =
      regs.length === 0
        ? '_Chưa có danh sách đăng ký._'
        : regs
            .map(
              (r) =>
                `- ${typeof r.studentName === 'string' ? r.studentName : '—'} (${typeof r.studentCode === 'string' ? r.studentCode : '—'})`
            )
            .join('\n')
    return `#### ${when} · ${room} · ${loc}\n${notes ? notes + '\n\n' : ''}${regLine}`
  })

  return `### Lịch hẹn (${from} – ${to})\n\n${blocks.join('\n\n')}`
}

function formatRoom(payload: Record<string, unknown>): string {
  const scope = payload.scope

  if (scope === 'self' && payload.vacancyStudentHint === true) {
    return typeof payload.message === 'string'
      ? payload.message
      : 'Số phòng trống do ban quản lý theo dõi — vui lòng xem **Đăng ký phòng** hoặc liên hệ KTX.'
  }

  if (scope === 'self') {
    if (payload.activeStay === null && !payload.studentCode) {
      return 'Không tìm thấy hồ sơ sinh viên gắn với tài khoản.'
    }
    const code = typeof payload.studentCode === 'string' ? payload.studentCode : ''
    const name = typeof payload.fullName === 'string' ? payload.fullName : ''
    const head =
      code || name ? `**${name || 'Sinh viên'}** (${code || '—'})\n\n` : ''

    if (payload.activeStay === null) {
      return `${head}Hiện **không** có hợp đồng lưu trú đang hiệu lực.`
    }

    const stay = payload.activeStay as Record<string, unknown>
    const num = typeof stay.roomNumber === 'string' ? stay.roomNumber : String(stay.roomNumber ?? '—')
    const b = typeof stay.building === 'string' ? stay.building : '—'
    const rt = typeof stay.roomType === 'string' ? stay.roomType : '—'
    const st = typeof stay.contractStatus === 'string' ? stay.contractStatus : '—'
    return `${head}### Phòng đang ở\n\n- **Phòng:** ${num} (${b})\n- **Loại phòng:** ${rt}\n- **Hợp đồng:** ${st}`
  }

  if (scope === 'organization' && payload.kind === 'recent_contract') {
    if (payload.empty === true) {
      return '**Không có** hợp đồng trạng thái **active** nào trong hệ thống (hoặc chưa có dữ liệu).'
    }
    const note = typeof payload.note === 'string' ? `_${payload.note}_\n\n` : ''
    const stu = (payload.student || {}) as Record<string, unknown>
    const con = (payload.contract || {}) as Record<string, unknown>
    const room = (payload.room || {}) as Record<string, unknown>

    const parts: string[] = [note + '### Sinh viên — hợp đồng active mới nhất (theo ngày bắt đầu)\n']

    const push = (label: string, v: unknown) => {
      if (v === null || v === undefined) return
      if (typeof v === 'string' && v.trim() === '') return
      if (typeof v === 'object' && !Array.isArray(v)) {
        parts.push(`- **${label}:** \`${JSON.stringify(v)}\``)
        return
      }
      parts.push(`- **${label}:** ${String(v)}`)
    }

    push('Mã SV', stu.studentCode)
    push('Họ tên', stu.fullName)
    push('Email', stu.email)
    push('Điện thoại', stu.phone)
    push('CCCD/CMND', stu.idCardNumber)
    push('Ngày sinh', typeof stu.dateOfBirth === 'string' ? fmtDate(stu.dateOfBirth) : stu.dateOfBirth)
    push('Giới tính', stu.gender)
    push('Quê quán', stu.hometown)
    push('Địa chỉ', stu.address)
    push('Khoa/ngành', stu.faculty)
    push('Khóa/năm học', stu.academicYear)
    push('Nhóm ưu tiên', stu.priorityGroup)
    if (stu.emergencyContact != null) {
      push('Liên hệ khẩn cấp', stu.emergencyContact)
    }

    parts.push('\n#### Hợp đồng')
    push('Ngày bắt đầu', typeof con.startDate === 'string' ? fmtDate(con.startDate) : con.startDate)
    push('Ngày kết thúc', con.endDate ? fmtDate(String(con.endDate)) : null)
    push('Giá thuê/tháng', con.monthlyRent)
    push('Tiền cọc', con.depositAmount)
    push('Trạng thái HĐ', con.status)

    parts.push('\n#### Phòng')
    push('Số phòng', room.roomNumber)
    push('Tòa', room.building)
    push('Tầng', room.floor)
    push('Trạng thái phòng', room.roomStatus)
    push('Loại phòng', room.roomTypeName)
    push('Sức chứa', room.capacity)

    return parts.join('\n')
  }

  if (scope === 'organization' && payload.kind === 'vacancy') {
    const sum = payload.summary as Record<string, unknown> | undefined
    const bf =
      payload.buildingFilter != null && String(payload.buildingFilter).length > 0
        ? ` (lọc tòa **${payload.buildingFilter}**)`
        : ''
    const totalListed = typeof sum?.totalRoomsListed === 'number' ? sum.totalRoomsListed : '—'
    const fully = typeof sum?.fullyVacantRooms === 'number' ? sum.fullyVacantRooms : '—'
    const withBed = typeof sum?.roomsWithAtLeastOneBed === 'number' ? sum.roomsWithAtLeastOneBed : '—'
    const freeBeds = typeof sum?.totalFreeBeds === 'number' ? sum.totalFreeBeds : '—'
    const asOf = typeof payload.asOf === 'string' ? fmtDateTime(payload.asOf) : '—'
    const roomRows = asRecordArray(payload.rooms)
    const lines = roomRows.map((r) => {
      const num = typeof r.roomNumber === 'string' ? r.roomNumber : '—'
      const b = typeof r.building === 'string' ? r.building : '—'
      const fb = typeof r.freeBeds === 'number' ? r.freeBeds : '—'
      const occ = typeof r.currentOccupancy === 'number' ? r.currentOccupancy : '—'
      const cap = typeof r.capacity === 'number' ? r.capacity : '—'
      const st = typeof r.status === 'string' ? r.status : '—'
      return `| ${num} | ${b} | ${occ}/${cap} | ${fb} | ${st} |`
    })
    const table =
      lines.length > 0
        ? '\n\n| Phòng | Tòa | Đang ở / Sức chứa | Chỗ trống | Trạng thái phòng |\n| --- | --- | --- | --- | --- |\n' +
          lines.join('\n')
        : '\n\n_Không có phòng nào còn chỗ (theo bộ lọc)._'
    return (
      `### Tình trạng chỗ ở (dữ liệu hệ thống)${bf}\n\n` +
      `- **Cập nhật:** ${asOf}\n` +
      `- **Tổng phòng xét:** ${totalListed}\n` +
      `- **Phòng không có ai ở (0 người):** ${fully}\n` +
      `- **Phòng còn ít nhất 1 chỗ:** ${withBed}\n` +
      `- **Tổng chỗ trống (giường):** ${freeBeds}\n` +
      '_Phòng trạng thái **maintenance** không tính vào chỗ có thể xếp thêm._' +
      table
    )
  }

  if (scope === 'organization') {
    const rows = asRecordArray(payload.activeContracts)
    if (rows.length === 0) {
      return '**Không có** hợp đồng đang hiệu lực nào khớp bộ lọc (hoặc danh sách trống).'
    }
    const lines = rows.map((c) => {
      const code = typeof c.studentCode === 'string' ? c.studentCode : '—'
      const name = typeof c.studentName === 'string' ? c.studentName : '—'
      const num = typeof c.roomNumber === 'string' ? c.roomNumber : String(c.roomNumber ?? '—')
      const b = typeof c.building === 'string' ? c.building : '—'
      return `| ${code} | ${name} | ${num} | ${b} |`
    })
    return (
      '### Lưu trú theo phòng (hợp đồng đang hiệu lực)\n\n' +
      '| Mã SV | Họ tên | Phòng | Tòa |\n' +
      '| --- | --- | --- | --- |\n' +
      lines.join('\n')
    )
  }

  return '_Không có dữ liệu phòng phù hợp._'
}

function formatStudentOverview(payload: Record<string, unknown>): string {
  if (payload.error === 'role_not_student') {
    return typeof payload.message === 'string'
      ? payload.message
      : 'Tổng hợp này chỉ dành cho tài khoản sinh viên.'
  }

  if (payload.kind !== 'student_overview') {
    return '_Dữ liệu tổng hợp không hợp lệ._'
  }

  if (payload.scope === 'self' && payload.student === false) {
    return 'Tài khoản chưa được gắn hồ sơ sinh viên — không tra cứu được đơn đăng ký / hợp đồng / hóa đơn.'
  }

  const code = typeof payload.studentCode === 'string' ? payload.studentCode : ''
  const name = typeof payload.fullName === 'string' ? payload.fullName : ''
  const head = `### Tổng hợp thông tin\n\n**${name || 'Sinh viên'}** · **Mã SV:** ${code || '—'}\n\n`

  const regs = asRecordArray(payload.registrations)
  let regBlock: string
  if (regs.length === 0) {
    regBlock = '#### Đơn đăng ký phòng\n\n_Không có đơn trong dữ liệu._\n\n'
  } else {
    const lines = regs.map((r) => {
      const st = typeof r.statusVi === 'string' ? r.statusVi : String(r.status ?? '—')
      const created =
        typeof r.createdAt === 'string' ? fmtDate(r.createdAt) : '—'
      const want =
        typeof r.desiredStartDate === 'string' ? fmtDate(r.desiredStartDate) : '—'
      const rt = r.preferredRoomType != null ? String(r.preferredRoomType) : '—'
      const pref = r.preferredRoom != null ? String(r.preferredRoom) : '—'
      const asg = r.assignedRoom != null ? String(r.assignedRoom) : '—'
      return `| ${created} | ${st} | ${want} | ${rt} | ${pref} | ${asg} |`
    })
    regBlock =
      '#### Đơn đăng ký phòng (mới nhất)\n\n' +
      '| Tạo lúc | Trạng thái | Mong muốn vào | Loại phòng | Phòng mong muốn | Phòng đã gán |\n' +
      '| --- | --- | --- | --- | --- | --- |\n' +
      lines.join('\n') +
      '\n\n'
  }

  const apts = asRecordArray(payload.appointments)
  let aptBlock: string
  if (apts.length === 0) {
    aptBlock =
      '#### Lịch hẹn xem phòng (gần đây / sắp tới)\n\n_Không có lịch trong khoảng 7 ngày qua → 60 ngày tới._\n\n'
  } else {
    const lines = apts.map((a) => {
      const when =
        typeof a.scheduledAt === 'string' ? fmtDateTime(a.scheduledAt) : '—'
      const room = a.room != null ? String(a.room) : '—'
      const loc = typeof a.location === 'string' && a.location ? a.location : '—'
      const st =
        typeof a.appointmentStatus === 'string' ? a.appointmentStatus : '—'
      const it = typeof a.itemStatus === 'string' ? a.itemStatus : '—'
      return `- **${when}** · ${room} · ${loc} · lịch: *${st}* · bạn: *${it}*`
    })
    aptBlock =
      '#### Lịch hẹn xem phòng (gần đây / sắp tới)\n\n' + lines.join('\n') + '\n\n'
  }

  const ac = payload.activeContract as Record<string, unknown> | null | undefined
  let contractBlock: string
  if (!ac || typeof ac !== 'object') {
    contractBlock =
      '#### Hợp đồng hiện tại\n\n**Không** có hợp đồng lưu trú đang hiệu lực.\n\n'
  } else {
    const start =
      typeof ac.startDate === 'string' ? fmtDate(ac.startDate) : '—'
    const end =
      ac.endDate != null && typeof ac.endDate === 'string'
        ? fmtDate(ac.endDate)
        : '_(chưa ghi)_'
    const rent =
      typeof ac.monthlyRent === 'string' ? fmtMoney(ac.monthlyRent) : '—'
    const room = ac.room != null ? String(ac.room) : '—'
    const rt = ac.roomType != null ? String(ac.roomType) : '—'
    contractBlock =
      '#### Hợp đồng hiện tại\n\n' +
      `- **Phòng:** ${room}\n` +
      `- **Loại phòng:** ${rt}\n` +
      `- **Bắt đầu:** ${start} · **Kết thúc:** ${end}\n` +
      `- **Giá thuê/tháng:** ${rent}\n\n`
  }

  const invs = asRecordArray(payload.invoices)
  let invBlock: string
  if (invs.length === 0) {
    invBlock = '#### Hóa đơn gần nhất\n\n_Không có hóa đơn._\n\n'
  } else {
    const lines = invs.map((inv) => {
      const st = typeof inv.status === 'string' ? STATUS_VI[inv.status] || inv.status : '—'
      const month =
        typeof inv.invoiceMonth === 'string' ? fmtDate(inv.invoiceMonth) : '—'
      const due = typeof inv.dueDate === 'string' ? fmtDate(inv.dueDate) : '—'
      const amt =
        typeof inv.totalAmount === 'string' ? fmtMoney(inv.totalAmount) : String(inv.totalAmount ?? '—')
      const room = inv.room != null ? String(inv.room) : '—'
      const paid =
        inv.paidAt != null && typeof inv.paidAt === 'string'
          ? fmtDate(inv.paidAt)
          : '—'
      return `| ${month} | ${amt} | ${st} | hạn ${due} | TT ${paid} | ${room} |`
    })
    invBlock =
      '#### Hóa đơn gần nhất (mọi trạng thái)\n\n' +
      '| Kỳ HĐ | Số tiền | Trạng thái | Hạn | Ngày TT | Phòng |\n' +
      '| --- | --- | --- | --- | --- | --- |\n' +
      lines.join('\n') +
      '\n\n'
  }

  const ren = payload.renewal as Record<string, unknown> | undefined
  const hint =
    ren && typeof ren.hintVi === 'string'
      ? ren.hintVi
      : '_Không có thông tin gia hạn._'
  const renewalBlock = '#### Gia hạn hợp đồng\n\n' + hint + '\n'

  return head + regBlock + aptBlock + contractBlock + invBlock + renewalBlock
}

/**
 * Build Vietnamese Markdown from structured DB payload (no LLM — fast, deterministic).
 */
export function buildDataIntentMarkdown(
  intent: ChatIntent,
  payload: Record<string, unknown>
): string {
  switch (intent) {
    case 'PAYMENT_STATUS':
      return formatPayment(payload)
    case 'SCHEDULE':
      return formatSchedule(payload)
    case 'ROOM_INFO':
      return formatRoom(payload)
    case 'STUDENT_OVERVIEW':
      return formatStudentOverview(payload)
    default:
      return '_Không hỗ trợ định dạng dữ liệu cho ý định này._'
  }
}
