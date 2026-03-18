"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeBaseService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/utils/app-error");
const ai_config_1 = require("./ai-config");
const prisma = new client_1.PrismaClient();
class KnowledgeBaseService {
    collection = null;
    async getCollection() {
        if (!this.collection) {
            const client = await (0, ai_config_1.getChromaClient)();
            const collections = await client.listCollections();
            let collectionExists = false;
            for (const col of collections) {
                if (col.name === ai_config_1.chromaConfig.collectionName) {
                    collectionExists = true;
                    break;
                }
            }
            if (collectionExists) {
                this.collection = await client.getCollection({
                    name: ai_config_1.chromaConfig.collectionName
                });
            }
            else {
                this.collection = await client.createCollection({
                    name: ai_config_1.chromaConfig.collectionName,
                    metadata: {
                        "hnsw:space": "cosine",
                        "hnsw:construction_ef": 200,
                        "hnsw:M": 32
                    }
                });
                ai_config_1.logger.info(`Created new ChromaDB collection: ${ai_config_1.chromaConfig.collectionName}`);
            }
        }
        return this.collection;
    }
    async indexKnowledgeBase(forceReindex = false) {
        try {
            ai_config_1.logger.info('Starting knowledge base indexing...');
            const collection = await this.getCollection();
            // Get all active knowledge base entries from database
            const knowledgeEntries = await prisma.knowledgeBase.findMany({
                where: { isActive: true }
            });
            if (knowledgeEntries.length === 0) {
                ai_config_1.logger.warn('No active knowledge base entries found');
                return {
                    success: false,
                    message: 'No knowledge base entries to index',
                    indexed: 0
                };
            }
            // Check if collection has data and whether to force reindex
            if (!forceReindex) {
                const count = await collection.count();
                if (count > 0) {
                    ai_config_1.logger.info(`Collection already has ${count} documents. Skipping reindex.`);
                    return {
                        success: true,
                        message: 'Knowledge base already indexed',
                        indexed: knowledgeEntries.length
                    };
                }
            }
            // Clear collection if force reindex
            if (forceReindex) {
                await collection.delete({
                    where: {}
                });
                ai_config_1.logger.info('Cleared existing collection for reindexing');
            }
            let totalIndexed = 0;
            const batchSize = 10;
            for (let i = 0; i < knowledgeEntries.length; i += batchSize) {
                const batch = knowledgeEntries.slice(i, i + batchSize);
                const ids = [];
                const embeddings = [];
                const metadatas = [];
                const documents = [];
                for (const entry of batch) {
                    // Chunk the content for better retrieval
                    const chunks = (0, ai_config_1.chunkText)(entry.content, 500, 100);
                    for (let j = 0; j < chunks.length; j++) {
                        const chunkId = `${entry.id}_chunk_${j}`;
                        // Create embedding for the chunk
                        const embedding = await (0, ai_config_1.createEmbedding)(chunks[j]);
                        ids.push(chunkId);
                        embeddings.push(embedding);
                        documents.push(chunks[j]);
                        metadatas.push({
                            knowledgeId: entry.id,
                            title: entry.title,
                            category: entry.category,
                            chunkIndex: j,
                            totalChunks: chunks.length,
                            createdAt: entry.createdAt.toISOString()
                        });
                    }
                }
                // Add batch to ChromaDB
                if (ids.length > 0) {
                    await collection.add({
                        ids,
                        embeddings,
                        metadatas,
                        documents
                    });
                    totalIndexed += ids.length;
                    ai_config_1.logger.info(`Indexed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(knowledgeEntries.length / batchSize)}: ${ids.length} chunks`);
                }
            }
            ai_config_1.logger.info(`Knowledge base indexing completed. Total chunks indexed: ${totalIndexed}`);
            return {
                success: true,
                message: `Successfully indexed ${totalIndexed} chunks from ${knowledgeEntries.length} knowledge base entries`,
                indexed: totalIndexed
            };
        }
        catch (error) {
            ai_config_1.logger.error('Error indexing knowledge base:', error);
            throw app_error_1.AppError.internal('Failed to index knowledge base');
        }
    }
    async search(query, limit = ai_config_1.ragConfig.topK) {
        try {
            ai_config_1.logger.rag('Searching knowledge base', { query, limit });
            const collection = await this.getCollection();
            const queryEmbedding = await (0, ai_config_1.createEmbedding)(query);
            const results = await collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: limit,
                include: ['metadatas', 'documents', 'distances']
            });
            const searchResults = [];
            if (results.ids && results.ids[0] && results.ids[0].length > 0) {
                const ids = results.ids[0];
                const documents = results.documents[0];
                const metadatas = results.metadatas[0];
                const distances = results.distances[0];
                // Filter by minimum similarity
                const filteredIndices = distances
                    .map((dist, idx) => ({ idx, dist }))
                    .filter(({ dist }) => 1 - dist >= ai_config_1.ragConfig.minSimilarity)
                    .sort((a, b) => a.dist - b.dist);
                for (const { idx } of filteredIndices.slice(0, limit)) {
                    const similarity = 1 - distances[idx]; // Convert distance to similarity
                    searchResults.push({
                        id: metadatas[idx].knowledgeId,
                        title: metadatas[idx].title,
                        content: documents[idx],
                        similarity,
                        metadata: metadatas[idx]
                    });
                }
            }
            ai_config_1.logger.rag('Search completed', { resultsCount: searchResults.length, query });
            return searchResults;
        }
        catch (error) {
            ai_config_1.logger.error('Error searching knowledge base:', error);
            return [];
        }
    }
    async addKnowledgeEntry(entry) {
        // Add to database
        const dbEntry = await prisma.knowledgeBase.create({
            data: {
                title: entry.title,
                content: entry.content,
                category: entry.category,
                isActive: entry.isActive !== undefined ? entry.isActive : true
            }
        });
        // Index immediately
        const collection = await this.getCollection();
        const chunks = (0, ai_config_1.chunkText)(entry.content, 500, 100);
        const ids = [];
        const embeddings = [];
        const metadatas = [];
        const documents = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunkId = `${dbEntry.id}_chunk_${i}`;
            const embedding = await (0, ai_config_1.createEmbedding)(chunks[i]);
            ids.push(chunkId);
            embeddings.push(embedding);
            documents.push(chunks[i]);
            metadatas.push({
                knowledgeId: dbEntry.id,
                title: dbEntry.title,
                category: dbEntry.category,
                chunkIndex: i,
                totalChunks: chunks.length,
                createdAt: dbEntry.createdAt.toISOString()
            });
        }
        await collection.add({
            ids,
            embeddings,
            metadatas,
            documents
        });
        ai_config_1.logger.info(`Added knowledge entry with ${chunks.length} chunks`, { entryId: dbEntry.id });
        return dbEntry;
    }
    async updateKnowledgeEntry(id, data) {
        // Update in database
        const entry = await prisma.knowledgeBase.update({
            where: { id },
            data: {
                title: data.title,
                content: data.content,
                category: data.category,
                isActive: data.isActive
            }
        });
        // Re-index the entry
        const collection = await this.getCollection();
        // Remove old chunks
        await collection.delete({
            where: {
                knowledgeId: id
            }
        });
        // Add new chunks if entry is active
        if (entry.isActive) {
            const chunks = (0, ai_config_1.chunkText)(entry.content, 500, 100);
            const ids = [];
            const embeddings = [];
            const metadatas = [];
            const documents = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunkId = `${entry.id}_chunk_${i}`;
                const embedding = await (0, ai_config_1.createEmbedding)(chunks[i]);
                ids.push(chunkId);
                embeddings.push(embedding);
                documents.push(chunks[i]);
                metadatas.push({
                    knowledgeId: entry.id,
                    title: entry.title,
                    category: entry.category,
                    chunkIndex: i,
                    totalChunks: chunks.length,
                    createdAt: entry.createdAt.toISOString()
                });
            }
            await collection.add({
                ids,
                embeddings,
                metadatas,
                documents
            });
        }
        ai_config_1.logger.info(`Updated knowledge entry`, { entryId: id });
        return entry;
    }
    async deleteKnowledgeEntry(id) {
        // Delete from database
        await prisma.knowledgeBase.delete({
            where: { id }
        });
        // Remove from ChromaDB
        const collection = await this.getCollection();
        await collection.delete({
            where: {
                knowledgeId: id
            }
        });
        ai_config_1.logger.info(`Deleted knowledge entry`, { entryId: id });
        return true;
    }
    async getIndexStats() {
        try {
            const collection = await this.getCollection();
            const count = await collection.count();
            const categories = await prisma.knowledgeBase.groupBy({
                by: ['category'],
                _count: {
                    id: true
                },
                where: { isActive: true }
            });
            const lastUpdated = await prisma.knowledgeBase.findFirst({
                where: { isActive: true },
                orderBy: { updatedAt: 'desc' }
            });
            return {
                totalDocuments: categories.reduce((sum, cat) => sum + cat._count.id, 0),
                totalChunks: count,
                categories: categories.map(cat => cat.category),
                lastUpdated: lastUpdated?.updatedAt || null
            };
        }
        catch (error) {
            ai_config_1.logger.error('Error getting index stats:', error);
            return {
                totalDocuments: 0,
                totalChunks: 0,
                categories: [],
                lastUpdated: null
            };
        }
    }
    async searchDatabase(query, limit = 10) {
        const results = await prisma.knowledgeBase.findMany({
            where: {
                isActive: true,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { content: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: limit,
            orderBy: { updatedAt: 'desc' }
        });
        return results;
    }
}
exports.knowledgeBaseService = new KnowledgeBaseService();
//# sourceMappingURL=knowledge-base.service.js.map