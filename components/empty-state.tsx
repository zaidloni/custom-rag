"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, MessageSquare, Upload, Link, Sparkles } from "lucide-react"

interface EmptyStateProps {
  type: "documents" | "chat"
  onAction?: () => void
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  if (type === "documents") {
    return (
      <Card className="p-8 text-center border-dashed border-2 border-muted-foreground/20 bg-muted/30">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <Sparkles className="w-4 h-4 text-accent absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">No documents yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Upload your first document to start building your knowledge base. Supported formats: PDF, TXT, DOCX, and
              more.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={onAction} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Link className="w-4 h-4" />
              Add URL
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <MessageSquare className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white animate-pulse" />
        </div>
      </div>
      <div className="space-y-3 max-w-md">
        <h3 className="text-xl font-semibold text-foreground">Ready to chat!</h3>
        <p className="text-muted-foreground">
          Ask questions about your uploaded documents. I'll search through your knowledge base and provide accurate
          answers with source citations.
        </p>
        <div className="pt-4">
          <div className="text-xs text-muted-foreground mb-2">Try asking:</div>
          <div className="space-y-1 text-sm text-primary/80">
            <div>"What are the key points in my documents?"</div>
            <div>"Summarize the main findings"</div>
            <div>"Find information about [topic]"</div>
          </div>
        </div>
      </div>
    </div>
  )
}
