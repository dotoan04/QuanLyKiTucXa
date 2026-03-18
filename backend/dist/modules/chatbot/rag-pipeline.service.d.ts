interface StudentContext {
    id: string;
    name: string;
    studentCode: string;
    faculty?: string;
    academicYear?: number;
    hasActiveContract: boolean;
    roomNumber?: string;
    building?: string;
    contractStatus?: string;
}
export interface RAGPipelineResult {
    answer: string;
    sources: Array<{
        id: string;
        title: string;
        similarity: number;
    }>;
    contextUsed: boolean;
    tokens: number;
}
interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: Array<{
        id: string;
        title: string;
        similarity: number;
    }>;
}
declare class RAGPipelineService {
    getStudentContext(userId: string): Promise<StudentContext | null>;
    buildStudentContextString(studentContext: StudentContext): Promise<string>;
    retrieveRelevantContext(query: string, studentContext?: StudentContext): Promise<{
        documents: string[];
        sources: Array<{
            id: string;
            title: string;
            similarity: number;
        }>;
    }>;
    constructEnhancedPrompt(query: string, context: string, sources: Array<{
        id: string;
        title: string;
        similarity: number;
    }>, studentContext?: StudentContext): Promise<string>;
    generateResponse(query: string, context: string, sources: Array<{
        id: string;
        title: string;
        similarity: number;
    }>, studentContext?: StudentContext): Promise<RAGPipelineResult>;
    executeRAGPipeline(query: string, userId: string, sessionId: string): Promise<RAGPipelineResult>;
    executeRAGPipelineStreaming(query: string, userId: string, sessionId: string, onChunk: (chunk: string) => void, onDone: (result: RAGPipelineResult) => void, onError: (error: string) => void): Promise<void>;
    getConversationHistory(sessionId: string, limit?: number): Promise<ConversationTurn[]>;
    constructConversationContext(history: ConversationTurn[]): Promise<string>;
    getPipelineStats(): Promise<{
        totalSessions: number;
        totalMessages: number;
        avgMessagesPerSession: number;
        knowledgeBaseIndexed: boolean;
        lastActivity: Date | null;
    }>;
}
export declare const ragPipelineService: RAGPipelineService;
export {};
//# sourceMappingURL=rag-pipeline.service.d.ts.map