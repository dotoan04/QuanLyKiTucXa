export const CHAT_INTENTS = [
  'POLICY',
  'PAYMENT_STATUS',
  'SCHEDULE',
  'ROOM_INFO',
  /** Sinh viên: gói đơn đăng ký + lịch hẹn + HĐ + hóa đơn + gia hạn (tránh chỉ trả lời hóa đơn chưa trả). */
  'STUDENT_OVERVIEW',
  'GENERAL',
] as const

export type ChatIntent = (typeof CHAT_INTENTS)[number]

export function isChatIntent(s: string): s is ChatIntent {
  return (CHAT_INTENTS as readonly string[]).includes(s)
}

/** Normalize model output to a single intent token. */
export function parseChatIntent(raw: string, fallback: ChatIntent): ChatIntent {
  const first = raw.trim().split(/\r?\n/)[0] ?? ''
  const token = first
    .split(/\s+/)[0]
    ?.replace(/[^A-Za-z_]/g, '')
    .toUpperCase()

  if (token && isChatIntent(token)) {
    return token
  }

  const upper = raw.toUpperCase()
  for (const intent of CHAT_INTENTS) {
    const re = new RegExp(`\\b${intent}\\b`)
    if (re.test(upper)) {
      return intent
    }
  }

  return fallback
}

/** Rule-based fallback when API key missing or parse fails. */
export function heuristicChatIntent(question: string): ChatIntent {
  const q = question.toLowerCase()

  // Policy / procedure before payment keywords ("quy trình thanh toán" → POLICY, not DB)
  if (/nội quy|quy định|quy trình|thủ tục|đăng ký phòng|policy|quy chế/i.test(q)) {
    return 'POLICY'
  }
  if (
    /chưa đóng|công nợ|hóa đơn|thanh toán|tiền phòng|phí phòng|unpaid|invoice/i.test(q)
  ) {
    return 'PAYMENT_STATUS'
  }
  if (/lịch hẹn|cuộc hẹn|appointment|lịch kiểm|hẹn sv/i.test(q)) {
    return 'SCHEDULE'
  }

  const ktxContext = /kí\s*túc\s*xá|ký\s*túc\s*xá|\bktx\b/i
  /** Hỏi danh tính / số lượng người đang lưu trú (quản lý tra cứu), không cần từ "phòng 101". */
  const whoInDorm =
    /những\s+ai|có\s+những\s+ai|có\s+ai\b|ai\s+đang|ai\s+nào|sinh\s+viên\s+nào|bạn\s+nào\s+đang|bao\s+nhiêu\s+sinh\s+viên|bao\s+nhiêu\s+người\s+đang|danh\s+sách\s+sinh\s+viên|danh\s+sách\s+người\s+đang|những\s+sinh\s+viên\s+đang|đang\s+có\s+(mấy|bao\s+nhiêu)\s+người/i.test(
      q
    )

  /** Câu hỏi số liệu phòng trống / chỗ còn (cần DB, không embed được). */
  const asksVacancyOrRoomCount =
    /phòng\s+trống|còn\s+trống|chỗ\s+trống|giường\s+trống|phòng\s+nào\s+trống|bao\s+nhiêu\s+phòng|số\s+phòng\s+trống|còn\s+bao\s+nhiêu\s+phòng/i.test(
      q
    )

  if (
    /ai\s+đang\s+ở|sinh\s+viên.*phòng|phòng\s*[a-z0-9]+|danh\s+sách.*phòng|occupancy/i.test(q) ||
    (ktxContext.test(q) && whoInDorm) ||
    (ktxContext.test(q) && asksVacancyOrRoomCount)
  ) {
    return 'ROOM_INFO'
  }

  return 'GENERAL'
}

/** Các chủ đề “hồ sơ cá nhân SV” — đếm để phát hiện câu hỏi gói (≥2 → STUDENT_OVERVIEW). */
const STUDENT_OVERVIEW_TOPIC_RES: RegExp[] = [
  /\bđơn\s+đăng\s+k(?:ý|í|y)\b|\bđăng\s+k(?:ý|í|y)\s+phòng\b/i,
  /\blịch\s+hẹn\b|\bhẹn\s+xem\s+phòng\b|\bappointment\b/i,
  /\bhợp\s+đồng\b|\bcontract\b/i,
  /\bhóa\s+đơn\b|\binvoice\b/i,
  /\bgia\s+hạn\b|\brewal/i,
]

export function countStudentOverviewTopics(question: string): number {
  return STUDENT_OVERVIEW_TOPIC_RES.filter((re) => re.test(question)).length
}

/** Chỉ sinh viên; câu hỏi gồm nhiều chủ đề (vd. hóa đơn + hợp đồng + gia hạn). */
export function shouldRouteStudentOverview(question: string, userRole?: string): boolean {
  if ((userRole || '').toLowerCase().trim() !== 'student') return false
  return countStudentOverviewTopics(question) >= 2
}

/**
 * Chỉ trả về intent cần truy vấn Prisma khi heuristic khớp rõ (không gọi LLM phân loại).
 * POLICY / GENERAL → null → luồng RAG + knowledge base.
 */
export function heuristicDbIntent(
  question: string,
  userRole?: string
): Extract<
  ChatIntent,
  'PAYMENT_STATUS' | 'SCHEDULE' | 'ROOM_INFO' | 'STUDENT_OVERVIEW'
> | null {
  if (shouldRouteStudentOverview(question, userRole)) {
    return 'STUDENT_OVERVIEW'
  }
  const h = heuristicChatIntent(question)
  if (h === 'PAYMENT_STATUS' || h === 'SCHEDULE' || h === 'ROOM_INFO') return h
  return null
}
