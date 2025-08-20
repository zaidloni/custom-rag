export const RAG_CONFIG = {
  // Qdrant Configuration
  qdrant: {
    url: process.env.QDRANT_URL || "",
    apiKey: process.env.QDRANT_API_KEY || "",
    collectionName: "documents",
  },

  // Embedding Configuration
  embedding: {
    model: "text-embedding-3-small",
    dimensions: 1536,
    maxTokens: 8191,
  },

  // Text Processing
  chunking: {
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", ". ", "! ", "? ", " "],
  },

  // RAG Parameters
  retrieval: {
    topK: 5,
    scoreThreshold: 0.7,
  },

  // Groq Configuration
  groq: {
    model: "llama-3.1-8b-instant",
    maxTokens: 1024,
    temperature: 0.1,
  },
} as const

export const SUPPORTED_FILE_TYPES = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/markdown",
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const FILE_TYPE_LABELS = {
  "text/plain": "TXT",
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/markdown": "MD",
} as const

export const config = {
  qdrantUrl: RAG_CONFIG.qdrant.url,
  qdrantApiKey: RAG_CONFIG.qdrant.apiKey,
  collectionName: RAG_CONFIG.qdrant.collectionName,
  chunkSize: RAG_CONFIG.chunking.chunkSize,
  chunkOverlap: RAG_CONFIG.chunking.chunkOverlap,
  topK: RAG_CONFIG.retrieval.topK,
  scoreThreshold: RAG_CONFIG.retrieval.scoreThreshold,
} as const
