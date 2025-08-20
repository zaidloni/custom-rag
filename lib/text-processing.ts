import type { DocumentChunk } from "./types"
import { RAG_CONFIG } from "./config"

export class TextProcessor {
  /**
   * Split text into chunks with overlap
   */
  static chunkText(
    text: string,
    documentId: string,
    chunkSize: number = RAG_CONFIG.chunking.chunkSize,
    overlap: number = RAG_CONFIG.chunking.chunkOverlap,
  ): Omit<DocumentChunk, "embedding">[] {
    console.log(`[v0] Chunking text (${text.length} chars) with size ${chunkSize} and overlap ${overlap}`)

    const chunks: Omit<DocumentChunk, "embedding">[] = []
    let startIndex = 0
    let chunkIndex = 0

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length)
      let chunkText = text.slice(startIndex, endIndex)

      // Try to break at sentence boundaries if we're not at the end
      if (endIndex < text.length) {
        const lastSentenceEnd = this.findLastSentenceEnd(chunkText)
        if (lastSentenceEnd > chunkSize * 0.5) {
          // Only break at sentence if it's not too short
          chunkText = chunkText.slice(0, lastSentenceEnd)
        }
      }

      // Clean up the chunk
      chunkText = this.cleanText(chunkText)

      if (chunkText.trim().length > 0) {
        chunks.push({
          id: `${documentId}_chunk_${chunkIndex}`,
          documentId,
          content: chunkText,
          metadata: {
            chunkIndex,
            startChar: startIndex,
            endChar: startIndex + chunkText.length,
          },
        })
        chunkIndex++
      }

      // Move start index, accounting for overlap
      startIndex = startIndex + chunkText.length - overlap
      if (startIndex >= endIndex) {
        startIndex = endIndex
      }
    }

    console.log(`[v0] Created ${chunks.length} chunks from text`)
    return chunks
  }

  /**
   * Find the last sentence ending in the text
   */
  private static findLastSentenceEnd(text: string): number {
    const sentenceEnders = [". ", "! ", "? ", ".\n", "!\n", "?\n"]
    let lastEnd = -1

    for (const ender of sentenceEnders) {
      const index = text.lastIndexOf(ender)
      if (index > lastEnd) {
        lastEnd = index + ender.length
      }
    }

    return lastEnd > 0 ? lastEnd : text.length
  }

  /**
   * Clean and normalize text
   */
  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, " ") // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, "\n") // Replace multiple newlines with single newline
      .trim()
  }

  /**
   * Extract text from different file types
   */
  static async extractTextFromFile(file: File): Promise<string> {
    console.log(`[v0] Extracting text from file: ${file.name} (${file.type})`)

    try {
      switch (file.type) {
        case "text/plain":
        case "text/markdown":
          return await file.text()

        case "application/pdf":
          // In a real implementation, you'd use a PDF parser like pdf-parse
          console.log("[v0] PDF parsing not implemented, using filename as content")
          return `Content extracted from PDF: ${file.name}\n\nThis is a placeholder for PDF content extraction. In a production app, you would use a library like pdf-parse to extract actual text content from the PDF file.`

        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          // In a real implementation, you'd use a DOCX parser
          console.log("[v0] DOCX parsing not implemented, using filename as content")
          return `Content extracted from DOCX: ${file.name}\n\nThis is a placeholder for DOCX content extraction. In a production app, you would use a library like mammoth or docx-parser to extract actual text content from the DOCX file.`

        default:
          throw new Error(`Unsupported file type: ${file.type}`)
      }
    } catch (error) {
      console.error("[v0] Error extracting text from file:", error)
      throw new Error(`Failed to extract text from file: ${error}`)
    }
  }

  /**
   * Scrape text content from URL
   */
  static async scrapeUrlContent(url: string): Promise<{ title: string; content: string }> {
    console.log(`[v0] Scraping content from URL: ${url}`)

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()

      // Simple HTML parsing (in production, use a proper HTML parser)
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname

      // Remove HTML tags and extract text content
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[^;]+;/g, " ")
        .replace(/\s+/g, " ")
        .trim()

      if (!textContent || textContent.length < 100) {
        throw new Error("Insufficient content extracted from URL")
      }

      console.log(`[v0] Scraped ${textContent.length} characters from ${url}`)
      return { title, content: textContent }
    } catch (error) {
      console.error("[v0] Error scraping URL:", error)
      throw new Error(`Failed to scrape URL content: ${error}`)
    }
  }

  /**
   * Validate and sanitize text input
   */
  static validateText(text: string): { isValid: boolean; error?: string } {
    if (!text || typeof text !== "string") {
      return { isValid: false, error: "Text must be a non-empty string" }
    }

    if (text.trim().length === 0) {
      return { isValid: false, error: "Text cannot be empty or only whitespace" }
    }

    if (text.length > 1000000) {
      // 1MB limit
      return { isValid: false, error: "Text is too large (max 1MB)" }
    }

    return { isValid: true }
  }
}
