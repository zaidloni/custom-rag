import { type NextRequest, NextResponse } from 'next/server'
import { qdrantService } from '@/lib/qdrant'
import { embeddingService } from '@/lib/embeddings'
import { TextProcessor } from '@/lib/text-processing'
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/config'
import type { Document, DocumentChunk } from '@/lib/types'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { TaskType } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    // const formData = await request;
    const userId = request.query.get('userId') as string

    console.log(userId, 'userId')
    const formData = await request.formData()
    const file = formData.get('file') as File
    // const type = formData.get("type") as string;
    // const textContent = formData.get("text") as string;

    console.log(file, 'file')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
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

    console.log(
      `[v0] Processing file ingestion: ${file.name} (${file.type}, ${(
        file.size / 1024
      ).toFixed(1)}KB)`
    )


    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempPath = path.join(process.cwd(), 'temp', file.name)
    await writeFile(tempPath, buffer)

    // Choose loader based on file type
    const loader = new PDFLoader(tempPath)

    const docs = await loader.load()
    await unlink(tempPath)


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

    return NextResponse.json({
      success: true,
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
