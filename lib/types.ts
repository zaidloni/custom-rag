export interface Document {
  id: string
  title: string
  content: string
  source: string
  createdAt: Date
  chunkCount: number
  metadata?: Record<string, any>
}

export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  embedding?: number[]
  metadata: {
    chunkIndex: number
    startChar: number
    endChar: number
  }
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: string[]
}

export interface SearchResult {
  chunk: DocumentChunk
  score: number
  document: Document
}

export interface RAGResponse {
  answer: string
  sources: SearchResult[]
  confidence: number
}

export interface EmbeddingConfig {
  model: string
  dimensions: number
  maxTokens: number
}

export interface QdrantConfig {
  url: string
  apiKey?: string
  collectionName: string
}
