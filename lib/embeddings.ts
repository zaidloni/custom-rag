import OpenAI from "openai"
import { RAG_CONFIG } from "./config"

export class EmbeddingService {
  private openai: OpenAI

  constructor() {
    // Note: In a real implementation, you'd use OpenAI API key
    // For this demo, we'll simulate embeddings
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "demo-key",
    })
  }

  /**
   * Generate embeddings for text content
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log(`[v0] Generating embedding for text (${text.length} chars)`)

      // For demo purposes, we'll generate mock embeddings
      // In production, you'd use the actual OpenAI API
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "demo-key") {
        const response = await this.openai.embeddings.create({
          model: RAG_CONFIG.embedding.model,
          input: text,
        })

        return response.data[0].embedding
      } else {
        // Generate mock embedding vector
        return this.generateMockEmbedding(text)
      }
    } catch (error) {
      console.error("[v0] Error generating embedding:", error)
      // Fallback to mock embedding
      return this.generateMockEmbedding(text)
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      console.log(`[v0] Generating embeddings for ${texts.length} texts`)

      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "demo-key") {
        const response = await this.openai.embeddings.create({
          model: RAG_CONFIG.embedding.model,
          input: texts,
        })

        return response.data.map((item) => item.embedding)
      } else {
        // Generate mock embeddings
        return texts.map((text) => this.generateMockEmbedding(text))
      }
    } catch (error) {
      console.error("[v0] Error generating embeddings:", error)
      // Fallback to mock embeddings
      return texts.map((text) => this.generateMockEmbedding(text))
    }
  }

  /**
   * Generate a mock embedding vector for demo purposes
   */
  private generateMockEmbedding(text: string): number[] {
    // Create a deterministic but varied embedding based on text content
    const hash = this.simpleHash(text)
    const embedding: number[] = []

    for (let i = 0; i < RAG_CONFIG.embedding.dimensions; i++) {
      // Generate values between -1 and 1
      const value = Math.sin(hash + i * 0.1) * Math.cos(hash * 0.7 + i * 0.3)
      embedding.push(value)
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map((val) => val / magnitude)
  }

  /**
   * Simple hash function for generating consistent mock embeddings
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same length")
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService()
