"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Loader2, FileText, Zap, Database, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProcessingStep {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  duration: number // in milliseconds
}

const PROCESSING_STEPS: ProcessingStep[] = [
  {
    id: "parsing",
    label: "Parsing Document",
    description: "Extracting text content and metadata from your document",
    icon: FileText,
    duration: 1500,
  },
  {
    id: "chunking",
    label: "Creating Chunks",
    description: "Breaking down content into optimal-sized segments for processing",
    icon: Zap,
    duration: 2000,
  },
  {
    id: "embedding",
    label: "Generating Embeddings",
    description: "Creating vector representations using AI models",
    icon: Brain,
    duration: 3000,
  },
  {
    id: "storing",
    label: "Storing in Database",
    description: "Saving processed chunks to the vector database",
    icon: Database,
    duration: 1000,
  },
]

interface ProcessingProgressProps {
  isVisible: boolean
  documentName?: string
  onComplete?: () => void
}

export function ProcessingProgress({ isVisible, documentName = "Document", onComplete }: ProcessingProgressProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setCurrentStepIndex(0)
      setProgress(0)
      setIsComplete(false)
      return
    }

    const processSteps = async () => {
      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        setCurrentStepIndex(i)
        const step = PROCESSING_STEPS[i]

        // Simulate step progress
        const stepProgress = (i / PROCESSING_STEPS.length) * 100
        const nextStepProgress = ((i + 1) / PROCESSING_STEPS.length) * 100

        // Animate progress within the step
        const startTime = Date.now()
        const animate = () => {
          const elapsed = Date.now() - startTime
          const stepProgressPercent = Math.min(elapsed / step.duration, 1)
          const currentProgress = stepProgress + (nextStepProgress - stepProgress) * stepProgressPercent

          setProgress(currentProgress)

          if (stepProgressPercent < 1) {
            requestAnimationFrame(animate)
          }
        }

        animate()

        // Wait for step to complete
        await new Promise((resolve) => setTimeout(resolve, step.duration))
      }

      setProgress(100)
      setIsComplete(true)

      // Call onComplete after a brief delay
      setTimeout(() => {
        onComplete?.()
      }, 500)
    }

    processSteps()
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Processing Document</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {documentName} • {isComplete ? "Complete!" : `Step ${currentStepIndex + 1} of ${PROCESSING_STEPS.length}`}
          </p>
        </div>

        <div className="space-y-4">
          <Progress value={progress} className="h-2" />

          <div className="space-y-3">
            {PROCESSING_STEPS.map((step, index) => {
              const isActive = index === currentStepIndex && !isComplete
              const isCompleted = index < currentStepIndex || isComplete
              const isPending = index > currentStepIndex && !isComplete

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                    isActive && "bg-primary/10 border border-primary/20",
                    isCompleted && "bg-green-50 dark:bg-green-950/20",
                    isPending && "opacity-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted && "bg-green-500 text-white",
                      isPending && "bg-muted text-muted-foreground",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isActive && "text-primary",
                        isCompleted && "text-green-700 dark:text-green-400",
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
