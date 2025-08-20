"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link, Loader2, AlertCircle, CheckCircle, Globe } from "lucide-react"

interface UrlInputSectionProps {
  onUrlSubmit: (url: string) => Promise<void>
  isProcessing: boolean
}

export function UrlInputSection({ onUrlSubmit, isProcessing }: UrlInputSectionProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const validateUrl = (url: string): { isValid: boolean; error?: string } => {
    if (!url.trim()) {
      return { isValid: false, error: "URL is required" }
    }

    try {
      const urlObj = new URL(url)

      // Check protocol
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return { isValid: false, error: "URL must use HTTP or HTTPS protocol" }
      }

      // Check for localhost or private IPs (basic security)
      if (
        urlObj.hostname === "localhost" ||
        urlObj.hostname.startsWith("127.") ||
        urlObj.hostname.startsWith("192.168.")
      ) {
        return { isValid: false, error: "Local URLs are not allowed for security reasons" }
      }

      return { isValid: true }
    } catch {
      return { isValid: false, error: "Invalid URL format" }
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)

    const validation = validateUrl(url)
    if (!validation.isValid) {
      setError(validation.error || "Invalid URL")
      return
    }

    try {
      await onUrlSubmit(url)
      setSuccess(`Successfully processed: ${new URL(url).hostname}`)
      setUrl("")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(`Failed to process URL: ${error}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Extract domain for display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isProcessing}
            className="pl-10"
          />
        </div>

        {url && getDomain(url) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>Will fetch content from: {getDomain(url)}</span>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!url.trim() || isProcessing} className="w-full">
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Fetching content...
            </>
          ) : (
            <>
              <Link className="h-4 w-4 mr-2" />
              Fetch and Add URL
            </>
          )}
        </Button>
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

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Supports most public websites and articles</p>
        <p>• Content will be extracted and processed automatically</p>
        <p>• Large pages may take longer to process</p>
      </div>
    </div>
  )
}
