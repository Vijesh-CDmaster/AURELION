"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { TrendingUp, TrendingDown, Clock, Zap, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatusGrid() {
  const { frequency, latency, vppResponse, solarGeneration } = useGridStore()

  const metrics = [
    {
      label: "Grid Frequency",
      value: `${frequency.toFixed(3)} Hz`,
      sub: frequency > 50 ? "+0.002 from nominal" : "-0.001 from nominal",
      icon: Activity,
      color: frequency >= 49.95 && frequency <= 50.05 ? "text-emerald-400" : "text-amber-400",
    },
    {
      label: "System Latency",
      value: `${latency}ms`,
      sub: "Optimized via edge",
      icon: Clock,
      color: "text-blue-400",
    },
    {
      label: "VPP Response",
      value: `${vppResponse > 0 ? "+" : ""}${vppResponse} MW`,
      sub: vppResponse !== 0 ? "Dispatching assets" : "Idle state",
      icon: Zap,
      color: vppResponse === 0 ? "text-muted-foreground" : "text-accent",
    },
    {
      label: "Solar Generation",
      value: `${solarGeneration} kW`,
      sub: "Probabilistic: 98% conf.",
      icon: TrendingUp,
      color: "text-yellow-400",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.label} className="bg-card border-border hover:border-primary/50 transition-colors shadow-sm overflow-hidden relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</span>
              <m.icon className={cn("h-4 w-4", m.color)} />
            </div>
            <div className="text-2xl font-headline font-bold text-foreground">
              {m.value}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">
              {m.sub}
            </p>
          </CardContent>
          {m.color === "text-accent" && vppResponse !== 0 && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-accent animate-pulse" />
          )}
        </Card>
      ))}
    </div>
  )
}