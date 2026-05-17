import type { UserRole } from './ai-config'
import type { ChatIntent } from './chatbot-intents'

type RolePermission = ChatIntent[] | '*'

/** Backend-only matrix; intent from LLM never bypasses this. */
export const CHAT_INTENT_PERMISSIONS: Record<UserRole, RolePermission> = {
  student: ['POLICY', 'GENERAL', 'PAYMENT_STATUS', 'ROOM_INFO', 'STUDENT_OVERVIEW'],
  accountant: ['POLICY', 'PAYMENT_STATUS', 'GENERAL', 'SCHEDULE'],
  staff: ['POLICY', 'PAYMENT_STATUS', 'SCHEDULE', 'ROOM_INFO', 'GENERAL'],
  technician: ['POLICY', 'SCHEDULE', 'GENERAL'],
  director: ['POLICY', 'PAYMENT_STATUS', 'SCHEDULE', 'ROOM_INFO', 'GENERAL'],
  admin: '*',
}

const ROLE_ORDER: UserRole[] = [
  'student',
  'staff',
  'accountant',
  'technician',
  'director',
  'admin',
]

function normalizeRole(role: string | undefined): UserRole | null {
  if (!role) return null
  const r = role.toLowerCase().trim() as UserRole
  return ROLE_ORDER.includes(r) ? r : null
}

export function canAccessChatIntent(
  role: string | undefined,
  intent: ChatIntent
): boolean {
  const r = normalizeRole(role)
  if (!r) return false
  const perm = CHAT_INTENT_PERMISSIONS[r]
  if (perm === '*') return true
  return perm.includes(intent)
}

export const CHAT_ACCESS_DENIED_VI =
  'Bạn không có quyền truy cập loại thông tin này. Vui lòng liên hệ bộ phận phụ trách nếu cần hỗ trợ.'
