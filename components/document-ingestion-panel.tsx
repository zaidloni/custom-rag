"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Upload, Loader2, FileText, Trash2, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUploadZone } from "./file-upload-zone"
import { UrlInputSection } from "./url-input-section"
import { InfoTooltip } from "./info-tooltip"
import { ProcessingProgress } from "./processing-progress"
import type { Document } from "@/lib/types"

interface DocumentIngestionPanelProps {
  documents: Document[]
  onAddText: (text: string) => Promise<void>
  onAddFile: (file: File) => Promise<void>
  onAddUrl: (url: string) => Promise<void>
  onRemoveDocument: (id: string) => void
  isProcessing: boolean
}

export function DocumentIngestionPanel({
  documents,
  onAddText,
  onAddFile,
  onAddUrl,
  onRemoveDocument,
  isProcessing,
}: DocumentIngestionPanelProps) {
  const [inputText, setInputText] = useState("")
  const [textError, setTextError] = useState<string | null>(null)
  const [textSuccess, setTextSuccess] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [processingDocument, setProcessingDocument] = useState<string>("")

  const handleTextSubmit = async () => {
    setTextError(null)
    setTextSuccess(null)

    if (!inputText.trim()) {
      setTextError("Please enter some text content")
      return
    }

    if (inputText.length < 50) {
      setTextError("Text content should be at least 50 characters long")
      return
    }

    try {
      setProcessingDocument("Text Content")
      setShowProgress(true)

      await onAddText(inputText)
      setInputText("")
      setTextSuccess("Text content added successfully!")
      setTimeout(() => setTextSuccess(null), 3000)
    } catch (error) {
      setTextError(`Failed to add text: ${error}`)
      setShowProgress(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setProcessingDocument(file.name)
      setShowProgress(true)
      await onAddFile(file)
    } catch (error) {
      setShowProgress(false)
      throw error
    }
  }

  const handleUrlSubmit = async (url: string) => {
    try {
      setProcessingDocument(url)
      setShowProgress(true)
      await onAddUrl(url)
    } catch (error) {
      setShowProgress(false)
      throw error
    }
  }

  const handleProcessingComplete = () => {
    setShowProgress(false)
    setProcessingDocument("")
  }

  if (showProgress) {
    return (
      <ProcessingProgress
        isVisible={showProgress}
        documentName={processingDocument}
        onComplete={handleProcessingComplete}
      />
    )
  }

  return (
    <Card className="flex flex-col h-full card-interactive shadow-soft hover:shadow-elevated bg-gradient-to-br from-card via-card to-muted/20 border-2 hover:border-primary/20 transition-all duration-300">
      <div className="p-6 border-b bg-gradient-to-r from-muted/30 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 shadow-glow">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            Document Ingestion
          </h2>
          <InfoTooltip
            content="Add documents to create a searchable knowledge base. Supported formats include text, PDF, Word documents, and web URLs."
            side="right"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">Add documents to your knowledge base</p>
      </div>

      <div className="flex-1 p-6">
        <Tabs defaultValue="text" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm p-1 rounded-xl shadow-soft">
            <TabsTrigger
              value="text"
              className="rounded-lg transition-all duration-200 hover:scale-105 data-[state=active]:shadow-soft"
            >
              Text
            </TabsTrigger>
            <TabsTrigger
              value="file"
              className="rounded-lg transition-all duration-200 hover:scale-105 data-[state=active]:shadow-soft"
            >
              File
            </TabsTrigger>
            <TabsTrigger
              value="url"
              className="rounded-lg transition-all duration-200 hover:scale-105 data-[state=active]:shadow-soft"
            >
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="flex-1 flex flex-col gap-4 animate-fade-in">
            <Textarea
              placeholder="Paste your text content here... (minimum 50 characters)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 min-h-[200px] resize-none input-enhanced rounded-xl border-2 focus:border-primary/50 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm shadow-soft max-h-[200px] overflow-y-auto"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 backdrop-blur-sm">
              <span className="font-medium">{inputText.length} characters</span>
              <span
                className={`flex items-center gap-1 ${inputText.length >= 50 ? "text-green-600" : "text-amber-600"}`}
              >
                {inputText.length >= 50 ? "✓" : "⚠"} Minimum 50 characters
              </span>
            </div>

            <Button
              onClick={handleTextSubmit}
              disabled={!inputText.trim() || isProcessing}
              className="w-full btn-enhanced rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-soft hover:shadow-elevated"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Add Text to Knowledge Base"
              )}
            </Button>

            {textError && (
              <Alert
                variant="destructive"
                className="animate-scale-in border-2 shadow-soft bg-gradient-to-r from-destructive/10 to-destructive/5"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{textError}</AlertDescription>
              </Alert>
            )}

            {textSuccess && (
              <Alert className="animate-scale-in border-2 border-green-200 shadow-soft bg-gradient-to-r from-green-50 to-green-25">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{textSuccess}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="file" className="flex-1 flex flex-col gap-4 animate-fade-in">
            <FileUploadZone onFileSelect={handleFileUpload} isProcessing={isProcessing} />
          </TabsContent>

          <TabsContent value="url" className="flex-1 flex flex-col gap-4 animate-fade-in">
            <UrlInputSection onUrlSubmit={handleUrlSubmit} isProcessing={isProcessing} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t hidden bg-gradient-to-r from-muted/20 to-transparent p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-subtle"></div>
            Knowledge Base ({documents.length} documents)
          </h3>
        </div>
        <ScrollArea className="h-32 custom-scrollbar">
          {documents.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8 bg-muted/20 rounded-xl border-2 border-dashed border-muted-foreground/20">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>No documents added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl group hover:from-muted/70 hover:to-muted/50 transition-all duration-300 hover:scale-[1.02] shadow-soft hover:shadow-elevated animate-slide-in border border-border/50 hover:border-primary/30"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {doc.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.chunkCount} chunks • {doc.source} • {doc?.createdAt?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 shadow-soft">
                      {doc.chunkCount}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveDocument(doc.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:scale-110 rounded-lg"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </Card>
  )
}
