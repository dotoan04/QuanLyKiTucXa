import {
  chatIntentSkipLlmForDataIntents,
  chatPromptQuestionMaxChars,
  intentClassifyConfig,
  intentFallbackEnv,
  logger,
  resolveIntentClassifyModel,
} from './ai-config'
import {
  type ChatIntent,
  heuristicChatIntent,
  parseChatIntent,
} from './chatbot-intents'
import { getOpenRouterApiKey } from './openrouter-http.util'
import { openRouterChatComplete } from './openrouter-llm.service'

const INTENT_SYSTEM = `Bạn là bộ phân loại ý định câu hỏi chatbot KTX. Chỉ trả về ĐÚNG MỘT từ (chữ in hoa, không giải thích) thuộc danh sách:
POLICY
PAYMENT_STATUS
SCHEDULE
ROOM_INFO
GENERAL

Ý nghĩa:
- POLICY: quy định, nội quy, quy trình, thủ tục, hướng dẫn chung (không cần tra số liệu thật từ cơ sở dữ liệu).
- PAYMENT_STATUS: hóa đơn, tiền phòng, công nợ, chưa đóng, thanh toán, trạng thái đóng tiền.
- SCHEDULE: lịch hẹn, lịch gặp sinh viên, lịch kiểm tra phòng, appointment (có mốc thời gian).
- ROOM_INFO: ai đang ở phòng nào; KTX/ ký túc xá hiện có những ai, đang có bao nhiêu người/sinh viên; danh sách sinh viên đang lưu trú; phòng X đang có ai; thông tin lưu trú theo phòng (cần dữ liệu thật).
- GENERAL: chào hỏi, cảm ơn, kiến thức phổ thông không liên quan KTX, hoặc câu không thuộc các loại trên.`

const DATA_INTENTS = new Set<ChatIntent>(['PAYMENT_STATUS', 'SCHEDULE', 'ROOM_INFO'])

class ChatbotIntentService {
  async classifyIntent(question: string): Promise<ChatIntent> {
    const heuristic = heuristicChatIntent(question)

    if (!getOpenRouterApiKey()) {
      logger.warn('Intent classify: no API key, using heuristic')
      return heuristic
    }

    if (chatIntentSkipLlmForDataIntents && DATA_INTENTS.has(heuristic)) {
      return heuristic
    }

    try {
      const { text } = await openRouterChatComplete({
        messages: [
          { role: 'system', content: INTENT_SYSTEM },
          { role: 'user', content: question.slice(0, chatPromptQuestionMaxChars) },
        ],
        maxTokens: intentClassifyConfig.maxTokens,
        temperature: intentClassifyConfig.temperature,
        model: resolveIntentClassifyModel(),
      })

      const parsed = parseChatIntent(text, intentFallbackEnv)

      if (parsed === intentFallbackEnv && heuristic !== intentFallbackEnv) {
        return heuristic
      }

      return parsed
    } catch (e) {
      logger.error('Intent classify failed, using heuristic', e)
      return heuristic
    }
  }
}

export const chatbotIntentService = new ChatbotIntentService()
