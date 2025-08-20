import { type NextRequest, NextResponse } from 'next/server'
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/config'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { TaskType } from '@google/generative-ai'
import { QdrantVectorStore } from '@langchain/qdrant'

export async function POST(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!SUPPORTED_FILE_TYPES.includes(file.type as any)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${
            file.type
          }. Supported types: ${SUPPORTED_FILE_TYPES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(
            1
          )}MB. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      )
    }

    // Check if file is empty
    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    // ✅ Create document metadata
    const documentId = `doc_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`
    const metadata = {
      id: documentId,
      source: 'docs',
      timestamp: new Date().toISOString(),
      userId, // 🔑 filter key
    }
    const bytes = await file.arrayBuffer()
    const blob = new Blob([bytes], { type: file.type })

    const loader = new PDFLoader(blob)
    let docs = await loader.load()

    docs = docs.map((doc) => ({
      ...doc,
      metadata: { ...doc.metadata, ...metadata },
    }))

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
    console.error('[v0] Error in file ingestion:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to process file',
      },
      { status: 500 }
    )
  }
}
