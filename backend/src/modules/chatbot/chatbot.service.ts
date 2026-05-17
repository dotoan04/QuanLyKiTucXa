import { PrismaClient } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'
import { auditLogService } from '../audit-log/audit-log.service'
import { ragPipelineService } from './rag-pipeline.service'
import { knowledgeBaseService } from './knowledge-base.service'
import {
  chatDataJsonPromptMaxChars,
  chatDataUseLlmSummary,
  chatPromptQuestionMaxChars,
  chatUseLegacyPipeline,
  dataSummarizeSystemPrompt,
  ensureAssistantReplyText,
  lightLlmModel,
  logger,
  responseTokenBudget,
  type UserRole,
} from './ai-config'
import { chatbotAgentService } from './chatbot-agent.service'
import { buildDataIntentMarkdown } from './chatbot-data-reply.service'
import { chatbotDataService } from './chatbot-data.service'
import { heuristicDbIntent } from './chatbot-intents'
import type { ChatIntent } from './chatbot-intents'
import {
  canAccessChatIntent,
  CHAT_ACCESS_DENIED_VI,
} from './chatbot-permissions'
import { openRouterChatComplete, openRouterChatStream } from './openrouter-llm.service'
import { SSEStreamer } from './sse.util'

const prisma = new PrismaClient()

const SENSITIVE_DB_INTENTS = new Set<ChatIntent>([
  'PAYMENT_STATUS',
  'SCHEDULE',
  'ROOM_INFO',
  'STUDENT_OVERVIEW',
])

interface CreateSessionInput {
  userId: string
  title?: string
}

interface SendMessageInput {
  sessionId: string
  userId: string
  content: string
  userRole?: string
}

class ChatbotService {
  private streamAssistantMarkdown(streamer: SSEStreamer, text: string): void {
    const body = ensureAssistantReplyText(text)
    const parts = body.split(/\n\n+/).filter((p) => p.length > 0)
    if (parts.length === 0) {
      if (body.trim()) streamer.sendContent(body, true)
      return
    }
    for (let i = 0; i < parts.length; i++) {
      const chunk = i < parts.length - 1 ? `${parts[i]}\n\n` : parts[i]
      streamer.sendContent(chunk, true)
    }
  }

  private sensitiveDbAudit(intent: ChatIntent, userId: string, sessionId: string) {
    if (!SENSITIVE_DB_INTENTS.has(intent)) return Promise.resolve()
    return auditLogService.create({
      userId,
      action: 'chatbot_sensitive_query',
      entity: 'chat_session',
      entityId: sessionId,
      details: { intent, source: 'heuristic_db' },
    })
  }

  private async summarizeStructuredData(question: string, payload: Record<string, unknown>) {
    const json = JSON.stringify(payload)
    const clipped =
      json.length > chatDataJsonPromptMaxChars
        ? json.slice(0, chatDataJsonPromptMaxChars) + '…'
        : json
    return openRouterChatComplete({
      messages: [
        { role: 'system', content: dataSummarizeSystemPrompt },
        {
          role: 'user',
          content: `Câu hỏi: ${question.slice(0, chatPromptQuestionMaxChars)}\n\nDữ liệu JSON:\n${clipped}`,
        },
      ],
      maxTokens: responseTokenBudget.dataSummary,
      temperature: 0.25,
      model: lightLlmModel,
    })
  }

  async createSession(data: CreateSessionInput) {
    try {
      const session = await prisma.chatSession.create({
        data: {
          userId: data.userId,
          title: data.title || 'New Chat'
        }
      })

      logger.info('Created new chat session', { sessionId: session.id, userId: data.userId })

      return session
    } catch (error) {
      logger.error('Error creating chat session:', error)
      throw AppError.internal('Failed to create chat session')
    }
  }

  async getSessions(userId: string, limit: number = 10) {
    try {
      const sessions = await prisma.chatSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              role: true
            }
          },
          _count: {
            select: { messages: true }
          }
        }
      })

      return sessions
    } catch (error) {
      logger.error('Error getting chat sessions:', error)
      throw AppError.internal('Failed to get chat sessions')
    }
  }

  async getSession(sessionId: string, userId: string) {
    try {
      const session = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId // Ensure user owns the session
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      if (!session) {
        throw AppError.notFound('Chat session')
      }

      return session
    } catch (error) {
      logger.error('Error getting chat session:', error)
      throw AppError.internal('Failed to get chat session')
    }
  }

  async deleteSession(sessionId: string, userId: string) {
    try {
      // Verify ownership
      const session = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId
        }
      })

      if (!session) {
        throw AppError.notFound('Chat session')
      }

      await prisma.chatSession.delete({
        where: { id: sessionId }
      })

      logger.info('Deleted chat session', { sessionId })

      return true
    } catch (error) {
      logger.error('Error deleting chat session:', error)
      throw AppError.internal('Failed to delete chat session')
    }
  }

  async sendMessage(data: SendMessageInput) {
    try {
      // Verify session exists and user owns it
      const session = await prisma.chatSession.findFirst({
        where: {
          id: data.sessionId,
          userId: data.userId
        }
      })

      if (!session) {
        throw AppError.notFound('Chat session')
      }

      // Save user message
      const userMessage = await prisma.chatMessage.create({
        data: {
          sessionId: data.sessionId,
          role: 'user',
          content: data.content
        }
      })

      logger.info('User message saved', { sessionId: data.sessionId, messageLength: data.content.length })

      // Update session title if it's the first message
      if (session.title === 'New Chat') {
        await prisma.chatSession.update({
          where: { id: data.sessionId },
          data: {
            title: data.content.slice(0, 50) + (data.content.length > 50 ? '...' : '')
          }
        })
      }

      if (!chatUseLegacyPipeline) {
        const agentResult = await chatbotAgentService.run(
          data.content,
          data.userId,
          data.sessionId,
          data.userRole as UserRole | undefined
        )
        await prisma.chatMessage.create({
          data: {
            sessionId: data.sessionId,
            role: 'assistant',
            content: agentResult.answer,
            sources: agentResult.sources.map((s) => ({
              id: s.id,
              title: s.title,
              similarity: s.similarity,
            })),
          },
        })
        return {
          userMessage,
          assistantMessage: {
            sessionId: data.sessionId,
            role: 'assistant' as const,
            content: agentResult.answer,
            sources: agentResult.sources.map((s) => ({
              id: s.id,
              title: s.title,
              similarity: s.similarity,
            })),
            createdAt: new Date(),
          },
          meta: { pipeline: 'agent' as const, toolsUsed: agentResult.toolsUsed },
          ragResult: {
            answer: agentResult.answer,
            sources: agentResult.sources,
            contextUsed: agentResult.contextUsed,
            tokens: agentResult.tokens,
          },
        }
      }

      const dbIntent = heuristicDbIntent(data.content, data.userRole)

      if (dbIntent) {
        if (!canAccessChatIntent(data.userRole, dbIntent)) {
          await prisma.chatMessage.create({
            data: {
              sessionId: data.sessionId,
              role: 'assistant',
              content: CHAT_ACCESS_DENIED_VI,
            },
          })
          return {
            userMessage,
            assistantMessage: {
              sessionId: data.sessionId,
              role: 'assistant' as const,
              content: CHAT_ACCESS_DENIED_VI,
              sources: [],
              createdAt: new Date(),
            },
            meta: { pipeline: 'denied' as const, intent: dbIntent },
          }
        }

        const [payload] = await Promise.all([
          chatbotDataService.loadStructuredDataForChat({
            intent: dbIntent,
            userId: data.userId,
            userRole: data.userRole || '',
            question: data.content,
          }),
          this.sensitiveDbAudit(dbIntent, data.userId, data.sessionId),
        ])

        let replyText: string
        let replyTokens: number
        if (chatDataUseLlmSummary) {
          const r = await this.summarizeStructuredData(data.content, payload)
          replyText = ensureAssistantReplyText(r.text)
          replyTokens = r.tokens
        } else {
          replyText = ensureAssistantReplyText(
            buildDataIntentMarkdown(dbIntent, payload)
          )
          replyTokens = 0
        }

        await prisma.chatMessage.create({
          data: {
            sessionId: data.sessionId,
            role: 'assistant',
            content: replyText,
          },
        })

        return {
          userMessage,
          assistantMessage: {
            sessionId: data.sessionId,
            role: 'assistant' as const,
            content: replyText,
            sources: [],
            createdAt: new Date(),
          },
          meta: { pipeline: 'db' as const, intent: dbIntent },
          ragResult: {
            answer: replyText,
            sources: [],
            contextUsed: false,
            tokens: replyTokens,
          },
        }
      }

      const result = await ragPipelineService.executeRAGPipeline(
        data.content,
        data.userId,
        data.sessionId,
        data.userRole as UserRole | undefined,
        { maxTokens: responseTokenBudget.policy }
      )

      return {
        userMessage,
        assistantMessage: {
          sessionId: data.sessionId,
          role: 'assistant' as const,
          content: result.answer,
          sources: result.sources,
          createdAt: new Date(),
        },
        meta: { pipeline: 'rag' as const },
        ragResult: result,
      }
    } catch (error) {
      logger.error('Error sending message:', error)
      throw AppError.internal('Failed to send message')
    }
  }

  async getMessages(sessionId: string, userId: string, limit: number = 50) {
    try {
      // Verify session ownership
      const session = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId
        }
      })

      if (!session) {
        throw AppError.notFound('Chat session')
      }

      const messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: limit
      })

      return messages
    } catch (error) {
      logger.error('Error getting messages:', error)
      throw AppError.internal('Failed to get messages')
    }
  }

  async sendMessageStreaming(
    data: SendMessageInput,
    streamer: SSEStreamer
  ): Promise<void> {
    try {
      // Verify session exists and user owns it
      const session = await prisma.chatSession.findFirst({
        where: {
          id: data.sessionId,
          userId: data.userId
        }
      })

      if (!session) {
        streamer.sendError('Chat session not found')
        return
      }

      // Save user message
      const userMessage = await prisma.chatMessage.create({
        data: {
          sessionId: data.sessionId,
          role: 'user',
          content: data.content
        }
      })

      logger.info('Starting streaming message', { sessionId: data.sessionId, messageLength: data.content.length })

      if (session.title === 'New Chat') {
        await prisma.chatSession.update({
          where: { id: data.sessionId },
          data: {
            title: data.content.slice(0, 50) + (data.content.length > 50 ? '...' : '')
          }
        })
      }

      if (!chatUseLegacyPipeline) {
        streamer.send({
          type: 'metadata',
          data: {
            userMessageId: userMessage.id,
            timestamp: new Date().toISOString(),
            pipeline: 'agent',
          },
        })
        const agentResult = await chatbotAgentService.run(
          data.content,
          data.userId,
          data.sessionId,
          data.userRole as UserRole | undefined
        )
        this.streamAssistantMarkdown(streamer, agentResult.answer)
        await prisma.chatMessage.create({
          data: {
            sessionId: data.sessionId,
            role: 'assistant',
            content: agentResult.answer,
            sources: agentResult.sources.map((s) => ({
              id: s.id,
              title: s.title,
              similarity: s.similarity,
            })),
          },
        })
        streamer.sendDone({
          sources: agentResult.sources.map((s) => ({
            id: s.id,
            title: s.title,
            similarity: (s.similarity * 100).toFixed(1) + '%',
          })),
          pipeline: 'agent',
          toolsUsed: agentResult.toolsUsed,
        })
        return
      }

      const dbIntent = heuristicDbIntent(data.content, data.userRole)

      if (dbIntent) {
        if (!canAccessChatIntent(data.userRole, dbIntent)) {
          streamer.send({
            type: 'metadata',
            data: {
              userMessageId: userMessage.id,
              timestamp: new Date().toISOString(),
              pipeline: 'denied',
              intent: dbIntent,
            },
          })
          streamer.sendContent(CHAT_ACCESS_DENIED_VI, true)
          await prisma.chatMessage.create({
            data: {
              sessionId: data.sessionId,
              role: 'assistant',
              content: CHAT_ACCESS_DENIED_VI,
            },
          })
          streamer.sendDone({ sources: [], pipeline: 'denied', intent: dbIntent })
          return
        }

        streamer.send({
          type: 'metadata',
          data: {
            userMessageId: userMessage.id,
            timestamp: new Date().toISOString(),
            pipeline: 'db',
            intent: dbIntent,
          },
        })

        const [payload] = await Promise.all([
          chatbotDataService.loadStructuredDataForChat({
            intent: dbIntent,
            userId: data.userId,
            userRole: data.userRole || '',
            question: data.content,
          }),
          this.sensitiveDbAudit(dbIntent, data.userId, data.sessionId),
        ])

        let full = ''
        if (chatDataUseLlmSummary) {
          const clipped = JSON.stringify(payload)
          const jsonBlock =
            clipped.length > chatDataJsonPromptMaxChars
              ? clipped.slice(0, chatDataJsonPromptMaxChars) + '…'
              : clipped
          await openRouterChatStream({
            messages: [
              { role: 'system', content: dataSummarizeSystemPrompt },
              {
                role: 'user',
                content: `Câu hỏi: ${data.content.slice(0, chatPromptQuestionMaxChars)}\n\nDữ liệu JSON:\n${jsonBlock}`,
              },
            ],
            maxTokens: responseTokenBudget.dataSummary,
            temperature: 0.25,
            model: lightLlmModel,
            onDelta: (t) => {
              full += t
              streamer.sendContent(t, true)
            },
          })
          const streamedDb = full
          full = ensureAssistantReplyText(full)
          if (!streamedDb.trim()) {
            streamer.sendContent(full, true)
          }
        } else {
          full = ensureAssistantReplyText(
            buildDataIntentMarkdown(dbIntent, payload)
          )
          this.streamAssistantMarkdown(streamer, full)
        }

        await prisma.chatMessage.create({
          data: {
            sessionId: data.sessionId,
            role: 'assistant',
            content: full,
          },
        })
        streamer.sendDone({ sources: [], pipeline: 'db', intent: dbIntent })
        return
      }

      streamer.send({
        type: 'metadata',
        data: {
          userMessageId: userMessage.id,
          timestamp: new Date().toISOString(),
          pipeline: 'rag',
        },
      })

      await ragPipelineService.executeRAGPipelineStreaming(
        data.content,
        data.userId,
        data.sessionId,
        (chunk) => {
          streamer.sendContent(chunk, true)
        },
        (result) => {
          streamer.sendDone({
            sources: result.sources.map(s => ({
              id: s.id,
              title: s.title,
              similarity: (s.similarity * 100).toFixed(1) + '%'
            })),
            pipeline: 'rag',
          })
        },
        (error) => {
          streamer.sendError(error)
        },
        data.userRole as UserRole | undefined,
        { maxTokens: responseTokenBudget.policy }
      )

    } catch (error) {
      logger.error('Error in streaming message:', error)
      streamer.sendError('Failed to process your message')
    }
  }

  async getStats(userId?: string) {
    try {
      const where = userId ? { userId } : {}

      const [totalSessions, totalMessages, recentSessions] = await Promise.all([
        prisma.chatSession.count({ where }),
        prisma.chatMessage.count({
          where: {
            session: where
          }
        }),
        prisma.chatSession.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            _count: {
              select: { messages: true }
            }
          }
        })
      ])

      const pipelineStats = await ragPipelineService.getPipelineStats()

      return {
        overview: {
          totalSessions,
          totalMessages,
          avgMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0
        },
        recentSessions,
        pipelineStats
      }
    } catch (error) {
      logger.error('Error getting chatbot stats:', error)
      throw AppError.internal('Failed to get chatbot statistics')
    }
  }

  async clearSessionHistory(sessionId: string, userId: string) {
    try {
      // Verify ownership
      const session = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId
        }
      })

      if (!session) {
        throw AppError.notFound('Chat session')
      }

      // Delete all messages from session
      await prisma.chatMessage.deleteMany({
        where: { sessionId }
      })

      logger.info('Cleared session history', { sessionId })

      return true
    } catch (error) {
      logger.error('Error clearing session history:', error)
      throw AppError.internal('Failed to clear session history')
    }
  }

  // ==================== KNOWLEDGE BASE ADMIN METHODS ====================

  async indexKnowledgeBase(forceReindex: boolean = false) {
    try {
      const result = await knowledgeBaseService.indexKnowledgeBase(forceReindex)
      return result
    } catch (error) {
      logger.error('Error indexing knowledge base:', error)
      throw AppError.internal('Failed to index knowledge base')
    }
  }

  async getIndexStats() {
    try {
      const stats = await knowledgeBaseService.getIndexStats()
      return stats
    } catch (error) {
      logger.error('Error getting index stats:', error)
      throw AppError.internal('Failed to get index statistics')
    }
  }

  async addKnowledgeEntry(data: {
    title: string
    content: string
    category: string
    isActive?: boolean
  }) {
    try {
      const entry = await knowledgeBaseService.addKnowledgeEntry(data)
      return entry
    } catch (error) {
      logger.error('Error adding knowledge entry:', error)
      throw AppError.internal('Failed to add knowledge entry')
    }
  }

  async updateKnowledgeEntry(id: string, data: {
    title?: string
    content?: string
    category?: string
    isActive?: boolean
  }) {
    try {
      const entry = await knowledgeBaseService.updateKnowledgeEntry(id, data)
      return entry
    } catch (error) {
      logger.error('Error updating knowledge entry:', error)
      throw AppError.internal('Failed to update knowledge entry')
    }
  }

  async deleteKnowledgeEntry(id: string) {
    try {
      await knowledgeBaseService.deleteKnowledgeEntry(id)
      return true
    } catch (error) {
      logger.error('Error deleting knowledge entry:', error)
      throw AppError.internal('Failed to delete knowledge entry')
    }
  }
}

export const chatbotService = new ChatbotService()
