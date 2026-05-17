/**
 * Shared OpenRouter base URL + headers for chat/completions and embeddings (same API key).
 */

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
