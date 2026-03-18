"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragPipelineService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const knowledge_base_service_1 = require("./knowledge-base.service");
const ai_config_1 = require("./ai-config");
const prisma = new client_1.PrismaClient();
class RAGPipelineService {
    async getStudentContext(userId) {
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
                        take: 1
                    }
                }
            });
            if (!student) {
                return null;
            }
            const activeContract = student.contracts[0];
            return {
                id: student.id,
                name: student.user.fullName,
                studentCode: student.studentCode,
                faculty: student.faculty ?? undefined,
                academicYear: student.academicYear ?? undefined,
                hasActiveContract: activeContract !== undefined,
                roomNumber: activeContract?.room.roomNumber,
                building: activeContract?.room.building,
                contractStatus: activeContract?.status ?? undefined
            };
        }
        catch (error) {
            ai_config_1.logger.error('Error getting student context:', error);
            return null;
        }
    }
    async buildStudentContextString(studentContext) {
        if (!studentContext) {
            return '';
        }
        const parts = [];
        parts.push(`Name: ${studentContext.name}`);
        parts.push(`Student Code: ${studentContext.studentCode}`);
        if (studentContext.faculty) {
            parts.push(`Faculty: ${studentContext.faculty}`);
        }
        if (studentContext.academicYear) {
            parts.push(`Academic Year: ${studentContext.academicYear}`);
        }
        if (studentContext.hasActiveContract) {
            parts.push(`Room: ${studentContext.roomNumber} (${studentContext.building})`);
        }
        else {
            parts.push(`Status: No active room contract`);
        }
        return `Student Information:\n${parts.join('\n')}`;
    }
    async retrieveRelevantContext(query, studentContext) {
        try {
            ai_config_1.logger.rag('Retrieving relevant context', { query, hasStudentContext: !!studentContext });
            // Search knowledge base
            const searchResults = await knowledge_base_service_1.knowledgeBaseService.search(query, ai_config_1.ragConfig.topK);
            if (searchResults.length === 0) {
                ai_config_1.logger.rag('No relevant documents found', { query });
                return {
                    documents: [],
                    sources: []
                };
            }
            // Prepare context from search results
            const documents = searchResults.map(result => result.content);
            const sources = searchResults.map(result => ({
                id: result.id,
                title: result.title,
                similarity: result.similarity
            }));
            ai_config_1.logger.rag('Context retrieved', {
                query,
                documentsCount: documents.length,
                sourcesCount: sources.length,
                avgSimilarity: sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length
            });
            return {
                documents,
                sources
            };
        }
        catch (error) {
            ai_config_1.logger.error('Error retrieving relevant context:', error);
            return {
                documents: [],
                sources: []
            };
        }
    }
    async constructEnhancedPrompt(query, context, sources, studentContext) {
        let enhancedPrompt = ai_config_1.ragConfig.systemPrompt;
        // Add knowledge base context
        if (context && sources.length > 0) {
            enhancedPrompt += `\n\nRelevant Information:\n${context}\n\n`;
            enhancedPrompt += `Use this information to provide accurate answers. If the information doesn't contain the answer, acknowledge this and suggest contacting the dormitory staff.`;
        }
        // Add student context
        if (studentContext) {
            const studentContextStr = await this.buildStudentContextString(studentContext);
            enhancedPrompt += `\n\n${studentContextStr}\n\n`;
            enhancedPrompt += `Consider this student's information when answering questions about their specific situation (e.g., "my room", "my contract", etc.).`;
        }
        // Add source references
        if (sources.length > 0) {
            enhancedPrompt += `\n\nAvailable Sources:\n`;
            sources.forEach((source, index) => {
                enhancedPrompt += `${index + 1}. ${source.title} (relevance: ${(source.similarity * 100).toFixed(1)}%)\n`;
            });
        }
        // Add instructions
        enhancedPrompt += `\n\nInstructions:`;
        enhancedPrompt += `\n- Be helpful, accurate, and respectful`;
        enhancedPrompt += `\n- If information is incomplete or uncertain, acknowledge it`;
        enhancedPrompt += `\n- If you use information from sources, mention the source`;
        enhancedPrompt += `\n- Keep responses concise but comprehensive`;
        enhancedPrompt += `\n- Respond in Vietnamese if the user asks in Vietnamese`;
        return enhancedPrompt;
    }
    async generateResponse(query, context, sources, studentContext) {
        try {
            ai_config_1.logger.info('Generating AI response', { query, contextLength: context.length, hasStudentContext: !!studentContext });
            // Build enhanced prompt
            const systemPrompt = await this.constructEnhancedPrompt(query, context, sources, studentContext);
            // Generate response using Claude
            const response = await ai_config_1.claudeClient.messages.create({
                model: ai_config_1.claudeConfig.model,
                max_tokens: ai_config_1.claudeConfig.maxTokens,
                temperature: ai_config_1.claudeConfig.temperature,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: query
                    }
                ]
            });
            const answer = response.content[0].type === 'text'
                ? response.content[0].text
                : 'Sorry, I could not generate a response.';
            ai_config_1.logger.info('AI response generated', {
                query,
                answerLength: answer.length,
                tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
                sourcesCount: sources.length
            });
            return {
                answer,
                sources,
                contextUsed: context.length > 0,
                tokens: response.usage.input_tokens + response.usage.output_tokens
            };
        }
        catch (error) {
            ai_config_1.logger.error('Error generating AI response:', error);
            throw app_error_1.AppError.internal('Failed to generate AI response');
        }
    }
    async executeRAGPipeline(query, userId, sessionId) {
        try {
            // Step 1: Get student context
            const studentContext = await this.getStudentContext(userId);
            // Step 2: Retrieve relevant context
            const { documents, sources } = await this.retrieveRelevantContext(query, studentContext ?? undefined);
            // Step 3: Construct enhanced prompt
            const context = documents.length > 0 ? documents.join('\n\n---\n\n') : '';
            // Step 4: Generate response
            const result = await this.generateResponse(query, context, sources, studentContext ?? undefined);
            // Step 5: Save conversation turn
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
            });
            return result;
        }
        catch (error) {
            ai_config_1.logger.error('Error executing RAG pipeline:', error);
            throw app_error_1.AppError.internal('Failed to process your request');
        }
    }
    async executeRAGPipelineStreaming(query, userId, sessionId, onChunk, onDone, onError) {
        try {
            ai_config_1.logger.info('Starting RAG pipeline streaming', { query, userId, sessionId });
            // Step 1: Get student context
            const studentContext = await this.getStudentContext(userId);
            // Step 2: Retrieve relevant context
            const { documents, sources } = await this.retrieveRelevantContext(query, studentContext ?? undefined);
            // Step 3: Construct enhanced prompt
            const context = documents.length > 0 ? documents.join('\n\n---\n\n') : '';
            const systemPrompt = await this.constructEnhancedPrompt(query, context, sources, studentContext ?? undefined);
            // Step 4: Stream response
            const stream = await ai_config_1.claudeClient.messages.stream({
                model: ai_config_1.claudeConfig.model,
                max_tokens: ai_config_1.claudeConfig.maxTokens,
                temperature: ai_config_1.claudeConfig.temperature,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: query
                    }
                ]
            });
            let fullContent = '';
            let totalTokens = 0;
            for await (const event of stream) {
                if (event.type === 'content_block_delta') {
                    if (event.delta.type === 'text_delta') {
                        const text = event.delta.text;
                        fullContent += text;
                        onChunk(text);
                    }
                }
                if (event.type === 'message_delta') {
                    if (event.usage) {
                        totalTokens = event.usage.output_tokens;
                    }
                }
            }
            const result = {
                answer: fullContent,
                sources,
                contextUsed: context.length > 0,
                tokens: totalTokens
            };
            // Step 5: Save conversation turn
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
            });
            onDone(result);
            ai_config_1.logger.info('RAG pipeline streaming completed', { answerLength: fullContent.length, tokensUsed: totalTokens });
        }
        catch (error) {
            ai_config_1.logger.error('Error in RAG pipeline streaming:', error);
            onError('Failed to process your request');
        }
    }
    async getConversationHistory(sessionId, limit = 10) {
        const messages = await prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
            take: limit
        });
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.createdAt,
            sources: msg.sources
        }));
    }
    async constructConversationContext(history) {
        if (history.length === 0) {
            return '';
        }
        let context = 'Previous conversation:\n';
        for (const turn of history.slice(-5)) { // Only use last 5 turns
            const roleLabel = turn.role === 'user' ? 'Student' : 'AI Assistant';
            context += `\n${roleLabel}: ${turn.content}\n`;
        }
        return context;
    }
    async getPipelineStats() {
        const [totalSessions, totalMessages, lastMessage] = await Promise.all([
            prisma.chatSession.count(),
            prisma.chatMessage.count(),
            prisma.chatMessage.findFirst({
                orderBy: { createdAt: 'desc' }
            })
        ]);
        const indexStats = await knowledge_base_service_1.knowledgeBaseService.getIndexStats();
        return {
            totalSessions,
            totalMessages,
            avgMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0,
            knowledgeBaseIndexed: indexStats.totalChunks > 0,
            lastActivity: lastMessage?.createdAt || null
        };
    }
}
exports.ragPipelineService = new RAGPipelineService();
//# sourceMappingURL=rag-pipeline.service.js.map