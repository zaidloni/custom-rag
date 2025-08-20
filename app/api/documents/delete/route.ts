import { type NextRequest, NextResponse } from "next/server"
import { qdrantService } from "@/lib/qdrant"

export async function DELETE(request: NextRequest) {
  try {
    const { documentId } = await request.json()

    if (!documentId || typeof documentId !== "string") {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    console.log(`[v0] Deleting document: ${documentId}`)

    // Delete document chunks from Qdrant
    await qdrantService.deleteDocumentChunks(documentId)

    console.log(`[v0] Successfully deleted document: ${documentId}`)

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
