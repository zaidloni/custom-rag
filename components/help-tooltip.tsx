"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HelpCircle, X } from "lucide-react"

interface HelpTooltipProps {
  content: string
  title?: string
}

export function HelpTooltip({ content, title }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
      >
        <HelpCircle className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <Card className="absolute right-0 top-6 z-20 p-3 max-w-xs bg-popover border shadow-lg animate-slide-in">
            <div className="flex items-start justify-between mb-2">
              {title && <h4 className="font-medium text-sm text-foreground mb-1">{title}</h4>}
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-4 w-4 p-0 ml-2">
                <X className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{content}</p>
          </Card>
        </>
      )}
    </div>
  )
}
