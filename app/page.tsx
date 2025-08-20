'use client'

import { useState, useEffect } from 'react'
import {
  Brain,
  Sparkles,
  FileText,
  MessageSquare,
  Zap,
  TrendingUp,
} from 'lucide-react'
import { DocumentIngestionPanel } from '@/components/document-ingestion-panel'
import { ChatInterface } from '@/components/chat-interface'
import { FullScreenChatModal } from '@/components/full-screen-chat-modal'
import { ThemeToggle } from '@/components/theme-toggle'
import type { Document, ChatMessage } from '@/lib/types'
import { dummyDocuments, mockApiService } from '@/lib/dummy-data'

export default function RAGApp() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: 'Company Handbook 2024',
      content:
        'Our company values innovation, collaboration, and excellence. We believe in creating products that make a difference...',
      source: 'Manual Entry',
      createdAt: new Date('2024-01-15'),
      chunkCount: 12,
    },
  ])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isChatting, setIsChatting] = useState(false)
  const [isFullScreenChatOpen, setIsFullScreenChatOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('rag-app-uuid')) {
      const uniqueId = crypto.randomUUID() // ✅ lowercase "crypto"
      localStorage.setItem('rag-app-uuid', uniqueId)
    }
  }, [])

  const handleAddText = async (text: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/documents/ingest-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          userId: localStorage.getItem('rag-app-uuid'),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const document = data.document
      setDocuments((prev) => [...prev, document])
    } catch (error) {
      console.error('Error adding text:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddFile = async (file: File) => {
    setIsProcessing(true)
    console.log(file);
    const filetype = file.type;
    console.log(filetype);
      const formData = new FormData();
      formData.append('file', file);

    try {
      const response = await fetch(`/api/documents/ingest-file?userId=${localStorage.getItem('rag-app-uuid')}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(data);
      // const document = await mockApiService.ingestFile(file)
      // setDocuments((prev) => [...prev, document])
    } catch (error) {
      console.error('Error adding file:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddUrl = async (url: string) => {
    setIsProcessing(true)
    try {
      const document = await fetch('/api/documents/ingest-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, userId: localStorage.getItem('rag-app-uuid') }),
      })
      const data = await document.json()
      console.log(data)
      // setDocuments((prev) => [...prev, data])
    } catch (error) {
      console.error('Error adding URL:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveDocument = async (id: string) => {
    try {
      await mockApiService.deleteDocument(id)
      setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  // const handleSendMessage = async (content: string) => {
  //   console.log({ content, messages })
  //   // return;
  //   if (content.trim().length === 0) return

  //   // const userMessage: ChatMessage = {
  //   //   id: Date.now().toString(),
  //   //   role: 'user',
  //   //   content,
  //   //   timestamp: new Date(),
  //   // }

  //   // setMessages((prev) => [...prev, userMessage])

  //   try {
  //     setIsChatting(true)
  //     const response = await fetch('api/chat', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         userQuery: content,
  //         userId: localStorage.getItem('rag-app-uuid'),
  //         conversationHistory: messages || [],
  //       }),
  //     })
  //     const data = await response.json()
  //     console.log(data?.response)
  //     // let assistantContent = ''
  //     // const assistantMessage: ChatMessage = {
  //     //   id: (Date.now() + 1).toString(),
  //     //   role: 'assistant',
  //     //   content: '',
  //     //   timestamp: new Date(),
  //     //   sources: documents.slice(0, 2).map((doc) => doc.title),
  //     // }

  //     // setMessages((prev) => [...prev, assistantMessage])

  //     // for await (const chunk of mockApiService.chatStream(content)) {
  //     //   assistantContent += chunk
  //     //   setMessages((prev) => {
  //     //     const newMessages = [...prev]
  //     //     const lastMessage = newMessages[newMessages.length - 1]
  //     //     if (lastMessage && lastMessage.role === 'assistant') {
  //     //       lastMessage.content = assistantContent
  //     //     }
  //     //     return newMessages
  //     //   })
  //     // }
  //   } catch (error) {
  //     console.error('Error processing message:', error)
  //     const errorMessage: ChatMessage = {
  //       id: (Date.now() + 1).toString(),
  //       role: 'assistant',
  //       content: 'Sorry, I encountered an error. Please try again.',
  //       timestamp: new Date(),
  //     }
  //     setMessages((prev) => [...prev, errorMessage])
  //   } finally {
  //     setIsChatting(false)
  //   }
  // }

  const handleSendMessage = async (content: string) => {
    if (content.trim().length === 0) return

    // User message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      setIsChatting(true)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userQuery: content,
          userId: localStorage.getItem('rag-app-uuid'),
          conversationHistory: [...messages, userMessage], // include current message
        }),
      })

      const data = await response.json()
      const assistantReply = data?.response ?? 'No response received.'

      // Assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date(),
        sources: data?.sources || [], // optional if you return sources
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error processing message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsChatting(false)
    }
  }

  const handleOpenFullScreenChat = () => {
    setIsFullScreenChatOpen(true)
  }

  const handleCloseFullScreenChat = () => {
    setIsFullScreenChatOpen(false)
  }

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunkCount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <FullScreenChatModal
        isOpen={isFullScreenChatOpen}
        onClose={handleCloseFullScreenChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isChatting}
        hasDocuments={documents.length > 0}
      />

      <header
        id="header"
        className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative animate-float">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                <div className="relative p-2 bg-gradient-to-br from-primary to-accent rounded-xl shadow-glow">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <Sparkles className="h-3 w-3 text-accent absolute -top-1 -right-1 animate-pulse-subtle" />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    IntelliDocs
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">
                    AI-Powered Knowledge Base
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            id="ingestion-panel"
            className="animate-slide-in h-[calc(100vh-140px)] overflow-y-auto">
            <DocumentIngestionPanel
              documents={documents}
              onAddText={handleAddText}
              onAddFile={handleAddFile}
              onAddUrl={handleAddUrl}
              onRemoveDocument={handleRemoveDocument}
              isProcessing={isProcessing}
            />
          </div>

          <div
            id="chat-panel"
            className="animate-slide-in h-[calc(100vh-140px)]"
            style={{ animationDelay: '0.2s' }}>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isChatting}
              hasDocuments={true || documents.length > 0}
              onFullScreen={handleOpenFullScreenChat}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
