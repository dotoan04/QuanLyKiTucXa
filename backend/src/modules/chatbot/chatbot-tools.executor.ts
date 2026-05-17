import { knowledgeBaseService } from './knowledge-base.service'
import { chatbotDataService } from './chatbot-data.service'
import { ragConfig, logger } from './ai-config'
import type { ChatToolName } from './chatbot-tools.registry'
import { canUseChatTool, normalizeUserRole } from './chatbot-tools.registry'
import type { ChatIntent } from './chatbot-intents'

const MAX_TOOL_JSON_CHARS = 14_000

export interface ChatToolContext {
  userId: string
  userRole: string
  userQuestion: string
}

function clipJson(obj: unknown): string {
  const s = JSON.stringify(obj)
  if (s.length <= MAX_TOOL_JSON_CHARS) return s
  return s.slice(0, MAX_TOOL_JSON_CHARS) + '…'
}

/**
 * Thực thi một tool sau khi RBAC đã kiểm tra. Trả chuỗi JSON cho role `tool` trong chat completions.
 */
export async function executeChatTool(
  name: ChatToolName,
  rawArgs: unknown,
  ctx: ChatToolContext
): Promise<string> {
  if (!canUseChatTool(ctx.userRole, name)) {
    return clipJson({
      error: 'forbidden',
      message: 'Tool không được phép với vai trò hiện tại.',
    })
  }

  const role = normalizeUserRole(ctx.userRole)
  const roleStr = role ?? ctx.userRole.toLowerCase()

  try {
    switch (name) {
      case 'search_knowledge': {
        const query =
          typeof rawArgs === 'object' &&
          rawArgs !== null &&
          typeof (rawArgs as { query?: unknown }).query === 'string'
            ? String((rawArgs as { query: string }).query).slice(0, 2000)
            : ctx.userQuestion.slice(0, 2000)
        if (!query.trim()) {
          return clipJson({
            source: 'vector_knowledge_base',
            found: false,
            passages: [],
            note: 'Thiếu query — dùng nội dung câu hỏi người dùng làm tìm kiếm.',
          })
        }
        const results = await knowledgeBaseService.search(query, ragConfig.topK)
        return clipJson({
          source: 'vector_knowledge_base',
          found: results.length > 0,
          passages: results.map((r) => ({
            id: r.id,
            title: r.title,
            similarity: Math.round(r.similarity * 1000) / 1000,
            excerpt: r.content.slice(0, 1500),
          })),
        })
      }

      case 'get_student_payment_status': {
        const payload = await chatbotDataService.loadStructuredDataForChat({
          intent: 'PAYMENT_STATUS' as ChatIntent,
          userId: ctx.userId,
          userRole: roleStr,
          question: ctx.userQuestion,
        })
        return clipJson({ source: 'postgresql', domain: 'student_invoices_unpaid', data: payload })
      }

      case 'get_student_room_contract': {
        const payload = await chatbotDataService.loadStructuredDataForChat({
          intent: 'ROOM_INFO' as ChatIntent,
          userId: ctx.userId,
          userRole: roleStr,
          question: ctx.userQuestion,
        })
        return clipJson({ source: 'postgresql', domain: 'student_room_contract', data: payload })
      }

      case 'get_student_overview': {
        const payload = await chatbotDataService.loadStructuredDataForChat({
          intent: 'STUDENT_OVERVIEW' as ChatIntent,
          userId: ctx.userId,
          userRole: roleStr,
          question: ctx.userQuestion,
        })
        return clipJson({ source: 'postgresql', domain: 'student_overview', data: payload })
      }

      case 'get_appointment_schedule': {
        const payload = await chatbotDataService.loadStructuredDataForChat({
          intent: 'SCHEDULE' as ChatIntent,
          userId: ctx.userId,
          userRole: roleStr,
          question: ctx.userQuestion,
        })
        return clipJson({ source: 'postgresql', domain: 'appointments', data: payload })
      }

      case 'get_organization_unpaid_invoices': {
        const payload = await chatbotDataService.loadStructuredDataForChat({
          intent: 'PAYMENT_STATUS' as ChatIntent,
          userId: ctx.userId,
          userRole: roleStr,
          question: ctx.userQuestion,
        })
        return clipJson({ source: 'postgresql', domain: 'organization_unpaid_invoices', data: payload })
      }

      case 'get_organization_active_rooms': {
        const payload = await chatbotDataService.loadStructuredDataForChat({
          intent: 'ROOM_INFO' as ChatIntent,
          userId: ctx.userId,
          userRole: roleStr,
          question: ctx.userQuestion,
        })
        return clipJson({ source: 'postgresql', domain: 'organization_rooms', data: payload })
      }

      default:
        return clipJson({ error: 'unknown_tool', name })
    }
  } catch (e) {
    logger.error('chat tool execution failed', { name, e })
    return clipJson({
      error: 'execution_failed',
      tool: name,
      message: 'Không đọc được dữ liệu. Thử lại hoặc xem trên cổng thông tin.',
    })
  }
}

export function extractSearchKnowledgeSources(
  toolResultJson: string
): Array<{ id: string; title: string; similarity: number }> {
  try {
    const o = JSON.parse(toolResultJson) as {
      source?: string
      passages?: Array<{ id?: string; title?: string; similarity?: number }>
    }
    if (o.source !== 'vector_knowledge_base' || !Array.isArray(o.passages)) return []
    return o.passages
      .filter((p) => p.id && p.title != null)
      .map((p) => ({
        id: String(p.id),
        title: String(p.title),
        similarity: typeof p.similarity === 'number' ? p.similarity : 0,
      }))
  } catch {
    return []
  }
}
