import { ChromaNotFoundError, ChromaUniqueError } from 'chromadb'
import { PrismaClient } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'
import { getChromaClient, chromaConfig, chromaKnowledgeEmbeddingFunction, createEmbedding, chunkText, logger, ragConfig } from './ai-config'

const prisma = new PrismaClient()

interface SearchResult {
  id: string
  title: string
  content: string
  similarity: number
  metadata: any
}

export interface IndexStats {
  totalDocuments: number
  totalChunks: number
  categories: string[]
  lastUpdated: Date | null
}

class KnowledgeBaseService {
  private collection: any = null
  /** Avoid parallel init races; never call `listCollections()` (loads every collection and spams default-embed warnings). */
  private collectionInit: Promise<any> | null = null

  private async openOrCreateCollection() {
    const client = await getChromaClient()
    try {
      return await client.getCollection({
        name: chromaConfig.collectionName,
        embeddingFunction: chromaKnowledgeEmbeddingFunction,
      })
    } catch (e) {
      if (e instanceof ChromaNotFoundError) {
        try {
          const created = await client.createCollection({
            name: chromaConfig.collectionName,
            embeddingFunction: chromaKnowledgeEmbeddingFunction,
            metadata: {
              'hnsw:space': 'cosine',
              'hnsw:construction_ef': 200,
              'hnsw:M': 32,
            },
          })
          logger.info(`Created new ChromaDB collection: ${chromaConfig.collectionName}`)
          return created
        } catch (e2) {
          if (e2 instanceof ChromaUniqueError) {
            return await client.getCollection({
              name: chromaConfig.collectionName,
              embeddingFunction: chromaKnowledgeEmbeddingFunction,
            })
          }
          throw e2
        }
      }
      throw e
    }
  }

  async getCollection() {
    if (this.collection) {
      return this.collection
    }
    if (!this.collectionInit) {
      this.collectionInit = this.openOrCreateCollection()
        .then((c) => {
          this.collection = c
          return c
        })
        .catch((err) => {
          this.collectionInit = null
          throw err
        })
    }
    return this.collectionInit
  }

  async indexKnowledgeBase(forceReindex: boolean = false) {
    try {
      logger.info('Starting knowledge base indexing...')

      const collection = await this.getCollection()

      // Get all active knowledge base entries from database
      const knowledgeEntries = await prisma.knowledgeBase.findMany({
        where: { isActive: true }
      })

      if (knowledgeEntries.length === 0) {
        logger.warn('No active knowledge base entries found')
        return {
          success: false,
          message: 'No knowledge base entries to index',
          indexed: 0
        }
      }

      // Check if collection has data and whether to force reindex
      if (!forceReindex) {
        const count = await collection.count()
        if (count > 0) {
          logger.info(`Collection already has ${count} documents. Skipping reindex.`)
          return {
            success: true,
            message: 'Knowledge base already indexed',
            indexed: knowledgeEntries.length
          }
        }
      }

      // Clear collection if force reindex
      if (forceReindex) {
        await collection.delete({
          where: {}
        })
        logger.info('Cleared existing collection for reindexing')
      }

      let totalIndexed = 0
      const batchSize = 10

      for (let i = 0; i < knowledgeEntries.length; i += batchSize) {
        const batch = knowledgeEntries.slice(i, i + batchSize)

        const ids: string[] = []
        const embeddings: number[][] = []
        const metadatas: any[] = []
        const documents: string[] = []

        for (const entry of batch) {
          // Chunk the content for better retrieval
          const chunks = chunkText(entry.content, 500, 100)

          for (let j = 0; j < chunks.length; j++) {
            const chunkId = `${entry.id}_chunk_${j}`

            // Create embedding for the chunk
            const embedding = await createEmbedding(chunks[j])

            ids.push(chunkId)
            embeddings.push(embedding)
            documents.push(chunks[j])
            metadatas.push({
              knowledgeId: entry.id,
              title: entry.title,
              category: entry.category,
              chunkIndex: j,
              totalChunks: chunks.length,
              createdAt: entry.createdAt.toISOString()
            })
          }
        }

        // Add batch to ChromaDB
        if (ids.length > 0) {
          await collection.add({
            ids,
            embeddings,
            metadatas,
            documents
          })

          totalIndexed += ids.length
          logger.info(`Indexed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(knowledgeEntries.length / batchSize)}: ${ids.length} chunks`)
        }
      }

      logger.info(`Knowledge base indexing completed. Total chunks indexed: ${totalIndexed}`)

      return {
        success: true,
        message: `Successfully indexed ${totalIndexed} chunks from ${knowledgeEntries.length} knowledge base entries`,
        indexed: totalIndexed
      }

    } catch (error) {
      logger.error('Error indexing knowledge base:', error)
      throw AppError.internal('Failed to index knowledge base')
    }
  }

  async search(query: string, limit: number = ragConfig.topK): Promise<SearchResult[]> {
    try {
      logger.rag('Searching knowledge base', { query, limit })

      const collection = await this.getCollection()
      const queryEmbedding = await createEmbedding(query)

      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        include: ['metadatas', 'documents', 'distances']
      })

      const searchResults: SearchResult[] = []

      if (results.ids && results.ids[0] && results.ids[0].length > 0) {
        const ids = results.ids[0]
        const documents = results.documents![0]
        const metadatas = results.metadatas![0]
        const distances = results.distances![0]

        // Filter by minimum similarity
        const filteredIndices = distances
          .map((dist: number, idx: number) => ({ idx, dist }))
          .filter(({ dist }: { dist: number }) => 1 - dist >= ragConfig.minSimilarity)
          .sort((a: { dist: number }, b: { dist: number }) => a.dist - b.dist)

        for (const { idx } of filteredIndices.slice(0, limit)) {
          const similarity = 1 - distances[idx] // Convert distance to similarity
          searchResults.push({
            id: metadatas[idx].knowledgeId,
            title: metadatas[idx].title,
            content: documents[idx],
            similarity,
            metadata: metadatas[idx]
          })
        }
      }

      logger.rag('Search completed', { resultsCount: searchResults.length, query })

      return searchResults

    } catch (error) {
      logger.error('Error searching knowledge base:', error)
      return []
    }
  }

  async addKnowledgeEntry(entry: {
    title: string
    content: string
    category: string
    isActive?: boolean
  }) {
    // Add to database
    const dbEntry = await prisma.knowledgeBase.create({
      data: {
        title: entry.title,
        content: entry.content,
        category: entry.category,
        isActive: entry.isActive !== undefined ? entry.isActive : true
      }
    })

    // Index immediately
    const collection = await this.getCollection()

    const chunks = chunkText(entry.content, 500, 100)
    const ids: string[] = []
    const embeddings: number[][] = []
    const metadatas: any[] = []
    const documents: string[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${dbEntry.id}_chunk_${i}`
      const embedding = await createEmbedding(chunks[i])

      ids.push(chunkId)
      embeddings.push(embedding)
      documents.push(chunks[i])
      metadatas.push({
        knowledgeId: dbEntry.id,
        title: dbEntry.title,
        category: dbEntry.category,
        chunkIndex: i,
        totalChunks: chunks.length,
        createdAt: dbEntry.createdAt.toISOString()
      })
    }

    await collection.add({
      ids,
      embeddings,
      metadatas,
      documents
    })

    logger.info(`Added knowledge entry with ${chunks.length} chunks`, { entryId: dbEntry.id })

    return dbEntry
  }

  async updateKnowledgeEntry(id: string, data: {
    title?: string
    content?: string
    category?: string
    isActive?: boolean
  }) {
    // Update in database
    const entry = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        isActive: data.isActive
      }
    })

    // Re-index the entry
    const collection = await this.getCollection()

    // Remove old chunks
    await collection.delete({
      where: {
        knowledgeId: id
      }
    })

    // Add new chunks if entry is active
    if (entry.isActive) {
      const chunks = chunkText(entry.content, 500, 100)
      const ids: string[] = []
      const embeddings: number[][] = []
      const metadatas: any[] = []
      const documents: string[] = []

      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${entry.id}_chunk_${i}`
        const embedding = await createEmbedding(chunks[i])

        ids.push(chunkId)
        embeddings.push(embedding)
        documents.push(chunks[i])
        metadatas.push({
          knowledgeId: entry.id,
          title: entry.title,
          category: entry.category,
          chunkIndex: i,
          totalChunks: chunks.length,
          createdAt: entry.createdAt.toISOString()
        })
      }

      await collection.add({
        ids,
        embeddings,
        metadatas,
        documents
      })
    }

    logger.info(`Updated knowledge entry`, { entryId: id })

    return entry
  }

  async deleteKnowledgeEntry(id: string) {
    // Delete from database
    await prisma.knowledgeBase.delete({
      where: { id }
    })

    // Remove from ChromaDB
    const collection = await this.getCollection()
    await collection.delete({
      where: {
        knowledgeId: id
      }
    })

    logger.info(`Deleted knowledge entry`, { entryId: id })

    return true
  }

  async getIndexStats(): Promise<IndexStats> {
    try {
      const collection = await this.getCollection()
      const count = await collection.count()

      const categories = await prisma.knowledgeBase.groupBy({
        by: ['category'],
        _count: {
          id: true
        },
        where: { isActive: true }
      })

      const lastUpdated = await prisma.knowledgeBase.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' }
      })

      return {
        totalDocuments: categories.reduce((sum, cat) => sum + cat._count.id, 0),
        totalChunks: count,
        categories: categories.map(cat => cat.category),
        lastUpdated: lastUpdated?.updatedAt || null
      }
    } catch (error) {
      logger.error('Error getting index stats:', error)
      return {
        totalDocuments: 0,
        totalChunks: 0,
        categories: [],
        lastUpdated: null
      }
    }
  }

  async searchDatabase(query: string, limit: number = 10) {
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
    })

    return results
  }
}

export const knowledgeBaseService = new KnowledgeBaseService()
