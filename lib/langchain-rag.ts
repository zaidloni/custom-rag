import { OpenAIEmbeddings } from "@langchain/openai"
import { QdrantVectorStore } from "@langchain/qdrant"
import { ChatGroq } from "@langchain/groq"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { Document } from "@langchain/core/documents"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables"
import { PromptTemplate } from "@langchain/core/prompts"
import { QdrantClient } from "@qdrant/js-client-rest"
import { config } from "./config"

export class LangChainRAGService {
  private embeddings: OpenAIEmbeddings
  private vectorStore: QdrantVectorStore | null = null
  private llm: ChatGroq
  private textSplitter: RecursiveCharacterTextSplitter
  private ragChain: RunnableSequence | null = null

  constructor() {
    // Initialize embeddings
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY || "mock-key",
      modelName: "text-embedding-3-small",
    })

    if (!process.env.GROQ_API_KEY) {
      console.warn("[v0] GROQ_API_KEY not found - chat functionality may not work")
    }

    // Initialize Groq LLM
    this.llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY || "mock-key",
      modelName: "llama-3.1-70b-versatile",
      temperature: 0.1,
      streaming: true,
    })

    // Initialize text splitter
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      separators: ["\n\n", "\n", ". ", " ", ""],
    })
  }

  async initialize(): Promise<void> {
    try {
      if (config.qdrantUrl && config.qdrantApiKey) {
        // Initialize real Qdrant vector store
        const client = new QdrantClient({
          url: config.qdrantUrl,
          apiKey: config.qdrantApiKey,
        })

        this.vectorStore = new QdrantVectorStore(this.embeddings, {
          client,
          collectionName: config.collectionName,
        })

        // Ensure collection exists
        await this.ensureCollection()
      } else {
        console.log("[v0] Using mock vector store - Qdrant not configured")
        // For development, we'll use a simple in-memory approach
        // In production, you'd want to use a proper vector store
      }

      // Initialize RAG chain
      this.initializeRAGChain()
    } catch (error) {
      console.error("[v0] Failed to initialize LangChain RAG service:", error)
      throw error
    }
  }

  private async ensureCollection(): Promise<void> {
    if (!this.vectorStore) return

    try {
      // LangChain QdrantVectorStore handles collection creation automatically
      console.log("[v0] Qdrant collection ready")
    } catch (error) {
      console.error("[v0] Failed to ensure collection:", error)
      throw error
    }
  }

  private initializeRAGChain(): void {
    if (!this.vectorStore) {
      console.log("[v0] Cannot initialize RAG chain without vector store")
      return
    }

    // Create retriever
    const retriever = this.vectorStore.asRetriever({
      k: config.topK,
      searchType: "similarity",
    })

    // Create prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful AI assistant that answers questions based on the provided context.
Use the following pieces of context to answer the question at the end.
If you don't know the answer based on the context, just say that you don't know.
Always cite the sources when possible.

Context:
{context}

Question: {question}

Answer:`)

    // Create RAG chain
    this.ragChain = RunnableSequence.from([
      {
        context: retriever.pipe((docs) => docs.map((doc) => doc.pageContent).join("\n\n")),
        question: new RunnablePassthrough(),
      },
      promptTemplate,
      this.llm,
      new StringOutputParser(),
    ])
  }

  async addDocuments(texts: string[], metadata: Array<Record<string, any>> = []): Promise<void> {
    try {
      // Split texts into chunks
      const allDocuments: Document[] = []

      for (let i = 0; i < texts.length; i++) {
        const text = texts[i]
        const meta = metadata[i] || {}

        const chunks = await this.textSplitter.splitText(text)
        const documents = chunks.map(
          (chunk, index) =>
            new Document({
              pageContent: chunk,
              metadata: {
                ...meta,
                chunkIndex: index,
                totalChunks: chunks.length,
              },
            }),
        )

        allDocuments.push(...documents)
      }

      if (this.vectorStore) {
        // Add documents to vector store
        await this.vectorStore.addDocuments(allDocuments)
        console.log(`[v0] Added ${allDocuments.length} document chunks to vector store`)
      } else {
        console.log("[v0] Mock mode: Documents would be stored here")
      }
    } catch (error) {
      console.error("[v0] Failed to add documents:", error)
      throw error
    }
  }

  async query(question: string): Promise<{
    answer: string
    sources: Array<{ content: string; metadata: Record<string, any> }>
  }> {
    try {
      if (!this.ragChain || !this.vectorStore) {
        throw new Error("RAG chain not initialized or vector store not available")
      }

      // Get relevant documents
      const retriever = this.vectorStore.asRetriever({ k: config.topK })
      const relevantDocs = await retriever.getRelevantDocuments(question)

      // Generate answer using RAG chain
      const answer = await this.ragChain.invoke(question)

      // Format sources
      const sources = relevantDocs.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      }))

      return { answer, sources }
    } catch (error) {
      console.error("[v0] Failed to query:", error)
      throw error
    }
  }

  async streamQuery(question: string): Promise<{
    stream: AsyncIterable<string>
    sources: Array<{ content: string; metadata: Record<string, any> }>
  }> {
    try {
      if (!this.vectorStore) {
        throw new Error("Vector store not available")
      }

      // Get relevant documents first
      const retriever = this.vectorStore.asRetriever({ k: config.topK })
      const relevantDocs = await retriever.getRelevantDocuments(question)

      // Create streaming chain
      const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful AI assistant that answers questions based on the provided context.
Use the following pieces of context to answer the question at the end.
If you don't know the answer based on the context, just say that you don't know.
Always cite the sources when possible.

Context:
{context}

Question: {question}

Answer:`)

      const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n")
      const prompt = await promptTemplate.format({ context, question })

      // Stream response
      const stream = await this.llm.stream(prompt)

      // Format sources
      const sources = relevantDocs.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      }))

      return { stream, sources }
    } catch (error) {
      console.error("[v0] Failed to stream query:", error)
      throw error
    }
  }

  async deleteDocuments(filter: Record<string, any>): Promise<void> {
    try {
      if (this.vectorStore) {
        // LangChain doesn't have a direct delete method for QdrantVectorStore
        // You'd need to use the underlying Qdrant client for deletions
        console.log("[v0] Document deletion would be implemented here")
      }
    } catch (error) {
      console.error("[v0] Failed to delete documents:", error)
      throw error
    }
  }
}

// Singleton instance
let ragService: LangChainRAGService | null = null

export async function getLangChainRAGService(): Promise<LangChainRAGService> {
  if (!ragService) {
    ragService = new LangChainRAGService()
    await ragService.initialize()
  }
  return ragService
}
