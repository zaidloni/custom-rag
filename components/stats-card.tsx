import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: number
}

export function StatsCard({ icon: Icon, label, value }: StatsCardProps) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md hover:bg-card/80 transition-all duration-300 hover:scale-105">
      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="text-sm">
        <div className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
          {value}
        </div>
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
      </div>
    </div>
  )
}
