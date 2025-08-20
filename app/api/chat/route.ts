import { TaskType } from '@google/generative-ai'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { QdrantVectorStore } from '@langchain/qdrant'
import { NextResponse, type NextRequest } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(request: NextRequest) {
  try {
    const { userQuery, userId, conversationHistory = [] } = await request.json()

    console.log(userQuery, userId, conversationHistory)

    if (!userQuery || typeof userQuery !== 'string') {
      return new Response('Message is required', { status: 400 })
    }

    // ✅ Generate embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: 'text-embedding-004',
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    })

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL!,
        collectionName: 'rag_documents',
      }
    )
    const vectorSearcher = vectorStore.asRetriever({
      k: 3,
      filter: {
        must: [
          {
            key: 'metadata.userId', // 👈 must include the path
            match: {
              value: userId, // Only return chunks belonging to this user
            },
          },
        ],
      },
    })

    console.log(vectorSearcher, 'vectorSearcher')

    // 🔹 Search relevant chunks for user query
    const relevantChunk = await vectorSearcher.invoke(userQuery)

    console.log(relevantChunk, 'relevantChunk')

    const SYSTEM_PROMPT = `
    You are an AI assistant who helps resolving user query based on the
    context available to you from a PDF file with the content and page number.

    Only ans based on the available context from file only.

    Context:
    ${JSON.stringify(relevantChunk)}
  `

    const messages = [
      {
        role: 'system',
        content: JSON.stringify(SYSTEM_PROMPT),
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
      {
        role: 'user',
        content: JSON.stringify(userQuery),
      },
    ]

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

    const completion = await groq.chat.completions.create({
      messages,
      model: 'openai/gpt-oss-20b',
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response =
      completion.choices[0]?.message?.content ||
      'Sorry, I could not generate a response.'

    return NextResponse.json({ response })

    // // Create streaming response
    // const encoder = new TextEncoder()
    // const readable = new ReadableStream({
    //   async start(controller) {
    //     try {
    //       // Send sources first
    //       const sourcesData = JSON.stringify({ type: "sources", sources })
    //       controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`))

    //       // Stream the answer
    //       for await (const chunk of stream) {
    //         const data = JSON.stringify({ type: "text", content: chunk })
    //         controller.enqueue(encoder.encode(`data: ${data}\n\n`))
    //       }

    //       // Send completion signal
    //       controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
    //       controller.close()
    //     } catch (error) {
    //       console.error("[v0] Error in streaming:", error)
    //       const errorData = JSON.stringify({
    //         type: "error",
    //         error: error instanceof Error ? error.message : "Unknown error",
    //       })
    //       controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
    //       controller.close()
    //     }
    //   },
    // })

    // return new Response(readable, {
    //   headers: {
    //     "Content-Type": "text/event-stream",
    //     "Cache-Control": "no-cache",
    //     Connection: "keep-alive",
    //   },
    // })
  } catch (error) {
    console.error('[v0] Error in chat API:', error)
    return new Response('Failed to process chat request', { status: 500 })
  }
}
