import { SSEStreamer } from './sse.util';
interface CreateSessionInput {
    userId: string;
    title?: string;
}
interface SendMessageInput {
    sessionId: string;
    userId: string;
    content: string;
}
declare class ChatbotService {
    createSession(data: CreateSessionInput): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string | null;
    }>;
    getSessions(userId: string, limit?: number): Promise<({
        _count: {
            messages: number;
        };
        messages: {
            id: string;
            role: import("@prisma/client").$Enums.ChatRole;
            createdAt: Date;
            content: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        title: string | null;
    })[]>;
    getSession(sessionId: string, userId: string): Promise<{
        messages: {
            id: string;
            role: import("@prisma/client").$Enums.ChatRole;
            createdAt: Date;
            content: string;
            sources: import("@prisma/client/runtime/library").JsonValue | null;
            sessionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        title: string | null;
    }>;
    deleteSession(sessionId: string, userId: string): Promise<boolean>;
    sendMessage(data: SendMessageInput): Promise<{
        userMessage: {
            id: string;
            role: import("@prisma/client").$Enums.ChatRole;
            createdAt: Date;
            content: string;
            sources: import("@prisma/client/runtime/library").JsonValue | null;
            sessionId: string;
        };
        assistantMessage: {
            id: string;
            sessionId: string;
            role: string;
            content: string;
            sources: {
                id: string;
                title: string;
                similarity: number;
            }[];
            createdAt: Date;
        };
        ragResult: import("./rag-pipeline.service").RAGPipelineResult;
    }>;
    getMessages(sessionId: string, userId: string, limit?: number): Promise<{
        id: string;
        role: import("@prisma/client").$Enums.ChatRole;
        createdAt: Date;
        content: string;
        sources: import("@prisma/client/runtime/library").JsonValue | null;
        sessionId: string;
    }[]>;
    sendMessageStreaming(data: SendMessageInput, streamer: SSEStreamer): Promise<void>;
    getStats(userId?: string): Promise<{
        overview: {
            totalSessions: number;
            totalMessages: number;
            avgMessagesPerSession: number;
        };
        recentSessions: ({
            _count: {
                messages: number;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            title: string | null;
        })[];
        pipelineStats: {
            totalSessions: number;
            totalMessages: number;
            avgMessagesPerSession: number;
            knowledgeBaseIndexed: boolean;
            lastActivity: Date | null;
        };
    }>;
    clearSessionHistory(sessionId: string, userId: string): Promise<boolean>;
    indexKnowledgeBase(forceReindex?: boolean): Promise<{
        success: boolean;
        message: string;
        indexed: number;
    }>;
    getIndexStats(): Promise<import("./knowledge-base.service").IndexStats>;
    addKnowledgeEntry(data: {
        title: string;
        content: string;
        category: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        title: string;
        content: string;
    }>;
    updateKnowledgeEntry(id: string, data: {
        title?: string;
        content?: string;
        category?: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        title: string;
        content: string;
    }>;
    deleteKnowledgeEntry(id: string): Promise<boolean>;
}
export declare const chatbotService: ChatbotService;
export {};
//# sourceMappingURL=chatbot.service.d.ts.map