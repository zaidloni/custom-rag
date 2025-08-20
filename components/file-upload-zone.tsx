"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, AlertCircle, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/config"

interface FileUploadZoneProps {
  onFileSelect: (file: File) => Promise<void>
  isProcessing: boolean
}

export function FileUploadZone({ onFileSelect, isProcessing }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    if (!SUPPORTED_FILE_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: `Unsupported file type: ${file.type}. Supported types: PDF, TXT, DOCX, MD`,
      }
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: ${
          MAX_FILE_SIZE / 1024 / 1024
        }MB`,
      }
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        isValid: false,
        error: "File is empty",
      }
    }

    return { isValid: true }
  }

  const handleFile = async (file: File) => {
    setError(null)
    setSuccess(null)

    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error || "Invalid file")
      return
    }

    try {
      await onFileSelect(file)
      setSuccess(`Successfully uploaded: ${file.name}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(`Failed to upload ${file.name}: ${error}`)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length === 0) return

      // Process first file only
      const file = files[0]
      await handleFile(file)
    },
    [onFileSelect],
  )

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFile(file)
      e.target.value = "" // Reset input
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : isProcessing
              ? "border-muted-foreground/30 bg-muted/30"
              : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <Upload className={`h-12 w-12 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>

          <div>
            <p className={`text-sm ${isDragOver ? "text-primary" : "text-muted-foreground"} mb-2`}>
              {isDragOver ? "Drop your file here" : "Drag and drop files here, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: PDF, TXT, DOCX, MD (max {MAX_FILE_SIZE / 1024 / 1024}MB)
            </p>
          </div>

          <Input
            type="file"
            accept=".pdf,.txt,.docx,.md"
            onChange={handleFileInput}
            disabled={isProcessing}
            className="max-w-xs"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
