import { QdrantClient } from "@qdrant/js-client-rest"
import type { DocumentChunk, SearchResult, Document } from "./types"
import { RAG_CONFIG } from "./config"
import { MockQdrantService } from "./mock-qdrant"

export class QdrantService {
  private client: QdrantClient | null = null
  private collectionName: string
  private isConnected = false

  constructor() {
    this.collectionName = RAG_CONFIG.qdrant.collectionName

    // Only initialize client if we have proper config
    if (RAG_CONFIG.qdrant.url && RAG_CONFIG.qdrant.url !== "http://localhost:6333") {
      try {
        this.client = new QdrantClient({
          url: RAG_CONFIG.qdrant.url,
          apiKey: RAG_CONFIG.qdrant.apiKey,
        })
      } catch (error) {
        console.warn("[v0] Failed to initialize Qdrant client:", error)
      }
    }
  }

  /**
   * Initialize the Qdrant collection if it doesn't exist
   */
  async initializeCollection(): Promise<void> {
    if (!this.client) {
      console.log("[v0] No Qdrant client available, skipping collection initialization")
      return
    }

    try {
      // Check if collection exists
      const collections = await this.client.getCollections()
      const collectionExists = collections.collections.some((collection) => collection.name === this.collectionName)

      if (!collectionExists) {
        console.log(`[v0] Creating Qdrant collection: ${this.collectionName}`)

        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: RAG_CONFIG.embedding.dimensions,
            distance: "Cosine",
          },
          optimizers_config: {
            default_segment_number: 2,
          },
          replication_factor: 1,
        })

        console.log(`[v0] Collection ${this.collectionName} created successfully`)
      } else {
        console.log(`[v0] Collection ${this.collectionName} already exists`)
      }

      this.isConnected = true
    } catch (error) {
      console.error("[v0] Error initializing Qdrant collection:", error)
      this.isConnected = false
      throw new Error(`Failed to initialize Qdrant collection: ${error}`)
    }
  }

  /**
   * Store document chunks with embeddings in Qdrant
   */
  async storeDocumentChunks(chunks: DocumentChunk[], document: Document): Promise<void> {
    if (!this.client) {
      console.log("[v0] No Qdrant client available, skipping document chunk storage")
      return
    }

    try {
      console.log(`[v0] Storing ${chunks.length} chunks for document: ${document.title}`)

      const points = chunks.map((chunk, index) => ({
        id: chunk.id,
        vector: chunk.embedding || [],
        payload: {
          documentId: chunk.documentId,
          content: chunk.content,
          chunkIndex: chunk.metadata.chunkIndex,
          startChar: chunk.metadata.startChar,
          endChar: chunk.metadata.endChar,
          documentTitle: document.title,
          documentSource: document.source,
          timestamp: document.timestamp.toISOString(),
        },
      }))

      await this.client.upsert(this.collectionName, {
        wait: true,
        points,
      })

      console.log(`[v0] Successfully stored ${chunks.length} chunks in Qdrant`)
    } catch (error) {
      console.error("[v0] Error storing document chunks:", error)
      throw new Error(`Failed to store document chunks: ${error}`)
    }
  }

  /**
   * Search for similar document chunks using vector similarity
   */
  async searchSimilarChunks(
    queryEmbedding: number[],
    limit: number = RAG_CONFIG.retrieval.topK,
    scoreThreshold: number = RAG_CONFIG.retrieval.scoreThreshold,
  ): Promise<SearchResult[]> {
    if (!this.client) {
      console.log("[v0] No Qdrant client available, skipping similar chunk search")
      return []
    }

    try {
      console.log(`[v0] Searching for similar chunks with limit: ${limit}`)

      const searchResult = await this.client.search(this.collectionName, {
        vector: queryEmbedding,
        limit,
        score_threshold: scoreThreshold,
        with_payload: true,
      })

      const results: SearchResult[] = searchResult.map((result) => {
        const payload = result.payload as any

        const chunk: DocumentChunk = {
          id: result.id as string,
          documentId: payload.documentId,
          content: payload.content,
          embedding: queryEmbedding, // We don't store the full embedding in payload
          metadata: {
            chunkIndex: payload.chunkIndex,
            startChar: payload.startChar,
            endChar: payload.endChar,
          },
        }

        const document: Document = {
          id: payload.documentId,
          title: payload.documentTitle,
          content: "", // We don't store full content in Qdrant
          source: payload.documentSource,
          timestamp: new Date(payload.timestamp),
          chunks: 0, // This would need to be calculated separately
        }

        return {
          chunk,
          score: result.score || 0,
          document,
        }
      })

      console.log(`[v0] Found ${results.length} similar chunks`)
      return results
    } catch (error) {
      console.error("[v0] Error searching similar chunks:", error)
      throw new Error(`Failed to search similar chunks: ${error}`)
    }
  }

  /**
   * Delete all chunks for a specific document
   */
  async deleteDocumentChunks(documentId: string): Promise<void> {
    if (!this.client) {
      console.log("[v0] No Qdrant client available, skipping document chunk deletion")
      return
    }

    try {
      console.log(`[v0] Deleting chunks for document: ${documentId}`)

      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: "documentId",
              match: {
                value: documentId,
              },
            },
          ],
        },
      })

      console.log(`[v0] Successfully deleted chunks for document: ${documentId}`)
    } catch (error) {
      console.error("[v0] Error deleting document chunks:", error)
      throw new Error(`Failed to delete document chunks: ${error}`)
    }
  }

  /**
   * Get collection info and statistics
   */
  async getCollectionInfo(): Promise<any> {
    if (!this.client) {
      console.log("[v0] No Qdrant client available, skipping collection info retrieval")
      return {}
    }

    try {
      const info = await this.client.getCollection(this.collectionName)
      return info
    } catch (error) {
      console.error("[v0] Error getting collection info:", error)
      throw new Error(`Failed to get collection info: ${error}`)
    }
  }

  /**
   * Health check for Qdrant connection
   */
  async healthCheck(): Promise<boolean> {
    if (!this.client) {
      return false
    }

    try {
      await this.client.getCollections()
      this.isConnected = true
      return true
    } catch (error) {
      console.error("[v0] Qdrant health check failed:", error)
      this.isConnected = false
      return false
    }
  }

  /**
   * Clear all data from the collection (useful for development)
   */
  async clearCollection(): Promise<void> {
    if (!this.client) {
      console.log("[v0] No Qdrant client available, skipping collection clearing")
      return
    }

    try {
      console.log(`[v0] Clearing collection: ${this.collectionName}`)

      await this.client.deleteCollection(this.collectionName)
      await this.initializeCollection()

      console.log(`[v0] Collection cleared and recreated`)
    } catch (error) {
      console.error("[v0] Error clearing collection:", error)
      throw new Error(`Failed to clear collection: ${error}`)
    }
  }
}

function createQdrantService() {
  const realService = new QdrantService()
  const mockService = new MockQdrantService()

  // Return a proxy that uses mock service when real service fails
  return new Proxy(realService, {
    get(target, prop) {
      const method = target[prop as keyof QdrantService]

      if (typeof method === "function") {
        return async (...args: any[]) => {
          try {
            // Try real service first
            const result = await (method as Function).apply(target, args)
            return result
          } catch (error) {
            console.warn(`[v0] Qdrant method ${String(prop)} failed, using mock:`, error)
            // Fallback to mock service
            const mockMethod = mockService[prop as keyof MockQdrantService]
            if (typeof mockMethod === "function") {
              return await (mockMethod as Function).apply(mockService, args)
            }
            throw error
          }
        }
      }

      return method
    },
  })
}

export const qdrantService = createQdrantService()
