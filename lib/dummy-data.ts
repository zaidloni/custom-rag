import type { Document } from "./types"

// Dummy documents for initial state
export const dummyDocuments: Document[] = [
  {
    id: "1",
    title: "Company Handbook 2024",
    content:
      "Our company values innovation, collaboration, and excellence. We believe in creating products that make a difference...",
    source: "Manual Entry",
    createdAt: new Date("2024-01-15"),
    chunkCount: 12,
  },
  {
    id: "2",
    title: "Product Requirements Document",
    content: "The new RAG system should provide seamless document ingestion and intelligent chat capabilities...",
    source: "product-requirements.pdf",
    createdAt: new Date("2024-01-10"),
    chunkCount: 8,
  },
  {
    id: "3",
    title: "API Documentation",
    content: "REST API endpoints for document management and chat functionality...",
    source: "https://docs.example.com/api",
    createdAt: new Date("2024-01-08"),
    chunkCount: 15,
  },
]

// Dummy chat responses
export const dummyResponses = [
  "Based on the documents you've uploaded, I can help you with information about company policies, product requirements, and API documentation. What would you like to know?",
  "According to the company handbook, our core values emphasize innovation and collaboration. The document mentions several key policies regarding remote work and team communication.",
  "The product requirements document outlines the RAG system specifications. It includes features for document ingestion, semantic search, and AI-powered chat functionality.",
  "The API documentation shows various endpoints for managing documents and chat interactions. Would you like me to explain any specific endpoint or functionality?",
  "I found relevant information in your uploaded documents. The company handbook discusses employee benefits, while the PRD covers technical requirements for the RAG system.",
  "Based on your knowledge base, I can provide insights about company policies, product specifications, and technical documentation. What specific topic interests you?",
]

// Mock API functions
export const mockApiService = {
  async ingestText(text: string): Promise<Document> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const newDoc: Document = {
      id: Date.now().toString(),
      title: `Text Document ${Date.now()}`,
      content: text.substring(0, 200) + "...",
      source: "Manual Entry",
      createdAt: new Date(),
      chunkCount: Math.ceil(text.length / 500),
    }

    return newDoc
  },

  async ingestFile(file: File): Promise<Document> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newDoc: Document = {
      id: Date.now().toString(),
      title: file.name,
      content: `Processed content from ${file.name}. This document contains important information...`,
      source: file.name,
      createdAt: new Date(),
      chunkCount: Math.floor(Math.random() * 20) + 5,
    }

    return newDoc
  },

  async ingestUrl(url: string): Promise<Document> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2500))

    const newDoc: Document = {
      id: Date.now().toString(),
      title: `Web Content from ${new URL(url).hostname}`,
      content: `Scraped content from ${url}. This webpage contains valuable information...`,
      source: url,
      createdAt: new Date(),
      chunkCount: Math.floor(Math.random() * 15) + 3,
    }

    return newDoc
  },

  async deleteDocument(id: string): Promise<void> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
  },

  async *chatStream(message: string): AsyncGenerator<string, void, unknown> {
    // Simulate streaming response
    const response = dummyResponses[Math.floor(Math.random() * dummyResponses.length)]
    const words = response.split(" ")

    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100))
      yield words[i] + " "
    }
  },
}
