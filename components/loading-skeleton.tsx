import { Card } from "@/components/ui/card"

export function DocumentSkeleton() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
        <div className="h-8 w-8 bg-muted rounded"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 bg-muted rounded w-16"></div>
        <div className="h-5 bg-muted rounded w-20"></div>
      </div>
    </Card>
  )
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 w-4 bg-muted rounded"></div>
          </div>
          <div className="h-8 bg-muted rounded w-1/3 mb-1"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </Card>
      ))}
    </div>
  )
}
