import { NextRequest, NextResponse } from 'next/server'
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio'
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { TaskType } from '@google/generative-ai'
import { QdrantVectorStore } from '@langchain/qdrant'

export async function POST(req: NextRequest) {
  try {
    const { url, userId } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      )
    }
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // 🔹 Load webpage content with smart content selection
    const loader = new CheerioWebBaseLoader(url, {
      selector: "main, article, .content, .main-content, .post-content, .entry-content, p, h1, h2, h3, h4, h5, h6"
    })
    const docs = await loader.load()

    // 🔹 Clean and filter content
    const cleanedDocs = docs
      .map((doc) => {
        // Remove unwanted content and clean text
        const cleanedContent = doc.pageContent
          .replace(/\s+/g, ' ') // Multiple spaces to single space
          .replace(/\n\s*\n/g, '\n') // Multiple newlines to single newline  
          .replace(/(javascript:|css:)[\s\S]*$/i, '') // Remove inline JS/CSS
          .replace(/^(function|var|const|let|class|\{|\}|\/\*|\/\/)/gm, '') // Remove JS-like lines
          .replace(/(Copyright|©|\d{4}\s*[-–]\s*\d{4})/gi, '') // Remove copyright text
          .trim()

        return {
          ...doc,
          pageContent: cleanedContent,
        }
      })
      .filter(doc => 
        doc.pageContent.length > 50 && // Minimum content length
        !/^[\{\}\[\]();,.\s]*$/.test(doc.pageContent) && // Not just symbols
        !/(function\s*\(|var\s+\w+\s*=|const\s+\w+\s*=)/i.test(doc.pageContent.substring(0, 100)) // Not JS code
      )

    if (cleanedDocs.length === 0) {
      return NextResponse.json(
        { error: 'No meaningful content found on the webpage' },
        { status: 400 }
      )
    }

    // 🔹 Initialize text splitter for chunking large documents
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,        // Optimal size for embeddings (around 1000 chars)
      chunkOverlap: 100,      // 100 char overlap to maintain context between chunks
      separators: ['\n\n', '\n', ' ', ''] // Split by paragraphs first, then sentences, then words
    })

    // 🔹 Split documents into chunks
    const chunkedDocs = []
    for (const doc of cleanedDocs) {
      if (doc.pageContent.length <= 1000) {
        // Small document, no need to chunk
        chunkedDocs.push(doc)
      } else {
        // Large document, split into chunks
        const chunks = await textSplitter.splitText(doc.pageContent)
        chunks.forEach((chunk, index) => {
          chunkedDocs.push({
            pageContent: chunk,
            metadata: {
              ...doc.metadata,
              chunkIndex: index,
              totalChunks: chunks.length,
              isChunked: true
            }
          })
        })
      }
    }

    // 🔹 Add metadata (userId, source)
    const docsWithMeta = chunkedDocs.map((doc, index) => {
      return {
        ...doc,
        metadata: {
          ...doc.metadata,
          userId,
          source: url,
          url,
          timestamp: new Date().toISOString(),
          documentIndex: index
        },
      }
    })

    // 🔹 Create embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: 'text-embedding-004',
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    })

    // 🔹 Store in Qdrant
    const vectorStore = await QdrantVectorStore.fromDocuments(
      docsWithMeta,
      embeddings,
      {
        url: process.env.QDRANT_URL!,
        apiKey: process.env.QDRANT_API_KEY!,
        collectionName: 'rag_documents',
      }
    )

    return NextResponse.json({
      success: true,
      originalDocs: cleanedDocs.length,
      totalChunks: docsWithMeta.length,
      avgChunkSize: Math.round(
        docsWithMeta.reduce((sum, doc) => sum + doc.pageContent.length, 0) / docsWithMeta.length
      ),
      contentLength: docsWithMeta.reduce((total, doc) => total + doc.pageContent.length, 0),
      message: 'Website content chunked, processed & stored successfully',
    })
  } catch (error) {
    console.error('[v0] Error in ingest-url API:', error)
    return NextResponse.json(
      {
        error: 'Failed to process website',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
