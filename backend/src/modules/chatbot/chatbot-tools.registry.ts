import type { UserRole } from './ai-config'

/** Tên tool cố định — LLM chỉ được chọn trong tập này; server kiểm tra RBAC. */
export const CHAT_TOOL_NAMES = [
  'search_knowledge',
  'get_student_payment_status',
  'get_student_room_contract',
  'get_student_overview',
  'get_appointment_schedule',
  'get_organization_unpaid_invoices',
  'get_organization_active_rooms',
  'get_organization_contracts',
  'get_organization_revenue_summary',
  'get_organization_renewals_expiring',
  'get_organization_incidents',
  'get_organization_violations',
] as const

export type ChatToolName = (typeof CHAT_TOOL_NAMES)[number]

export function isChatToolName(s: string): s is ChatToolName {
  return (CHAT_TOOL_NAMES as readonly string[]).includes(s)
}

/** Role → danh sách tool được phép gọi (Prisma/Chroma handlers ép scope). */
export const CHAT_TOOLS_BY_ROLE: Record<UserRole, readonly ChatToolName[]> = {
  student: [
    'search_knowledge',
    'get_student_payment_status',
    'get_student_room_contract',
    'get_student_overview',
  ],
  staff: [
    'search_knowledge',
    'get_appointment_schedule',
    'get_organization_unpaid_invoices',
    'get_organization_active_rooms',
    'get_organization_contracts',
    'get_organization_renewals_expiring',
    'get_organization_incidents',
    'get_organization_violations',
  ],
  accountant: [
    'search_knowledge',
    'get_appointment_schedule',
    'get_organization_unpaid_invoices',
    'get_organization_contracts',
    'get_organization_revenue_summary',
    'get_organization_renewals_expiring',
  ],
  technician: ['search_knowledge', 'get_appointment_schedule', 'get_organization_incidents'],
  director: [
    'search_knowledge',
    'get_appointment_schedule',
    'get_organization_unpaid_invoices',
    'get_organization_active_rooms',
    'get_organization_contracts',
    'get_organization_revenue_summary',
    'get_organization_renewals_expiring',
    'get_organization_incidents',
    'get_organization_violations',
  ],
  admin: [...CHAT_TOOL_NAMES],
}

const ROLE_ORDER: UserRole[] = [
  'student',
  'staff',
  'accountant',
  'technician',
  'director',
  'admin',
]

export function normalizeUserRole(role: string | undefined): UserRole | null {
  if (!role) return null
  const r = role.toLowerCase().trim() as UserRole
  return ROLE_ORDER.includes(r) ? r : null
}

export function getAllowedToolsForRole(role: string | undefined): ChatToolName[] {
  const r = normalizeUserRole(role)
  if (!r) return []
  return [...CHAT_TOOLS_BY_ROLE[r]]
}

export function canUseChatTool(role: string | undefined, toolName: string): boolean {
  if (!isChatToolName(toolName)) return false
  return getAllowedToolsForRole(role).includes(toolName)
}

/** Định nghĩa OpenAI-compatible `tools` (function). */
export function getOpenRouterToolDefinitions(
  allowed: readonly ChatToolName[]
): Array<{
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}> {
  const all: Record<
    ChatToolName,
    { description: string; parameters: Record<string, unknown> }
  > = {
    search_knowledge: {
      description:
        'Tìm trong kho tri thức KTX đã index (vector DB): nội quy, quy trình, FAQ, hướng dẫn. Dùng khi hỏi về thủ tục, quy định, cách làm chung — không thay thế số liệu cá nhân (hóa đơn/HĐ) nếu user hỏi "của tôi".',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Câu tìm kiếm ngắn, tiếng Việt hoặc Anh, diễn đạt ý người dùng.',
          },
        },
        required: ['query'],
      },
    },
    get_student_payment_status: {
      description:
        'Lấy hóa đơn chưa thanh toán / quá hạn / một phần của **chính** sinh viên đang đăng nhập (PostgreSQL).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    get_student_room_contract: {
      description:
        'Lấy phòng và hợp đồng đang hiệu lực của **chính** sinh viên (PostgreSQL).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    get_student_overview: {
      description:
        'Tổng hợp đơn đăng ký, lịch hẹn gần đây, HĐ, hóa đơn gần nhất, gợi ý gia hạn — chỉ cho **chính** sinh viên.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    get_appointment_schedule: {
      description:
        'Lịch hẹn xem phòng trong cửa sổ hệ thống (theo dữ liệu vận hành). Dành cho nhân sự được phép.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    get_organization_unpaid_invoices: {
      description:
        'Danh sách hóa đơn chưa xử lý toàn hệ thống (hoặc theo bộ lọc tháng trong câu hỏi người dùng). Chỉ role kế toán/quản lý/giám đốc/admin.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    get_organization_active_rooms: {
      description:
        'Lưu trú theo hợp đồng active (danh sách phòng–sinh viên) hoặc snapshot chỗ trống nếu câu hỏi về phòng trống. Role quản lý/giám đốc/admin.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    get_organization_contracts: {
      description:
        'Danh sách hợp đồng (trạng thái, sinh viên, phòng, ngày bắt đầu/kết thúc, tiền thuê, cọc, còn bao nhiêu ngày hết hạn). Lọc theo trạng thái (đang hiệu lực/hết hạn/chấm dứt/chờ), tòa nhà, mã sinh viên theo câu hỏi. Dùng khi hỏi "các hợp đồng", "hợp đồng đang hiệu lực", "hợp đồng của SV...". Role nhân viên/kế toán/giám đốc/admin.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    get_organization_revenue_summary: {
      description:
        'Tổng hợp công nợ chưa thu toàn hệ thống (tổng tiền chưa thu, số lượng hóa đơn unpaid/overdue/partial), có thể lọc theo tháng. Dùng khi hỏi "tổng công nợ", "còn bao nhiêu tiền chưa thu", "tháng X bao nhiêu chưa đóng". Role kế toán/giám đốc/admin.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    get_organization_renewals_expiring: {
      description:
        'Hợp đồng đang hiệu lực sắp hết hạn trong cửa sổ N ngày (mặc định 30). Ứng viên cần gia hạn. Dùng khi hỏi "hợp đồng sắp hết hạn", "trong 60 ngày tới". Role nhân viên/kế toán/giám đốc/admin.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    get_organization_incidents: {
      description:
        'Danh sách sự cố (cơ sở vật chất, điện, nước, mạng, an ninh...) với trạng thái/ưu tiên/loại/phòng. Dùng khi hỏi "sự cố đang xử lý", "sự cố điện", "sự cố khẩn cấp". Role nhân viên/kỹ thuật/giám đốc/admin.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
    get_organization_violations: {
      description:
        'Danh sách vi phạm nội quy (sinh viên, loại, mức phạt, tiền phạt, trạng thái). Dùng khi hỏi "vi phạm mới", "vi phạm chưa xử lý", "vi phạm của SV...". Role nhân viên/giám đốc/admin.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  }

  return allowed.map((name) => ({
    type: 'function' as const,
    function: {
      name,
      description: all[name].description,
      parameters: all[name].parameters,
    },
  }))
}
