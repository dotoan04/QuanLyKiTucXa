import { logger } from './ai-config'
import {
  buildChatLlmHeaders,
  getChatLlmApiKey,
  getChatLlmBaseUrl,
  getDeepSeekThinkingConfig,
  resolveChatLlmModel,
  resolveChatLlmProvider,
} from './openrouter-http.util'

function ensureKey(): void {
  if (!getChatLlmApiKey()) {
    throw new Error(
      `Chat LLM API key is not set (provider=${resolveChatLlmProvider()}). ` +
        `Set DEEPSEEK_API_KEY (DeepSeek) or OPENROUTER_API_KEY (OpenRouter).`
    )
  }
}

/**
 * Inject thinking config vào request body (chỉ DeepSeek).
 *
 * DeepSeek mặc định thinking=ENABLED → tốn reasoning tokens. Để mặc định TẮT và nhanh/rẻ,
 * gửi tường minh thinking:{type:"disabled"}. Chỉ bật khi config enabled VÀ caller opt-in.
 *
 * QUAN TRỌNG: KHÔNG gọi hàm này cho openRouterChatCompleteWithTools — agent tool loop
 * không round-trip reasoning_content; thinking + tools sẽ làm API trả 400 ở vòng sau.
 */
function applyThinking(body: Record<string, unknown>, callerOptIn: boolean): void {
  if (resolveChatLlmProvider() !== 'deepseek') return // OpenRouter: payload giữ nguyên
  const cfg = getDeepSeekThinkingConfig()
  if (cfg.enabled && callerOptIn) {
    body.thinking = { type: 'enabled' }
    body.reasoning_effort = cfg.effort
    delete body.temperature // thinking mode bỏ qua temperature; xoá cho payload gọn
  } else {
    body.thinking = { type: 'disabled' }
  }
}

export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | {
      role: 'assistant'
      content: string | null
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }>
    }
  | { role: 'tool'; tool_call_id: string; content: string }

export function normalizeToolAssistantMessage(
  message: Extract<ChatMessage, { role: 'assistant' }>
): Extract<ChatMessage, { role: 'assistant' }> {
  if (!message.tool_calls?.length) return message
  return {
    ...message,
    content: message.content ?? '',
  }
}

export type OpenRouterToolDefinition = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

/** Tin nhắn chỉ text (không tool) cho completion/stream đơn giản. */
type SimpleChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function openRouterChatComplete(params: {
  messages: SimpleChatMessage[]
  maxTokens: number
  temperature: number
  model?: string
  /** Opt-in thinking mode (chỉ có tác dụng khi provider=deepseek + DEEPSEEK_REASONING=1). */
  thinking?: boolean
}): Promise<{ text: string; tokens: number }> {
  ensureKey()
  const useModel = params.model?.trim() || resolveChatLlmModel()
  const body: Record<string, unknown> = {
    model: useModel,
    messages: params.messages,
    max_tokens: params.maxTokens,
    temperature: params.temperature,
  }
  applyThinking(body, params.thinking === true)

  const res = await fetch(`${getChatLlmBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: buildChatLlmHeaders(),
    body: JSON.stringify(body),
  })

  const raw = await res.text()
  if (!res.ok) {
    logger.error('Chat LLM complete error', {
      provider: resolveChatLlmProvider(),
      status: res.status,
      body: raw.slice(0, 500),
    })
    throw new Error(`Chat LLM HTTP ${res.status}`)
  }

  let data: {
    choices?: Array<{ message?: { content?: string } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  }
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Chat LLM returned invalid JSON')
  }

  const text = data.choices?.[0]?.message?.content ?? ''
  const u = data.usage
  const tokens =
    u?.total_tokens ??
    (u?.prompt_tokens ?? 0) + (u?.completion_tokens ?? 0)

  return { text, tokens }
}

/**
 * Streams assistant text deltas via callback. OpenAI-compatible SSE.
 * Gửi stream_options.include_usage để nhận usage ở chunk cuối (DeepSeek bắt buộc; OpenRouter an toàn).
 */
export async function openRouterChatStream(params: {
  messages: SimpleChatMessage[]
  maxTokens: number
  temperature: number
  onDelta: (text: string) => void
  model?: string
  /** Opt-in thinking mode (chỉ có tác dụng khi provider=deepseek + DEEPSEEK_REASONING=1). */
  thinking?: boolean
}): Promise<{ tokens: number }> {
  ensureKey()
  const useModel = params.model?.trim() || resolveChatLlmModel()
  const body: Record<string, unknown> = {
    model: useModel,
    messages: params.messages,
    max_tokens: params.maxTokens,
    temperature: params.temperature,
    stream: true,
    stream_options: { include_usage: true },
  }
  applyThinking(body, params.thinking === true)

  const res = await fetch(`${getChatLlmBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: buildChatLlmHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const t = await res.text()
    logger.error('Chat LLM stream error', {
      provider: resolveChatLlmProvider(),
      status: res.status,
      body: t.slice(0, 500),
    })
    throw new Error(`Chat LLM HTTP ${res.status}`)
  }

  const reader = res.body?.getReader()
  if (!reader) {
    throw new Error('Chat LLM stream: no body')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let usageTokens = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') continue

      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string; reasoning_content?: string } }>
          usage?: { total_tokens?: number; completion_tokens?: number }
        }
        const delta = json.choices?.[0]?.delta
        const piece = delta?.content
        if (piece) {
          params.onDelta(piece)
        }
        // reasoning_content (thinking mode) bị bỏ qua — không hiển thị chuỗi suy luận cho người dùng.
        if (json.usage?.total_tokens != null) {
          usageTokens = json.usage.total_tokens
        }
      } catch {
        // ignore parse errors for keep-alive lines
      }
    }
  }

  return { tokens: usageTokens }
}

export function getOpenRouterModelId(): string {
  return resolveChatLlmModel()
}

export type ToolCall = NonNullable<
  Extract<ChatMessage, { role: 'assistant' }>['tool_calls']
>[number]

export async function openRouterChatCompleteWithTools(params: {
  messages: ChatMessage[]
  tools: OpenRouterToolDefinition[]
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  maxTokens: number
  temperature: number
  model?: string
}): Promise<{
  message: Extract<ChatMessage, { role: 'assistant' }>
  tokens: number
}> {
  ensureKey()
  const useModel = params.model?.trim() || resolveChatLlmModel()
  const body: Record<string, unknown> = {
    model: useModel,
    messages: params.messages,
    max_tokens: params.maxTokens,
    temperature: params.temperature,
  }
  if (params.tools.length > 0) {
    body.tools = params.tools
    body.tool_choice = params.toolChoice ?? 'auto'
  }
  // DeepSeek mặc định thinking=ENABLED. Agent loop không round-trip reasoning_content →
  // nếu để thinking bật, vòng sau tool call sẽ bị 400. NÊN LUÔN tắt thinking ở đây
  // (callerOptIn=false → applyThinking ép thinking:{type:"disabled"} cho DeepSeek, no-op cho OpenRouter).
  applyThinking(body, false)

  const res = await fetch(`${getChatLlmBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: buildChatLlmHeaders(),
    body: JSON.stringify(body),
  })

  const raw = await res.text()
  if (!res.ok) {
    logger.error('Chat LLM chat+tools error', {
      provider: resolveChatLlmProvider(),
      status: res.status,
      body: raw.slice(0, 500),
    })
    throw new Error(`Chat LLM HTTP ${res.status}`)
  }

  let data: {
    choices?: Array<{
      message?: {
        role?: string
        content?: string | null
        tool_calls?: ToolCall[]
      }
    }>
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  }
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Chat LLM returned invalid JSON')
  }

  const msg = data.choices?.[0]?.message
  const message: Extract<ChatMessage, { role: 'assistant' }> = {
    role: 'assistant',
    content: msg?.content ?? null,
    tool_calls: msg?.tool_calls,
  }

  const u = data.usage
  const tokens =
    u?.total_tokens ?? (u?.prompt_tokens ?? 0) + (u?.completion_tokens ?? 0)

  return { message: normalizeToolAssistantMessage(message), tokens }
}
