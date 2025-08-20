import { NextResponse } from "next/server"
import { qdrantService } from "@/lib/qdrant"

export async function GET() {
  try {
    // Check Qdrant connection
    const qdrantHealthy = await qdrantService.healthCheck()

    // Get collection info if healthy
    let collectionInfo = null
    if (qdrantHealthy) {
      try {
        collectionInfo = await qdrantService.getCollectionInfo()
      } catch (error) {
        console.log("[v0] Collection not found, will be created on first use")
      }
    }

    const health = {
      status: qdrantHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        qdrant: {
          status: qdrantHealthy ? "connected" : "disconnected",
          collection: collectionInfo
            ? {
                name: collectionInfo.collection_name,
                points_count: collectionInfo.points_count,
                vectors_count: collectionInfo.vectors_count,
              }
            : null,
        },
        embeddings: {
          status: "ready",
          model: "text-embedding-3-small (or mock)",
        },
      },
    }

    return NextResponse.json(health)
  } catch (error) {
    console.error("[v0] Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 500 },
    )
  }
}
