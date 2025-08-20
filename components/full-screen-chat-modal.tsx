"use client"
import { useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "./chat-interface"
import type { ChatMessage } from "@/lib/types"

interface FullScreenChatModalProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  isLoading: boolean
  hasDocuments: boolean
}

export function FullScreenChatModal({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  hasDocuments,
}: FullScreenChatModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full h-full animate-in zoom-in-95 fade-in-0 duration-300">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-6 right-6 z-10 h-12 w-12 p-0 bg-background/90 backdrop-blur-sm hover:bg-background border shadow-lg transition-all duration-200 hover:scale-105"
          title="Close full screen (Esc)"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Full Screen Chat */}
        <div className="h-full overflow-hidden shadow-2xl bg-background">
          <ChatInterface
            messages={messages}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            hasDocuments={hasDocuments}
          />
        </div>
      </div>
    </div>
  )
}
