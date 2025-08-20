import { type NextRequest, NextResponse } from 'next/server'
import { TextProcessor } from '@/lib/text-processing'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { TaskType } from '@google/generative-ai'
import { Document } from '@langchain/core/documents'
import { QdrantVectorStore } from '@langchain/qdrant'

export async function POST(request: NextRequest) {
  try {
    const { text, userId } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId (sessionId) is required' },
        { status: 400 }
      )
    }

    // ✅ Validate text
    const validation = TextProcessor.validateText(text)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // ✅ Create document metadata
    const documentId = `doc_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`
    const metadata = {
      id: documentId,
      source: 'text',
      timestamp: new Date().toISOString(),
      userId, // 🔑 filter key
    }

    const docs = []
    docs.push(new Document({ pageContent: text, metadata }))

    // ✅ Generate embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: 'text-embedding-004',
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    })

    const vectorStore = await QdrantVectorStore.fromDocuments(
      docs,
      embeddings,
      {
        url: process.env.QDRANT_URL!,
        apiKey: process.env.QDRANT_API_KEY!,
        collectionName: 'rag_documents',
      }
    )

    return NextResponse.json({
      success: true,
      document: metadata,
      message: 'Document processed and stored successfully',
    })
  } catch (error) {
    console.error('[v0] Error in text ingestion:', error)
    return NextResponse.json(
      {
        error: 'Failed to process text document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
