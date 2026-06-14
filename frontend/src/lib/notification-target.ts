/**
 * Map một thông báo (type / referenceType) → route trang chức năng tương ứng,
 * theo khu vực portal hiện tại của người dùng (/student, /staff, /admin, /director).
 * Trả null khi là thông báo hệ thống hoặc khu vực không có trang tương ứng.
 */

export interface NotifLike {
  type?: string | null
  referenceType?: string | null
  referenceId?: string | null
}

/** Lấy prefix khu vực từ pathname, vd. pathname '/staff/meter-readings' → '/staff'. */
export function detectArea(pathname: string | null | undefined): string | null {
  if (!pathname) return null
  const m = pathname.match(/^\/(student|staff|admin|director)(?:\/|$)/)
  return m ? `/${m[1]}` : null
}

function page(area: string, routes: Partial<Record<'student' | 'staff' | 'admin' | 'director', string>>): string | null {
  const key = area.slice(1) as 'student' | 'staff' | 'admin' | 'director'
  const suffix = routes[key]
  return suffix ? `${area}/${suffix}` : null
}

export function getNotificationHref(n: NotifLike, pathname: string | null | undefined): string | null {
  const area = detectArea(pathname)
  if (!area) return null

  const ref = (n.referenceType || '').toLowerCase()
  const type = (n.type || '').toLowerCase()

  // Hóa đơn
  if (ref === 'invoice' || type === 'invoice_due') {
    return page(area, { student: 'invoices', staff: 'invoices', admin: 'invoices' })
  }
  // Sự cố
  if (ref === 'incident' || type === 'incident_update') {
    return page(area, { student: 'incidents', staff: 'incidents', admin: 'incidents' })
  }
  // Chỉ số điện nước: kế toán duyệt (meter_reading_month) vs kỹ thuật ghi lại (meter_reading)
  if (ref === 'meter_reading_month') {
    return page(area, { staff: 'meter-readings/approval', admin: 'meter-readings' })
  }
  if (ref === 'meter_reading') {
    return page(area, { staff: 'meter-readings', admin: 'meter-readings' })
  }
  // Cọc: deposit_submitted → nhân viên duyệt cọc; còn lại → đăng ký
  if (type === 'deposit_submitted') {
    return page(area, { staff: 'deposits', admin: 'registrations' })
  }
  if (type === 'deposit_confirmed' || type === 'deposit_rejected') {
    return page(area, { student: 'registrations', staff: 'registrations', admin: 'registrations' })
  }
  // Duyệt phòng / đăng ký
  if (type === 'room_approved' || ref === 'registration') {
    return page(area, { student: 'registrations', staff: 'registrations', admin: 'registrations' })
  }
  // Hợp đồng
  if (ref === 'contract') {
    return page(area, { student: 'contract', staff: 'contracts', admin: 'contracts' })
  }
  // system / không rõ → không điều hướng
  return null
}
