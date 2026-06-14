/**
 * Provider config cho chat LLM + embedding.
 *
 * - Chat LLM: DeepSeek V4 Flash trực tiếp (mặc định khi có DEEPSEEK_API_KEY), fallback OpenRouter.
 * - Embedding: luôn OpenRouter (DeepSeek không có endpoint /embeddings). Xem createEmbedding trong ai-config.
 *
 * 3 getter OpenRouter cũ (getOpenRouterBaseUrl/getOpenRouterApiKey/buildOpenRouterHeaders)
 * GIỮ NGUYÊN để createEmbedding và guard intent service không phải đổi.
 */

// ───────────────────── OpenRouter (embedding + fallback chat) ─────────────────────

export function getOpenRouterBaseUrl(): string {
  return (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '')
}

export function getOpenRouterApiKey(): string | undefined {
  const k = process.env.OPENROUTER_API_KEY?.trim()
  return k || undefined
}

export function buildOpenRouterHeaders(): Record<string, string> {
  const apiKey = getOpenRouterApiKey()
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
  if (process.env.OPENROUTER_HTTP_REFERER) {
    h['HTTP-Referer'] = process.env.OPENROUTER_HTTP_REFERER
  }
  if (process.env.OPENROUTER_APP_TITLE) {
    h['X-Title'] = process.env.OPENROUTER_APP_TITLE
  }
  return h
}

// ───────────────────── DeepSeek direct ─────────────────────

export function getDeepSeekApiKey(): string | undefined {
  const k = process.env.DEEPSEEK_API_KEY?.trim()
  return k || undefined
}

export function getDeepSeekBaseUrl(): string {
  return (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '')
}

// ───────────────────── Chat-LLM provider chọn lựa ─────────────────────

export type ChatLlmProvider = 'deepseek' | 'openrouter'

/**
 * Provider chat LLM đang dùng.
 * - Ép qua CHAT_LLM_PROVIDER=deepseek|openrouter
 * - Mặc định auto: deepseek khi có DEEPSEEK_API_KEY, còn lại openrouter.
 */
export function resolveChatLlmProvider(): ChatLlmProvider {
  const forced = process.env.CHAT_LLM_PROVIDER?.trim().toLowerCase()
  if (forced === 'deepseek' || forced === 'openrouter') return forced
  return getDeepSeekApiKey() ? 'deepseek' : 'openrouter'
}

export function getChatLlmBaseUrl(): string {
  return resolveChatLlmProvider() === 'deepseek' ? getDeepSeekBaseUrl() : getOpenRouterBaseUrl()
}

export function getChatLlmApiKey(): string | undefined {
  return resolveChatLlmProvider() === 'deepseek' ? getDeepSeekApiKey() : getOpenRouterApiKey()
}

export function buildChatLlmHeaders(): Record<string, string> {
  const provider = resolveChatLlmProvider()
  const apiKey = provider === 'deepseek' ? getDeepSeekApiKey() : getOpenRouterApiKey()
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey ?? ''}`,
  }
  // HTTP-Referer / X-Title là OpenRouter-specific; DeepSeek bỏ qua nhưng chỉ thêm khi cần.
  if (provider === 'openrouter') {
    if (process.env.OPENROUTER_HTTP_REFERER) {
      h['HTTP-Referer'] = process.env.OPENROUTER_HTTP_REFERER
    }
    if (process.env.OPENROUTER_APP_TITLE) {
      h['X-Title'] = process.env.OPENROUTER_APP_TITLE
    }
  }
  return h
}

// ───────────────────── Model resolver ─────────────────────
// Đặt ở đây (không đặt trong openrouter-llm.service) để tránh circular import:
// ai-config import resolver ở đây; openrouter-llm.service import cả ai-config và file này.

export function resolveChatLlmModel(): string {
  return resolveChatLlmProvider() === 'deepseek'
    ? (process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash')
    : (process.env.OPENROUTER_MODEL?.trim() || 'deepseek/deepseek-v3.2')
}

export function resolveChatLightLlmModel(): string {
  return resolveChatLlmProvider() === 'deepseek'
    ? (process.env.DEEPSEEK_LIGHT_MODEL?.trim() || 'deepseek-v4-flash')
    : (process.env.OPENROUTER_LIGHT_MODEL?.trim() || 'qwen/qwen3.5-9b')
}

// ───────────────────── DeepSeek thinking config ─────────────────────
// DeepSeek mặc định thinking=ENABLED. Tích hợp này mặc định TẮT (gửi thinking:{type:"disabled"})
// trừ khi DEEPSEEK_REASONING=1 VÀ caller opt-in. Không bao giờ áp dụng trong agent tool loop.

export function getDeepSeekThinkingConfig(): { enabled: boolean; effort: 'high' | 'max' } {
  return {
    enabled: process.env.DEEPSEEK_REASONING === '1',
    // reasoning_effort thực tế chỉ nhận high|max (low/medium → high, xhigh → max theo docs).
    effort: process.env.DEEPSEEK_REASONING_EFFORT?.trim().toLowerCase() === 'max' ? 'max' : 'high',
  }
}
