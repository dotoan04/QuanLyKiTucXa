import { auditLogService } from '../audit-log/audit-log.service'
import {
  chatAgentConfig,
  chatAgentToolPolicyPrompt,
  chatPromptQuestionMaxChars,
  ensureAssistantReplyText,
  llmConfig,
  logger,
  ragConfig,
  responseTokenBudget,
  rolePromptExtensions,
  type UserRole,
} from './ai-config'
import { extractSearchKnowledgeSources, executeChatTool, type ChatToolContext } from './chatbot-tools.executor'
import {
  getAllowedToolsForRole,
  getOpenRouterToolDefinitions,
  isChatToolName,
  type ChatToolName,
} from './chatbot-tools.registry'
import {
  openRouterChatComplete,
  openRouterChatCompleteWithTools,
  type ChatMessage,
} from './openrouter-llm.service'
import { ragPipelineService } from './rag-pipeline.service'

const POSTGRES_TOOLS = new Set<ChatToolName>([
  'get_student_payment_status',
  'get_student_room_contract',
  'get_student_overview',
  'get_appointment_schedule',
  'get_organization_unpaid_invoices',
  'get_organization_active_rooms',
])

export interface ChatAgentResult {
  answer: string
  sources: Array<{ id: string; title: string; similarity: number }>
  contextUsed: boolean
  tokens: number
  toolsUsed: string[]
}

class ChatbotAgentService {
  private async auditTool(
    userId: string,
    sessionId: string,
    toolName: string
  ): Promise<void> {
    if (!POSTGRES_TOOLS.has(toolName as ChatToolName)) return
    try {
      await auditLogService.create({
        userId,
        action: 'chatbot_agent_tool',
        entity: 'chat_session',
        entityId: sessionId,
        details: { tool: toolName, source: 'agent' },
      })
    } catch (e) {
      logger.warn('chatbot agent audit failed', e)
    }
  }

  private buildSystemPrompt(
    userRole: UserRole | undefined,
    studentContextBlock: string
  ): string {
    let s = ragConfig.systemPrompt + chatAgentToolPolicyPrompt
    if (userRole && rolePromptExtensions[userRole]) {
      s += `\n\n${rolePromptExtensions[userRole]}`
    }
    if (studentContextBlock) {
      s += `\n\n### Profile (reference only; may be incomplete)\n${studentContextBlock}\n`
    }
    return s
  }

  /**
   * Agentic RAG: LLM chọn tool search_knowledge (Chroma) hoặc đọc PostgreSQL qua tool — RBAC trong executor.
   */
  async run(
    userQuestion: string,
    userId: string,
    sessionId: string,
    userRole: UserRole | undefined
  ): Promise<ChatAgentResult> {
    const q = userQuestion.slice(0, chatPromptQuestionMaxChars)
    const allowed = getAllowedToolsForRole(userRole)
    const toolsUsed: string[] = []
    let totalTokens = 0
    const mergedSources: Array<{ id: string; title: string; similarity: number }> = []

    const studentCtx = await ragPipelineService.getStudentContext(userId)
    const studentBlock = studentCtx
      ? await ragPipelineService.buildStudentContextString(studentCtx)
      : ''

    const system = this.buildSystemPrompt(userRole, studentBlock)

    if (allowed.length === 0) {
      logger.warn('chat agent: no tools for role', { userRole })
      const { text, tokens } = await openRouterChatComplete({
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content:
              q +
              '\n\n(Lưu ý: tài khoản không có vai trò hợp lệ để gọi công cụ dữ liệu; trả lời chỉ với kiến thức chung KTX nếu có thể, hoặc yêu cầu đăng nhập lại.)',
          },
        ],
        maxTokens: responseTokenBudget.policy,
        temperature: llmConfig.temperature,
        model: chatAgentConfig.model,
      })
      totalTokens += tokens
      return {
        answer: ensureAssistantReplyText(text),
        sources: [],
        contextUsed: false,
        tokens: totalTokens,
        toolsUsed: [],
      }
    }

    const toolDefs = getOpenRouterToolDefinitions(allowed)
    const ctx: ChatToolContext = {
      userId,
      userRole: userRole ?? '',
      userQuestion: q,
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: system },
      { role: 'user', content: q },
    ]

    const maxRounds = chatAgentConfig.maxToolRounds
    let round = 0

    while (round < maxRounds) {
      const forceNoTools = round >= maxRounds - 1
      const { message, tokens } = await openRouterChatCompleteWithTools({
        messages,
        tools: toolDefs,
        toolChoice: forceNoTools ? 'none' : 'auto',
        maxTokens: forceNoTools ? responseTokenBudget.policy : responseTokenBudget.agentToolRound,
        temperature: forceNoTools ? llmConfig.temperature : 0.3,
        model: chatAgentConfig.model,
      })
      totalTokens += tokens

      const calls = message.tool_calls
      if (calls && calls.length > 0 && !forceNoTools) {
        messages.push({ ...message, content: message.content ?? '' })
        for (const tc of calls) {
          const name = tc.function?.name
          if (!name || !isChatToolName(name)) {
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify({
                error: 'invalid_tool',
                message: name || 'missing name',
              }),
            })
            continue
          }
          if (!allowed.includes(name)) {
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify({ error: 'forbidden', tool: name }),
            })
            continue
          }

          let args: unknown = {}
          try {
            args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {}
          } catch {
            args = {}
          }

          await this.auditTool(userId, sessionId, name)
          toolsUsed.push(name)

          const resultStr = await executeChatTool(name, args, ctx)
          if (name === 'search_knowledge') {
            mergedSources.push(...extractSearchKnowledgeSources(resultStr))
          }
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: `### ToolResult (${name})\n${resultStr}`,
          })
        }
        round++
        continue
      }

      const text = message.content?.trim() ?? ''
      if (text) {
        return {
          answer: ensureAssistantReplyText(text),
          sources: this.dedupeSources(mergedSources),
          contextUsed: mergedSources.length > 0,
          tokens: totalTokens,
          toolsUsed,
        }
      }

      round++
    }

    return {
      answer: ensureAssistantReplyText(
        'Không tạo được câu trả lời sau các bước tra cứu. Vui lòng thử lại hoặc mở mục tương ứng trên cổng thông tin.'
      ),
      sources: this.dedupeSources(mergedSources),
      contextUsed: mergedSources.length > 0,
      tokens: totalTokens,
      toolsUsed,
    }
  }

  private dedupeSources(
    arr: Array<{ id: string; title: string; similarity: number }>
  ): Array<{ id: string; title: string; similarity: number }> {
    const seen = new Set<string>()
    const out: Array<{ id: string; title: string; similarity: number }> = []
    for (const s of arr) {
      if (seen.has(s.id)) continue
      seen.add(s.id)
      out.push(s)
    }
    return out
  }
}

export const chatbotAgentService = new ChatbotAgentService()
