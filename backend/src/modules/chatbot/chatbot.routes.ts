import { Router } from 'express'
import { authenticate, requireRole } from '../../common/middlewares/auth.middleware'
import { chatbotController } from './chatbot.controller'

const router = Router()

router.use(authenticate)

router.get('/sessions', chatbotController.getSessions)
router.get('/sessions/:id', chatbotController.getSession)
router.post('/sessions', chatbotController.createSession)
router.delete('/sessions/:id', chatbotController.deleteSession)
router.put('/sessions/:id/clear', chatbotController.clearSessionHistory)

router.get('/sessions/:sessionId/messages', chatbotController.getMessages)
router.post('/sessions/:sessionId/messages', chatbotController.sendMessage)
router.post('/sessions/:sessionId/stream', chatbotController.sendMessageStreaming)

router.get('/stats', chatbotController.getStats)

router.post('/admin/knowledge/index', requireRole('admin'), chatbotController.indexKnowledgeBase)
router.get('/admin/knowledge/stats', requireRole('admin'), chatbotController.getIndexStats)
router.get('/admin/knowledge', requireRole('admin'), chatbotController.getGlobalStats)
router.post('/admin/knowledge/entries', requireRole('admin'), chatbotController.addKnowledgeEntry)
router.put('/admin/knowledge/entries/:id', requireRole('admin'), chatbotController.updateKnowledgeEntry)
router.delete('/admin/knowledge/entries/:id', requireRole('admin'), chatbotController.deleteKnowledgeEntry)

export default router
