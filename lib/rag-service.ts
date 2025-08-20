import { qdrantService } from "./qdrant"
import { embeddingService } from "./embeddings"
import type { SearchResult } from "./types"
import { RAG_CONFIG } from "./config"

export class RAGService {
  /**
   * Process a RAG query: embed question, search similar chunks, return results
   */
  async processQuery(question: string): Promise<SearchResult[]> {
    try {
      console.log(`[v0] Processing RAG query: ${question}`)

      // Generate embedding for the question
      const questionEmbedding = await embeddingService.generateEmbedding(question)

      // Search for similar chunks in Qdrant
      const searchResults = await qdrantService.searchSimilarChunks(
        questionEmbedding,
        RAG_CONFIG.retrieval.topK,
        RAG_CONFIG.retrieval.scoreThreshold,
      )

      console.log(`[v0] Found ${searchResults.length} relevant chunks for query`)

      return searchResults
    } catch (error) {
      console.error("[v0] Error processing RAG query:", error)
      throw new Error(`Failed to process RAG query: ${error}`)
    }
  }

  /**
   * Build context string from search results for LLM prompt
   */
  buildContext(searchResults: SearchResult[]): string {
    if (searchResults.length === 0) {
      return "No relevant information found in the knowledge base."
    }

    const contextParts = searchResults.map((result, index) => {
      return `[Source ${index + 1}: ${result.document.title}]
${result.chunk.content}
`
    })

    return contextParts.join("\n")
  }

  /**
   * Extract source information from search results
   */
  extractSources(searchResults: SearchResult[]): string[] {
    const sources = new Set<string>()

    searchResults.forEach((result) => {
      sources.add(result.document.title)
    })

    return Array.from(sources)
  }

  /**
   * Create a RAG prompt for the LLM
   */
  createRAGPrompt(question: string, context: string): string {
    return `You are a helpful AI assistant that answers questions based on the provided context from a knowledge base. 

INSTRUCTIONS:
- Answer the question using ONLY the information provided in the context below
- If the context doesn't contain enough information to answer the question, say so clearly
- Be concise but comprehensive in your response
- Cite specific sources when possible
- If the question cannot be answered from the context, explain what information is missing

CONTEXT:
${context}

QUESTION: ${question}

ANSWER:`
  }
}

// Singleton instance
export const ragService = new RAGService()
