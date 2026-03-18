"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatbotService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const rag_pipeline_service_1 = require("./rag-pipeline.service");
const knowledge_base_service_1 = require("./knowledge-base.service");
const ai_config_1 = require("./ai-config");
const prisma = new client_1.PrismaClient();
class ChatbotService {
    async createSession(data) {
        try {
            const session = await prisma.chatSession.create({
                data: {
                    userId: data.userId,
                    title: data.title || 'New Chat'
                }
            });
            ai_config_1.logger.info('Created new chat session', { sessionId: session.id, userId: data.userId });
            return session;
        }
        catch (error) {
            ai_config_1.logger.error('Error creating chat session:', error);
            throw app_error_1.AppError.internal('Failed to create chat session');
        }
    }
    async getSessions(userId, limit = 10) {
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
            });
            return sessions;
        }
        catch (error) {
            ai_config_1.logger.error('Error getting chat sessions:', error);
            throw app_error_1.AppError.internal('Failed to get chat sessions');
        }
    }
    async getSession(sessionId, userId) {
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
            });
            if (!session) {
                throw app_error_1.AppError.notFound('Chat session');
            }
            return session;
        }
        catch (error) {
            ai_config_1.logger.error('Error getting chat session:', error);
            throw app_error_1.AppError.internal('Failed to get chat session');
        }
    }
    async deleteSession(sessionId, userId) {
        try {
            // Verify ownership
            const session = await prisma.chatSession.findFirst({
                where: {
                    id: sessionId,
                    userId
                }
            });
            if (!session) {
                throw app_error_1.AppError.notFound('Chat session');
            }
            await prisma.chatSession.delete({
                where: { id: sessionId }
            });
            ai_config_1.logger.info('Deleted chat session', { sessionId });
            return true;
        }
        catch (error) {
            ai_config_1.logger.error('Error deleting chat session:', error);
            throw app_error_1.AppError.internal('Failed to delete chat session');
        }
    }
    async sendMessage(data) {
        try {
            // Verify session ownership
            const session = await prisma.chatSession.findFirst({
                where: {
                    id: data.sessionId
                }
            });
            if (!session) {
                throw app_error_1.AppError.notFound('Chat session');
            }
            // Save user message
            const userMessage = await prisma.chatMessage.create({
                data: {
                    sessionId: data.sessionId,
                    role: 'user',
                    content: data.content
                }
            });
            ai_config_1.logger.info('User message saved', { sessionId: data.sessionId, messageLength: data.content.length });
            // Execute RAG pipeline
            const result = await rag_pipeline_service_1.ragPipelineService.executeRAGPipeline(data.content, data.userId, data.sessionId);
            // Update session title if it's the first message
            if (session.title === 'New Chat') {
                await prisma.chatSession.update({
                    where: { id: data.sessionId },
                    data: {
                        title: data.content.slice(0, 50) + (data.content.length > 50 ? '...' : '')
                    }
                });
            }
            return {
                userMessage,
                assistantMessage: {
                    id: userMessage.id + 1, // Temporary ID
                    sessionId: data.sessionId,
                    role: 'assistant',
                    content: result.answer,
                    sources: result.sources,
                    createdAt: new Date()
                },
                ragResult: result
            };
        }
        catch (error) {
            ai_config_1.logger.error('Error sending message:', error);
            throw app_error_1.AppError.internal('Failed to send message');
        }
    }
    async getMessages(sessionId, userId, limit = 50) {
        try {
            // Verify session ownership
            const session = await prisma.chatSession.findFirst({
                where: {
                    id: sessionId,
                    userId
                }
            });
            if (!session) {
                throw app_error_1.AppError.notFound('Chat session');
            }
            const messages = await prisma.chatMessage.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'asc' },
                take: limit
            });
            return messages;
        }
        catch (error) {
            ai_config_1.logger.error('Error getting messages:', error);
            throw app_error_1.AppError.internal('Failed to get messages');
        }
    }
    async sendMessageStreaming(data, streamer) {
        try {
            // Verify session ownership
            const session = await prisma.chatSession.findFirst({
                where: {
                    id: data.sessionId
                }
            });
            if (!session) {
                throw app_error_1.AppError.notFound('Chat session');
            }
            // Save user message
            const userMessage = await prisma.chatMessage.create({
                data: {
                    sessionId: data.sessionId,
                    role: 'user',
                    content: data.content
                }
            });
            ai_config_1.logger.info('Starting streaming message', { sessionId: data.sessionId, messageLength: data.content.length });
            // Update session title if it's the first message
            if (session.title === 'New Chat') {
                await prisma.chatSession.update({
                    where: { id: data.sessionId },
                    data: {
                        title: data.content.slice(0, 50) + (data.content.length > 50 ? '...' : '')
                    }
                });
            }
            // Send metadata about the user message
            streamer.send({
                type: 'metadata',
                data: {
                    userMessageId: userMessage.id,
                    timestamp: new Date().toISOString()
                }
            });
            // Execute RAG pipeline with streaming
            await rag_pipeline_service_1.ragPipelineService.executeRAGPipelineStreaming(data.content, data.userId, data.sessionId, (chunk) => {
                streamer.sendContent(chunk, true);
            }, (result) => {
                streamer.sendDone({
                    sources: result.sources.map(s => ({
                        id: s.id,
                        title: s.title,
                        similarity: (s.similarity * 100).toFixed(1) + '%'
                    }))
                });
            }, (error) => {
                streamer.sendError(error);
            });
        }
        catch (error) {
            ai_config_1.logger.error('Error in streaming message:', error);
            streamer.sendError('Failed to process your message');
        }
    }
    async getStats(userId) {
        try {
            const where = userId ? { userId } : {};
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
            ]);
            const pipelineStats = await rag_pipeline_service_1.ragPipelineService.getPipelineStats();
            return {
                overview: {
                    totalSessions,
                    totalMessages,
                    avgMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0
                },
                recentSessions,
                pipelineStats
            };
        }
        catch (error) {
            ai_config_1.logger.error('Error getting chatbot stats:', error);
            throw app_error_1.AppError.internal('Failed to get chatbot statistics');
        }
    }
    async clearSessionHistory(sessionId, userId) {
        try {
            // Verify ownership
            const session = await prisma.chatSession.findFirst({
                where: {
                    id: sessionId,
                    userId
                }
            });
            if (!session) {
                throw app_error_1.AppError.notFound('Chat session');
            }
            // Delete all messages from session
            await prisma.chatMessage.deleteMany({
                where: { sessionId }
            });
            ai_config_1.logger.info('Cleared session history', { sessionId });
            return true;
        }
        catch (error) {
            ai_config_1.logger.error('Error clearing session history:', error);
            throw app_error_1.AppError.internal('Failed to clear session history');
        }
    }
    // ==================== KNOWLEDGE BASE ADMIN METHODS ====================
    async indexKnowledgeBase(forceReindex = false) {
        try {
            const result = await knowledge_base_service_1.knowledgeBaseService.indexKnowledgeBase(forceReindex);
            return result;
        }
        catch (error) {
            ai_config_1.logger.error('Error indexing knowledge base:', error);
            throw app_error_1.AppError.internal('Failed to index knowledge base');
        }
    }
    async getIndexStats() {
        try {
            const stats = await knowledge_base_service_1.knowledgeBaseService.getIndexStats();
            return stats;
        }
        catch (error) {
            ai_config_1.logger.error('Error getting index stats:', error);
            throw app_error_1.AppError.internal('Failed to get index statistics');
        }
    }
    async addKnowledgeEntry(data) {
        try {
            const entry = await knowledge_base_service_1.knowledgeBaseService.addKnowledgeEntry(data);
            return entry;
        }
        catch (error) {
            ai_config_1.logger.error('Error adding knowledge entry:', error);
            throw app_error_1.AppError.internal('Failed to add knowledge entry');
        }
    }
    async updateKnowledgeEntry(id, data) {
        try {
            const entry = await knowledge_base_service_1.knowledgeBaseService.updateKnowledgeEntry(id, data);
            return entry;
        }
        catch (error) {
            ai_config_1.logger.error('Error updating knowledge entry:', error);
            throw app_error_1.AppError.internal('Failed to update knowledge entry');
        }
    }
    async deleteKnowledgeEntry(id) {
        try {
            await knowledge_base_service_1.knowledgeBaseService.deleteKnowledgeEntry(id);
            return true;
        }
        catch (error) {
            ai_config_1.logger.error('Error deleting knowledge entry:', error);
            throw app_error_1.AppError.internal('Failed to delete knowledge entry');
        }
    }
}
exports.chatbotService = new ChatbotService();
//# sourceMappingURL=chatbot.service.js.map