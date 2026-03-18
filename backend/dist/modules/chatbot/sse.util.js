"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCitations = exports.formatChatResponse = exports.validateSSEConnection = exports.streamClaudeResponseWithRAG = exports.streamClaudeResponse = exports.SSEStreamer = void 0;
const ai_config_1 = require("./ai-config");
class SSEStreamer {
    res;
    isConnected = true;
    buffer = [];
    constructor(res) {
        this.res = res;
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        // Send initial event
        this.send({
            type: 'metadata',
            data: {
                timestamp: new Date().toISOString(),
                status: 'connected'
            }
        });
        // Handle client disconnect
        res.on('close', () => {
            this.isConnected = false;
            ai_config_1.logger.info('SSE connection closed');
        });
    }
    send(event) {
        if (!this.isConnected) {
            return;
        }
        try {
            const eventData = JSON.stringify(event.data);
            const message = `event: ${event.type}\ndata: ${eventData}\n\n`;
            this.res.write(message);
        }
        catch (error) {
            ai_config_1.logger.error('Error sending SSE message:', error);
            this.isConnected = false;
        }
    }
    sendContent(content, isStreaming = false) {
        this.send({
            type: 'content',
            data: {
                content,
                isStreaming
            }
        });
    }
    sendError(error) {
        this.send({
            type: 'error',
            data: {
                error,
                timestamp: new Date().toISOString()
            }
        });
    }
    sendDone(finalData) {
        this.send({
            type: 'done',
            data: {
                timestamp: new Date().toISOString(),
                ...finalData
            }
        });
    }
    end() {
        if (this.isConnected) {
            this.isConnected = false;
            this.res.end();
        }
    }
}
exports.SSEStreamer = SSEStreamer;
// Stream Claude API response via SSE
const streamClaudeResponse = async (message, systemPrompt, streamer, claudeClient, model) => {
    try {
        ai_config_1.logger.info('Starting Claude API streaming');
        const stream = await claudeClient.messages.stream({
            model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                { role: 'user', content: message }
            ]
        });
        let fullContent = '';
        for await (const event of stream) {
            if (event.type === 'content_block_delta') {
                if (event.delta.type === 'text_delta') {
                    const text = event.delta.text;
                    fullContent += text;
                    streamer.sendContent(text, true);
                }
            }
        }
        streamer.sendDone({ totalTokens: fullContent.length });
        return fullContent;
    }
    catch (error) {
        ai_config_1.logger.error('Error streaming Claude response:', error);
        streamer.sendError('Failed to generate AI response');
        throw error;
    }
};
exports.streamClaudeResponse = streamClaudeResponse;
// Stream with RAG context
const streamClaudeResponseWithRAG = async (query, context, sources, systemPrompt, streamer, claudeClient, model, studentContext) => {
    try {
        ai_config_1.logger.info('Starting Claude API streaming with RAG context');
        // Build enhanced prompt
        let enhancedPrompt = systemPrompt;
        if (context) {
            enhancedPrompt += `\n\nHere is relevant information from the knowledge base:\n${context}\n\nUse this information to provide accurate answers. If the information doesn't contain the answer, say so and suggest contacting the staff.`;
        }
        if (studentContext) {
            enhancedPrompt += `\n\nStudent Context:\n${studentContext}`;
        }
        enhancedPrompt += `\n\nSources:\n${sources.map(s => `- ${s.title} (relevance: ${(s.similarity * 100).toFixed(1)}%)`).join('\n')}`;
        ai_config_1.logger.rag('Enhanced prompt created', { query, contextLength: context.length, sourcesCount: sources.length });
        const stream = await claudeClient.messages.stream({
            model,
            max_tokens: 4096,
            system: enhancedPrompt,
            messages: [
                { role: 'user', content: query }
            ]
        });
        let fullContent = '';
        for await (const event of stream) {
            if (event.type === 'content_block_delta') {
                if (event.delta.type === 'text_delta') {
                    const text = event.delta.text;
                    fullContent += text;
                    streamer.sendContent(text, true);
                }
            }
        }
        // Send sources with the final done event
        streamer.sendDone({
            totalTokens: fullContent.length,
            sources: sources.map(s => ({
                id: s.id,
                title: s.title,
                similarity: (s.similarity * 100).toFixed(1) + '%'
            }))
        });
        return fullContent;
    }
    catch (error) {
        ai_config_1.logger.error('Error streaming Claude response with RAG:', error);
        streamer.sendError('Failed to generate AI response');
        throw error;
    }
};
exports.streamClaudeResponseWithRAG = streamClaudeResponseWithRAG;
// Utility for SSE response validation
const validateSSEConnection = (req) => {
    // Check if client supports SSE
    const accept = req.headers.accept || '';
    return accept.includes('text/event-stream');
};
exports.validateSSEConnection = validateSSEConnection;
// Format text for better display
const formatChatResponse = (text) => {
    // Remove excessive whitespace
    let formatted = text.replace(/\s+/g, ' ').trim();
    // Add line breaks for better readability
    formatted = formatted.replace(/\. /g, '.\n\n');
    formatted = formatted.replace(/\? /g, '?\n\n');
    formatted = formatted.replace(/! /g, '!\n\n');
    return formatted;
};
exports.formatChatResponse = formatChatResponse;
// Extract citations from AI response
const extractCitations = (text) => {
    const citationPattern = /\[source:(\d+)\]/g;
    const citations = [];
    let match;
    while ((match = citationPattern.exec(text)) !== null) {
        citations.push(match[1]);
    }
    return citations;
};
exports.extractCitations = extractCitations;
//# sourceMappingURL=sse.util.js.map