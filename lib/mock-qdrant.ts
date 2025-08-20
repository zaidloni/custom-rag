import type { DocumentChunk, SearchResult, Document } from "./types"
import { RAG_CONFIG } from "./config"

/**
 * Mock Qdrant service for development when Qdrant is not available
 */
export class MockQdrantService {
  private documents: Map<string, DocumentChunk[]> = new Map()
  private allChunks: DocumentChunk[] = []

  async initializeCollection(): Promise<void> {
    console.log("[v0] Using mock Qdrant service (no external Qdrant required)")
  }

  async storeDocumentChunks(chunks: DocumentChunk[], document: Document): Promise<void> {
    console.log(`[v0] Mock storing ${chunks.length} chunks for document: ${document.title}`)

    this.documents.set(document.id, chunks)
    this.allChunks.push(...chunks)

    console.log(`[v0] Mock stored ${chunks.length} chunks. Total chunks: ${this.allChunks.length}`)
  }

  async searchSimilarChunks(
    queryEmbedding: number[],
    limit: number = RAG_CONFIG.retrieval.topK,
    scoreThreshold: number = RAG_CONFIG.retrieval.scoreThreshold,
  ): Promise<SearchResult[]> {
    console.log(`[v0] Mock searching ${this.allChunks.length} chunks`)

    // Simple mock search - return random chunks for demo
    const shuffled = [...this.allChunks].sort(() => 0.5 - Math.random())
    const results = shuffled.slice(0, limit).map((chunk, index) => {
      const mockDocument: Document = {
        id: chunk.documentId,
        title: `Document ${chunk.documentId}`,
        content: chunk.content,
        source: "text",
        timestamp: new Date(),
        chunks: 1,
      }

      return {
        chunk,
        score: 0.9 - index * 0.1, // Mock decreasing scores
        document: mockDocument,
      }
    })

    console.log(`[v0] Mock found ${results.length} similar chunks`)
    return results
  }

  async deleteDocumentChunks(documentId: string): Promise<void> {
    console.log(`[v0] Mock deleting chunks for document: ${documentId}`)

    const chunks = this.documents.get(documentId) || []
    this.documents.delete(documentId)

    // Remove from allChunks
    this.allChunks = this.allChunks.filter((chunk) => chunk.documentId !== documentId)

    console.log(`[v0] Mock deleted ${chunks.length} chunks`)
  }

  async getCollectionInfo(): Promise<any> {
    return {
      status: "green",
      vectors_count: this.allChunks.length,
      indexed_vectors_count: this.allChunks.length,
    }
  }

  async healthCheck(): Promise<boolean> {
    return true
  }

  async clearCollection(): Promise<void> {
    console.log("[v0] Mock clearing all documents")
    this.documents.clear()
    this.allChunks = []
  }
}
