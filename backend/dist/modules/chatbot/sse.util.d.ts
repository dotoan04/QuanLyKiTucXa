import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
export interface SSEEvent {
    type: 'content' | 'metadata' | 'error' | 'done';
    data: any;
}
export declare class SSEStreamer {
    private res;
    private isConnected;
    private buffer;
    constructor(res: Response);
    send(event: SSEEvent): void;
    sendContent(content: string, isStreaming?: boolean): void;
    sendError(error: string): void;
    sendDone(finalData?: any): void;
    end(): void;
}
export declare const streamClaudeResponse: (message: string, systemPrompt: string, streamer: SSEStreamer, claudeClient: Anthropic, model: string) => Promise<string>;
export declare const streamClaudeResponseWithRAG: (query: string, context: string, sources: Array<{
    id: string;
    title: string;
    similarity: number;
}>, systemPrompt: string, streamer: SSEStreamer, claudeClient: Anthropic, model: string, studentContext?: string) => Promise<string>;
export declare const validateSSEConnection: (req: Request) => boolean;
export declare const formatChatResponse: (text: string) => string;
export declare const extractCitations: (text: string) => string[];
//# sourceMappingURL=sse.util.d.ts.map