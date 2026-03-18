import Anthropic from '@anthropic-ai/sdk';
import { ChromaClient } from 'chromadb';
export declare const claudeConfig: {
    apiKey: string | undefined;
    model: string;
    maxTokens: number;
    temperature: number;
};
export declare const claudeClient: Anthropic;
export declare const chromaConfig: {
    path: string;
    host: string | undefined;
    port: number | undefined;
    collectionName: string;
};
export declare const getChromaClient: () => Promise<ChromaClient>;
export declare const embeddingConfig: {
    apiKey: string | undefined;
    model: string;
    dimensions: number;
};
export declare const createSimpleEmbedding: (text: string) => number[];
export declare const createEmbedding: (text: string) => Promise<number[]>;
export declare const chunkText: (text: string, maxChunkSize?: number, overlap?: number) => string[];
export declare const ragConfig: {
    topK: number;
    minSimilarity: number;
    contextWindow: number;
    systemPrompt: string;
};
export declare const loggingConfig: {
    enableDebug: boolean;
    logRAG: boolean;
};
export declare const logger: {
    debug: (message: string, data?: any) => void;
    rag: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
};
//# sourceMappingURL=ai-config.d.ts.map