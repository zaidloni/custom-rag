"use client"

import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface InfoTooltipProps {
  content: string
  side?: "top" | "right" | "bottom" | "left"
  className?: string
  iconClassName?: string
}

export function InfoTooltip({ content, side = "top", className, iconClassName }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={cn("inline-flex items-center justify-center", className)}>
            <Info
              className={cn("h-4 w-4 text-muted-foreground hover:text-foreground transition-colors", iconClassName)}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
