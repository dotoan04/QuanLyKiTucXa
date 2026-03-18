"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.loggingConfig = exports.ragConfig = exports.chunkText = exports.createEmbedding = exports.createSimpleEmbedding = exports.embeddingConfig = exports.getChromaClient = exports.chromaConfig = exports.claudeClient = exports.claudeConfig = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const chromadb_1 = require("chromadb");
// Claude API Configuration
exports.claudeConfig = {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    maxTokens: parseInt(process.env.MAX_TOKENS || '4096'),
    temperature: parseFloat(process.env.TEMPERATURE || '0.7')
};
// Initialize Claude Client
exports.claudeClient = new sdk_1.default({
    apiKey: exports.claudeConfig.apiKey
});
// ChromaDB Configuration
exports.chromaConfig = {
    path: process.env.CHROMADB_PATH || './chroma_db',
    host: process.env.CHROMADB_HOST,
    port: process.env.CHROMADB_PORT ? parseInt(process.env.CHROMADB_PORT) : undefined,
    collectionName: 'ktx_knowledge_base'
};
// Initialize ChromaDB Client
let chromaClient = null;
const getChromaClient = async () => {
    if (!chromaClient) {
        if (exports.chromaConfig.host && exports.chromaConfig.port) {
            // Remote ChromaDB
            chromaClient = new chromadb_1.ChromaClient({
                path: `http://${exports.chromaConfig.host}:${exports.chromaConfig.port}`
            });
        }
        else {
            // Local ChromaDB
            chromaClient = new chromadb_1.ChromaClient({
                path: exports.chromaConfig.path
            });
        }
    }
    return chromaClient;
};
exports.getChromaClient = getChromaClient;
// Embedding Configuration (using OpenAI as per original spec)
exports.embeddingConfig = {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
    dimensions: 1536
};
// Simple text embedding function (fallback if no API key)
const createSimpleEmbedding = (text) => {
    // This is a very basic embedding for fallback
    // In production, use OpenAI embeddings or another proper embedding service
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const embedding = new Array(1536).fill(0);
    // Simple hash-based embedding
    words.forEach((word, i) => {
        const hash = simpleHash(word);
        const index = hash % 1536;
        embedding[index] += 1 / (i + 1); // Diminishing weight for position
    });
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
};
exports.createSimpleEmbedding = createSimpleEmbedding;
const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};
// Proper embedding function (requires OpenAI API key)
const createEmbedding = async (text) => {
    if (!exports.embeddingConfig.apiKey) {
        console.warn('No OpenAI API key found, using simple embedding fallback');
        return (0, exports.createSimpleEmbedding)(text);
    }
    try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${exports.embeddingConfig.apiKey}`
            },
            body: JSON.stringify({
                model: exports.embeddingConfig.model,
                input: text
            })
        });
        const data = await response.json();
        const embedding = data.data?.[0]?.embedding;
        if (!embedding) {
            throw new Error('Invalid embedding response');
        }
        return embedding;
    }
    catch (error) {
        console.error('Error creating embedding:', error);
        console.warn('Falling back to simple embedding');
        return (0, exports.createSimpleEmbedding)(text);
    }
};
exports.createEmbedding = createEmbedding;
// Text chunking for large documents
const chunkText = (text, maxChunkSize = 1000, overlap = 200) => {
    const chunks = [];
    let startIndex = 0;
    while (startIndex < text.length) {
        let endIndex = startIndex + maxChunkSize;
        // Don't split in the middle of a sentence if possible
        if (endIndex < text.length) {
            const nextPeriod = text.indexOf('.', endIndex - 100);
            const nextQuestion = text.indexOf('?', endIndex - 100);
            const nextExclamation = text.indexOf('!', endIndex - 100);
            const sentenceEnd = Math.max(nextPeriod !== -1 ? nextPeriod : -1, nextQuestion !== -1 ? nextQuestion : -1, nextExclamation !== -1 ? nextExclamation : -1);
            if (sentenceEnd > startIndex && sentenceEnd < endIndex + 50) {
                endIndex = sentenceEnd + 1;
            }
            else {
                // Try to split at word boundary
                const lastSpace = text.lastIndexOf(' ', endIndex);
                if (lastSpace > startIndex) {
                    endIndex = lastSpace;
                }
            }
        }
        chunks.push(text.slice(startIndex, endIndex));
        startIndex = endIndex - overlap;
    }
    return chunks;
};
exports.chunkText = chunkText;
// RAG Configuration
exports.ragConfig = {
    topK: parseInt(process.env.TOP_K || '5'), // Number of relevant documents to retrieve
    minSimilarity: parseFloat(process.env.MIN_SIMILARITY || '0.7'), // Minimum similarity score
    contextWindow: parseInt(process.env.CONTEXT_WINDOW || '8000'), // Maximum context tokens
    systemPrompt: `You are a helpful AI assistant for a university dormitory management system (Ký Túc Xá). Your role is to help students with questions about:

1. Room registration and rental policies
2. Fee payments and invoices
3. Dormitory rules and regulations
4. Room facilities and amenities
5. Maintenance and incident reporting
6. General dormitory services

Always be helpful, accurate, and respectful. If you're unsure about something, admit it and suggest contacting the dormitory staff. Use a friendly, professional tone suitable for Vietnamese university students.`
};
// Logging configuration
exports.loggingConfig = {
    enableDebug: process.env.DEBUG === 'true',
    logRAG: process.env.LOG_RAG === 'true'
};
exports.logger = {
    debug: (message, data) => {
        if (exports.loggingConfig.enableDebug) {
            console.log(`[DEBUG] ${message}`, data || '');
        }
    },
    rag: (message, data) => {
        if (exports.loggingConfig.logRAG) {
            console.log(`[RAG] ${message}`, data || '');
        }
    },
    error: (message, error) => {
        console.error(`[ERROR] ${message}`, error || '');
    },
    info: (message, data) => {
        console.log(`[INFO] ${message}`, data || '');
    },
    warn: (message, data) => {
        console.warn(`[WARN] ${message}`, data || '');
    }
};
//# sourceMappingURL=ai-config.js.map