import { PrismaClient } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'
import { knowledgeBaseService } from './knowledge-base.service'
import {
  ensureAssistantReplyText,
  llmConfig,
  ragConfig,
  logger,
  rolePromptExtensions,
  type UserRole,
} from './ai-config'
import { openRouterChatComplete, openRouterChatStream } from './openrouter-llm.service'

const prisma = new PrismaClient()

interface StudentContext {
  id: string
  name: string
  studentCode: string
  faculty?: string
  academicYear?: number
  hasActiveContract: boolean
  roomNumber?: string
  building?: string
  contractStatus?: string
  contractStartDate?: string
  contractEndDate?: string | null
}

export interface RAGPipelineResult {
  answer: string
  sources: Array<{
    id: string
    title: string
    similarity: number
  }>
  contextUsed: boolean
  tokens: number
}

interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Array<{
    id: string
    title: string
    similarity: number
  }>
}

class RAGPipelineService {
  async getStudentContext(userId: string): Promise<StudentContext | null> {
    try {
      const student = await prisma.student.findFirst({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true
            }
          },
          contracts: {
            where: { status: 'active' },
            include: {
              room: {
                select: {
                  roomNumber: true,
                  building: true,
                  roomType: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            take: 1,
            orderBy: { startDate: 'desc' }
          }
        }
      })

      if (!student) {
        return null
      }

      const activeContract = student.contracts[0]

      return {
        id: student.id,
        name: student.user.fullName,
        studentCode: student.studentCode,
        faculty: student.faculty ?? undefined,
        academicYear: student.academicYear ?? undefined,
        hasActiveContract: activeContract !== undefined,
        roomNumber: activeContract?.room.roomNumber,
        building: activeContract?.room.building,
        contractStatus: activeContract?.status ?? undefined,
        contractStartDate: activeContract?.startDate.toISOString(),
        contractEndDate: activeContract?.endDate?.toISOString() ?? null,
      }
    } catch (error) {
      logger.error('Error getting student context:', error)
      return null
    }
  }

  async buildStudentContextString(studentContext: StudentContext): Promise<string> {
    if (!studentContext) {
      return ''
    }

    const parts: string[] = []

    parts.push(`Name: ${studentContext.name}`)
    parts.push(`Student Code: ${studentContext.studentCode}`)

    if (studentContext.faculty) {
      parts.push(`Faculty: ${studentContext.faculty}`)
    }

    if (studentContext.academicYear) {
      parts.push(`Academic Year: ${studentContext.academicYear}`)
    }

    if (studentContext.hasActiveContract) {
      parts.push(`Room: ${studentContext.roomNumber} (${studentContext.building})`)
      if (studentContext.contractStartDate) {
        parts.push(`Contract start (ISO): ${studentContext.contractStartDate}`)
      }
      if (studentContext.contractEndDate) {
        parts.push(`Contract end (ISO): ${studentContext.contractEndDate}`)
      } else {
        parts.push(`Contract end: not set in system (open-ended or pending update)`)
      }
    } else {
      parts.push(`Status: No active room contract`)
    }

    parts.push(
      `Renewal note: contract renewal is usually allowed within 30 days before end date if no unpaid invoices — confirm on portal "Gia hạn".`
    )

    return `Student Information:\n${parts.join('\n')}`
  }

  async retrieveRelevantContext(
    query: string,
    studentContext?: StudentContext
  ): Promise<{
    documents: string[]
    sources: Array<{
      id: string
      title: string
      similarity: number
    }>
  }> {
    try {
      logger.rag('Retrieving relevant context', { query, hasStudentContext: !!studentContext })

      // Search knowledge base
      const searchResults = await knowledgeBaseService.search(query, ragConfig.topK)

      if (searchResults.length === 0) {
        logger.rag('No relevant documents found', { query })
        return {
          documents: [],
          sources: []
        }
      }

      // Prepare context from search results
      const documents = searchResults.map(result => result.content)
      const sources = searchResults.map(result => ({
        id: result.id,
        title: result.title,
        similarity: result.similarity
      }))

      logger.rag('Context retrieved', {
        query,
        documentsCount: documents.length,
        sourcesCount: sources.length,
        avgSimilarity: sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length
      })

      return {
        documents,
        sources
      }
    } catch (error) {
      logger.error('Error retrieving relevant context:', error)
      return {
        documents: [],
        sources: []
      }
    }
  }

  async constructEnhancedPrompt(
    query: string,
    context: string,
    sources: Array<{ id: string; title: string; similarity: number }>,
    studentContext?: StudentContext,
    userRole?: UserRole
  ): Promise<string> {
    let enhancedPrompt = ragConfig.systemPrompt

    // Add role-specific prompt extension
    if (userRole && rolePromptExtensions[userRole]) {
      enhancedPrompt += `\n\n${rolePromptExtensions[userRole]}`
    }

    // Add knowledge base context
    if (context && sources.length > 0) {
      enhancedPrompt += `\n\nRelevant Information:\n${context}\n\n`
      enhancedPrompt += `Use this information to provide accurate answers. If the information doesn't contain the answer, acknowledge this and suggest contacting the relevant department.`
    }

    // Add student context
    if (studentContext) {
      const studentContextStr = await this.buildStudentContextString(studentContext)
      enhancedPrompt += `\n\n${studentContextStr}\n\n`
      enhancedPrompt += `Consider this student's information when answering questions about their specific situation (e.g., "my room", "my contract", etc.).`
    }

    // Add source references
    if (sources.length > 0) {
      enhancedPrompt += `\n\nAvailable Sources:\n`
      sources.forEach((source, index) => {
        enhancedPrompt += `${index + 1}. ${source.title} (relevance: ${(source.similarity * 100).toFixed(1)}%)\n`
      })
    }

    // Add instructions
    enhancedPrompt += `\n\nInstructions:`
    enhancedPrompt += `\n- Be helpful, accurate, and respectful`
    enhancedPrompt += `\n- If information is incomplete or uncertain, acknowledge it`
    enhancedPrompt += `\n- If you use information from sources, mention the source`
    enhancedPrompt += `\n- Keep responses concise: prefer bullet points; avoid unnecessary length`
    enhancedPrompt += `\n- Respond in Vietnamese by default`

    return enhancedPrompt
  }

  async generateResponse(
    query: string,
    context: string,
    sources: Array<{ id: string; title: string; similarity: number }>,
    studentContext?: StudentContext,
    userRole?: UserRole,
    options?: { maxTokens?: number }
  ): Promise<RAGPipelineResult> {
    try {
      logger.info('Generating AI response', { query, contextLength: context.length, hasStudentContext: !!studentContext, userRole })

      const systemPrompt = await this.constructEnhancedPrompt(query, context, sources, studentContext, userRole)

      const { text: answer, tokens } = await openRouterChatComplete({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        maxTokens: options?.maxTokens ?? llmConfig.maxTokens,
        temperature: llmConfig.temperature,
      })

      logger.info('AI response generated', {
        query,
        answerLength: answer.length,
        tokensUsed: tokens,
        sourcesCount: sources.length
      })

      return {
        answer: ensureAssistantReplyText(answer),
        sources,
        contextUsed: context.length > 0,
        tokens
      }

    } catch (error) {
      logger.error('Error generating AI response:', error)
      throw AppError.internal('Failed to generate AI response')
    }
  }

  async executeRAGPipeline(
    query: string,
    userId: string,
    sessionId: string,
    userRole?: UserRole,
    options?: { maxTokens?: number; skipAssistantMessage?: boolean }
  ): Promise<RAGPipelineResult> {
    try {
      const studentContext = await this.getStudentContext(userId)

      const { documents, sources } = await this.retrieveRelevantContext(query, studentContext ?? undefined)

      const context = documents.length > 0 ? documents.join('\n\n---\n\n') : ''

      const result = await this.generateResponse(
        query,
        context,
        sources,
        studentContext ?? undefined,
        userRole,
        { maxTokens: options?.maxTokens }
      )

      if (!options?.skipAssistantMessage) {
        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: result.answer,
            sources: sources.map(s => ({
              id: s.id,
              title: s.title,
              similarity: s.similarity
            }))
          }
        })
      }

      return result
    } catch (error) {
      logger.error('Error executing RAG pipeline:', error)
      throw AppError.internal('Failed to process your request')
    }
  }

  async executeRAGPipelineStreaming(
    query: string,
    userId: string,
    sessionId: string,
    onChunk: (chunk: string) => void,
    onDone: (result: RAGPipelineResult) => void,
    onError: (error: string) => void,
    userRole?: UserRole,
    options?: { maxTokens?: number; skipAssistantMessage?: boolean }
  ): Promise<void> {
    try {
      logger.info('Starting RAG pipeline streaming', { query, userId, sessionId, userRole })

      const studentContext = await this.getStudentContext(userId)

      const { documents, sources } = await this.retrieveRelevantContext(query, studentContext ?? undefined)

      const context = documents.length > 0 ? documents.join('\n\n---\n\n') : ''
      const systemPrompt = await this.constructEnhancedPrompt(query, context, sources, studentContext ?? undefined, userRole)

      let fullContent = ''
      const { tokens: totalTokens } = await openRouterChatStream({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        maxTokens: options?.maxTokens ?? llmConfig.maxTokens,
        temperature: llmConfig.temperature,
        onDelta: (text) => {
          fullContent += text
          onChunk(text)
        },
      })

      if (!fullContent.trim()) {
        fullContent = ensureAssistantReplyText('')
        onChunk(fullContent)
      }

      const result: RAGPipelineResult = {
        answer: fullContent,
        sources,
        contextUsed: context.length > 0,
        tokens: totalTokens || Math.ceil(fullContent.length / 4)
      }

      if (!options?.skipAssistantMessage) {
        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: result.answer,
            sources: sources.map(s => ({
              id: s.id,
              title: s.title,
              similarity: s.similarity
            }))
          }
        })
      }

      onDone(result)
      logger.info('RAG pipeline streaming completed', { answerLength: fullContent.length, tokensUsed: totalTokens })

    } catch (error) {
      logger.error('Error in RAG pipeline streaming:', error)
      onError('Failed to process your request')
    }
  }

  async getConversationHistory(sessionId: string, limit: number = 10): Promise<ConversationTurn[]> {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit
    })

    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.createdAt,
      sources: msg.sources as any
    }))
  }

  async constructConversationContext(history: ConversationTurn[], userRole?: UserRole): Promise<string> {
    if (history.length === 0) {
      return ''
    }

    const roleLabels: Record<UserRole, string> = {
      student: 'Sinh viên',
      staff: 'Quản lý',
      accountant: 'Kế toán',
      technician: 'Kỹ thuật',
      director: 'Giám đốc',
      admin: 'Admin'
    }

    const userLabel = userRole ? roleLabels[userRole] : 'User'
    let context = 'Previous conversation:\n'

    for (const turn of history.slice(-5)) {
      const roleLabel = turn.role === 'user' ? userLabel : 'AI Assistant'
      context += `\n${roleLabel}: ${turn.content}\n`
    }

    return context
  }

  async getPipelineStats(): Promise<{
    totalSessions: number
    totalMessages: number
    avgMessagesPerSession: number
    knowledgeBaseIndexed: boolean
    lastActivity: Date | null
  }> {
    const [totalSessions, totalMessages, lastMessage] = await Promise.all([
      prisma.chatSession.count(),
      prisma.chatMessage.count(),
      prisma.chatMessage.findFirst({
        orderBy: { createdAt: 'desc' }
      })
    ])

    const indexStats = await knowledgeBaseService.getIndexStats()

    return {
      totalSessions,
      totalMessages,
      avgMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
      knowledgeBaseIndexed: indexStats.totalChunks > 0,
      lastActivity: lastMessage?.createdAt || null
    }
  }
}

export const ragPipelineService = new RAGPipelineService()
