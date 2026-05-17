import { logger } from './ai-config'
import { buildOpenRouterHeaders, getOpenRouterApiKey, getOpenRouterBaseUrl } from './openrouter-http.util'

const baseUrl = getOpenRouterBaseUrl()
const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v3.2'

function ensureKey(): void {
  if (!getOpenRouterApiKey()) {
    throw new Error('OPENROUTER_API_KEY is not set')
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
}): Promise<{ text: string; tokens: number }> {
  ensureKey()
  const useModel = params.model?.trim() || model
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildOpenRouterHeaders(),
    body: JSON.stringify({
      model: useModel,
      messages: params.messages,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
    }),
  })

  const raw = await res.text()
  if (!res.ok) {
    logger.error('OpenRouter chat error', { status: res.status, body: raw.slice(0, 500) })
    throw new Error(`OpenRouter HTTP ${res.status}`)
  }

  let data: {
    choices?: Array<{ message?: { content?: string } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  }
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('OpenRouter returned invalid JSON')
  }

  const text = data.choices?.[0]?.message?.content ?? ''
  const u = data.usage
  const tokens =
    u?.total_tokens ??
    (u?.prompt_tokens ?? 0) + (u?.completion_tokens ?? 0)

  return { text, tokens }
}

/**
 * Streams assistant text deltas via callback. OpenAI-compatible SSE from OpenRouter.
 */
export async function openRouterChatStream(params: {
  messages: SimpleChatMessage[]
  maxTokens: number
  temperature: number
  onDelta: (text: string) => void
  model?: string
}): Promise<{ tokens: number }> {
  ensureKey()
  const useModel = params.model?.trim() || model
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildOpenRouterHeaders(),
    body: JSON.stringify({
      model: useModel,
      messages: params.messages,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      stream: true,
    }),
  })

  if (!res.ok) {
    const t = await res.text()
    logger.error('OpenRouter stream error', { status: res.status, body: t.slice(0, 500) })
    throw new Error(`OpenRouter HTTP ${res.status}`)
  }

  const reader = res.body?.getReader()
  if (!reader) {
    throw new Error('OpenRouter stream: no body')
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
          choices?: Array<{ delta?: { content?: string; reasoning?: string } }>
          usage?: { total_tokens?: number; completion_tokens?: number }
        }
        const delta = json.choices?.[0]?.delta
        const piece = delta?.content
        if (piece) {
          params.onDelta(piece)
        }
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
  return model
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
  const useModel = params.model?.trim() || model
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

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildOpenRouterHeaders(),
    body: JSON.stringify(body),
  })

  const raw = await res.text()
  if (!res.ok) {
    logger.error('OpenRouter chat+tools error', { status: res.status, body: raw.slice(0, 500) })
    throw new Error(`OpenRouter HTTP ${res.status}`)
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
    throw new Error('OpenRouter returned invalid JSON')
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
