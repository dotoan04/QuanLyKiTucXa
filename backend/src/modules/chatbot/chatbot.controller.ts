import { Request, Response, NextFunction } from 'express'
import { chatbotService } from './chatbot.service'
import { sendSuccess, sendCreated } from '../../common/utils/response'
import { validateSSEConnection, SSEStreamer } from './sse.util'
import { logger } from './ai-config'

class ChatbotController {
  // ==================== SESSION MANAGEMENT ====================

  getSessions = async (req: Request, res: Response, _next: NextFunction) => {
    const limit = parseInt(req.query.limit as string) || 10
    const sessions = await chatbotService.getSessions(req.user!.userId, limit)
    return sendSuccess(res, sessions)
  }

  getSession = async (req: Request, res: Response, _next: NextFunction) => {
    const session = await chatbotService.getSession(req.params.id, req.user!.userId)
    return sendSuccess(res, session)
  }

  createSession = async (req: Request, res: Response, _next: NextFunction) => {
    const session = await chatbotService.createSession({
      userId: req.user!.userId,
      title: req.body.title
    })
    return sendCreated(res, session, 'Chat session created successfully')
  }

  deleteSession = async (req: Request, res: Response, _next: NextFunction) => {
    await chatbotService.deleteSession(req.params.id, req.user!.userId)
    return sendSuccess(res, null, 'Chat session deleted successfully')
  }

  clearSessionHistory = async (req: Request, res: Response, _next: NextFunction) => {
    await chatbotService.clearSessionHistory(req.params.id, req.user!.userId)
    return sendSuccess(res, null, 'Session history cleared successfully')
  }

  // ==================== MESSAGING ====================

  getMessages = async (req: Request, res: Response, _next: NextFunction) => {
    const limit = parseInt(req.query.limit as string) || 50
    const messages = await chatbotService.getMessages(req.params.sessionId, req.user!.userId, limit)
    return sendSuccess(res, messages)
  }

  sendMessage = async (req: Request, res: Response, _next: NextFunction) => {
    const result = await chatbotService.sendMessage({
      sessionId: req.params.sessionId,
      userId: req.user!.userId,
      content: req.body.content,
      userRole: req.user!.role
    })
    return sendSuccess(res, result)
  }

  sendMessageStreaming = async (req: Request, res: Response, _next: NextFunction) => {
    try {
      if (!validateSSEConnection(req)) {
        throw new Error('Client does not support SSE')
      }

      const streamer = new SSEStreamer(res)

      await chatbotService.sendMessageStreaming({
        sessionId: req.params.sessionId,
        userId: req.user!.userId,
        content: req.body.content,
        userRole: req.user!.role
      }, streamer)

    } catch (error) {
      logger.error('Error in streaming endpoint:', error)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to start streaming',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  // ==================== STATISTICS ====================

  getStats = async (req: Request, res: Response, _next: NextFunction) => {
    const stats = await chatbotService.getStats(req.user!.userId)
    return sendSuccess(res, stats)
  }

  getGlobalStats = async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await chatbotService.getStats() // No user filter for global stats
    return sendSuccess(res, stats)
  }

  // ==================== KNOWLEDGE BASE MANAGEMENT (ADMIN) ====================

  indexKnowledgeBase = async (req: Request, res: Response, _next: NextFunction) => {
    const forceReindex = req.body.forceReindex === true
    const result = await chatbotService.indexKnowledgeBase(forceReindex)
    return sendSuccess(res, result, result.message)
  }

  getIndexStats = async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await chatbotService.getIndexStats()
    return sendSuccess(res, stats)
  }

  addKnowledgeEntry = async (req: Request, res: Response, _next: NextFunction) => {
    const entry = await chatbotService.addKnowledgeEntry({
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      isActive: req.body.isActive
    })
    return sendCreated(res, entry, 'Knowledge entry added successfully')
  }

  updateKnowledgeEntry = async (req: Request, res: Response, _next: NextFunction) => {
    const entry = await chatbotService.updateKnowledgeEntry(req.params.id, {
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      isActive: req.body.isActive
    })
    return sendSuccess(res, entry, 'Knowledge entry updated successfully')
  }

  deleteKnowledgeEntry = async (req: Request, res: Response, _next: NextFunction) => {
    await chatbotService.deleteKnowledgeEntry(req.params.id)
    return sendSuccess(res, null, 'Knowledge entry deleted successfully')
  }
}

export const chatbotController = new ChatbotController()
