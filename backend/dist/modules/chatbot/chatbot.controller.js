"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatbotController = void 0;
const chatbot_service_1 = require("./chatbot.service");
const response_1 = require("../../common/utils/response");
const sse_util_1 = require("./sse.util");
const ai_config_1 = require("./ai-config");
class ChatbotController {
    // ==================== SESSION MANAGEMENT ====================
    getSessions = async (req, res, _next) => {
        const limit = parseInt(req.query.limit) || 10;
        const sessions = await chatbot_service_1.chatbotService.getSessions(req.user.userId, limit);
        return (0, response_1.sendSuccess)(res, sessions);
    };
    getSession = async (req, res, _next) => {
        const session = await chatbot_service_1.chatbotService.getSession(req.params.id, req.user.userId);
        return (0, response_1.sendSuccess)(res, session);
    };
    createSession = async (req, res, _next) => {
        const session = await chatbot_service_1.chatbotService.createSession({
            userId: req.user.userId,
            title: req.body.title
        });
        return (0, response_1.sendCreated)(res, session, 'Chat session created successfully');
    };
    deleteSession = async (req, res, _next) => {
        await chatbot_service_1.chatbotService.deleteSession(req.params.id, req.user.userId);
        return (0, response_1.sendSuccess)(res, null, 'Chat session deleted successfully');
    };
    clearSessionHistory = async (req, res, _next) => {
        await chatbot_service_1.chatbotService.clearSessionHistory(req.params.id, req.user.userId);
        return (0, response_1.sendSuccess)(res, null, 'Session history cleared successfully');
    };
    // ==================== MESSAGING ====================
    getMessages = async (req, res, _next) => {
        const limit = parseInt(req.query.limit) || 50;
        const messages = await chatbot_service_1.chatbotService.getMessages(req.params.sessionId, req.user.userId, limit);
        return (0, response_1.sendSuccess)(res, messages);
    };
    sendMessage = async (req, res, _next) => {
        const result = await chatbot_service_1.chatbotService.sendMessage({
            sessionId: req.params.sessionId,
            userId: req.user.userId,
            content: req.body.content
        });
        return (0, response_1.sendSuccess)(res, result);
    };
    sendMessageStreaming = async (req, res, _next) => {
        try {
            // Validate SSE support
            if (!(0, sse_util_1.validateSSEConnection)(req)) {
                throw new Error('Client does not support SSE');
            }
            // Create SSE streamer
            const streamer = new sse_util_1.SSEStreamer(res);
            // Start streaming
            await chatbot_service_1.chatbotService.sendMessageStreaming({
                sessionId: req.params.sessionId,
                userId: req.user.userId,
                content: req.body.content
            }, streamer);
        }
        catch (error) {
            ai_config_1.logger.error('Error in streaming endpoint:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to start streaming',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    };
    // ==================== STATISTICS ====================
    getStats = async (req, res, _next) => {
        const stats = await chatbot_service_1.chatbotService.getStats(req.user.userId);
        return (0, response_1.sendSuccess)(res, stats);
    };
    getGlobalStats = async (_req, res, _next) => {
        const stats = await chatbot_service_1.chatbotService.getStats(); // No user filter for global stats
        return (0, response_1.sendSuccess)(res, stats);
    };
    // ==================== KNOWLEDGE BASE MANAGEMENT (ADMIN) ====================
    indexKnowledgeBase = async (req, res, _next) => {
        const forceReindex = req.body.forceReindex === true;
        const result = await chatbot_service_1.chatbotService.indexKnowledgeBase(forceReindex);
        return (0, response_1.sendSuccess)(res, result, result.message);
    };
    getIndexStats = async (_req, res, _next) => {
        const stats = await chatbot_service_1.chatbotService.getIndexStats();
        return (0, response_1.sendSuccess)(res, stats);
    };
    addKnowledgeEntry = async (req, res, _next) => {
        const entry = await chatbot_service_1.chatbotService.addKnowledgeEntry({
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            isActive: req.body.isActive
        });
        return (0, response_1.sendCreated)(res, entry, 'Knowledge entry added successfully');
    };
    updateKnowledgeEntry = async (req, res, _next) => {
        const entry = await chatbot_service_1.chatbotService.updateKnowledgeEntry(req.params.id, {
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            isActive: req.body.isActive
        });
        return (0, response_1.sendSuccess)(res, entry, 'Knowledge entry updated successfully');
    };
    deleteKnowledgeEntry = async (req, res, _next) => {
        await chatbot_service_1.chatbotService.deleteKnowledgeEntry(req.params.id);
        return (0, response_1.sendSuccess)(res, null, 'Knowledge entry deleted successfully');
    };
}
exports.chatbotController = new ChatbotController();
//# sourceMappingURL=chatbot.controller.js.map