"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Loader2, User, Bot, Copy, Check, Maximize2, Send } from "lucide-react"
import { InfoTooltip } from "./info-tooltip"
import type { ChatMessage } from "@/lib/types"
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";


interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  isLoading: boolean
  hasDocuments: boolean
  onFullScreen?: () => void
}

export function ChatInterface({ messages, onSendMessage, isLoading, hasDocuments, onFullScreen }: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return
    const message = input
    setInput("")
    await onSendMessage(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Card className="flex flex-col h-full card-interactive shadow-soft hover:shadow-elevated bg-gradient-to-br from-card via-card to-muted/20 border-2 hover:border-primary/20 transition-all duration-300">
      <div className="p-6 border-b flex-shrink-0 bg-gradient-to-r from-muted/30 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 shadow-glow">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              Chat with Knowledge Base
            </h2>
            <InfoTooltip
              content="Ask questions about your uploaded documents. The AI will search through your knowledge base and provide answers with source references."
              side="right"
            />
          </div>
          {onFullScreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFullScreen}
              className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-110 rounded-xl shadow-soft hover:shadow-elevated"
              title="Open in full screen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">Ask questions about your documents</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm shadow-soft mb-6">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-pulse-subtle" />
                <p className="text-muted-foreground font-medium">Start a conversation with your knowledge base</p>
                <p className="text-sm text-muted-foreground mt-2">Add some documents first, then ask questions!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={message.id} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <ChatMessageComponent message={message} />
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-scale-in">
                  <div className="max-w-[80%] rounded-2xl p-4 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border shadow-soft flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shadow-glow">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Searching knowledge base...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t flex-shrink-0 bg-gradient-to-r from-muted/20 to-transparent backdrop-blur-sm">
        <div className="flex gap-3">
          <Input
            placeholder="Ask a question about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!hasDocuments || isLoading}
            className="flex-1 rounded-xl border-2 focus:border-primary/50 transition-all duration-200 input-enhanced bg-gradient-to-r from-background to-muted/20 shadow-soft focus:shadow-elevated"
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || !hasDocuments || isLoading}
            className="rounded-xl px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary btn-enhanced shadow-soft hover:shadow-elevated"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          {!hasDocuments && (
            <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
              Add documents to start chatting
            </p>
          )}
          <p className="text-xs text-muted-foreground ml-auto">Press Enter to send</p>
        </div>
      </div>
    </Card>
  )
}

function ChatMessageComponent({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} group`}>
      <div
        className={`max-w-[85%] rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] ${
          message.role === "user"
            ? "bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-soft hover:shadow-elevated shadow-primary/20"
            : "bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border hover:from-muted/70 hover:to-muted/50 shadow-soft hover:shadow-elevated"
        }`}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-soft transition-all duration-200 ${
              message.role === "user"
                ? "bg-white/20 text-primary-foreground shadow-glow"
                : "bg-primary/10 text-primary shadow-glow"
            }`}
          >
            {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-medium ${
                  message.role === "user" ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                {message.role === "user" ? "You" : "AI Assistant"}
              </span>
              <span
                className={`text-xs ${
                  message.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground/60"
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
         <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({
                    node,
                    className,
                    children,
                    ...props
                  }: any) {
                    const match = /language-(\w+)/.exec(
                      className || ""
                    );
                    const isInline = !match;
                    return !isInline ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code
                        className="bg-muted-foreground/20 px-1 py-0.5 rounded text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
          </div>
          {message.role === "assistant" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/20 hover:text-primary hover:scale-110 rounded-lg shadow-soft hover:shadow-elevated"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          )}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <p
              className={`text-xs font-medium mb-2 ${
                message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground/70"
              }`}
            >
              Sources:
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className={`text-xs transition-all duration-200 hover:scale-105 shadow-soft ${
                    message.role === "user"
                      ? "border-primary-foreground/30 text-primary-foreground/80 hover:bg-white/10"
                      : "hover:bg-primary/10 hover:border-primary/30"
                  }`}
                >
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
