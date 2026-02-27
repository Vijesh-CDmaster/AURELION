"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { TrendingUp, Clock, Zap, Activity, Users, Shield, CloudSun } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatusGrid() {
  const { frequency, latency, vppResponse, status, activeAgents, attackStatus, agentSyncRate } = useGridStore()

  const metrics = [
    {
      label: "Grid Frequency",
      value: `${frequency.toFixed(3)} Hz`,
      sub: status === 'stable' ? "Within nominal bounds" : "Deviation Alert",
      icon: Activity,
      color: status === 'stable' ? "text-emerald-400" : status === 'warning' ? "text-amber-400" : "text-red-400",
    },
    {
      label: "Active Agents",
      value: activeAgents.toLocaleString(),
      sub: `Sync: ${agentSyncRate.toFixed(1)}% Core`,
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "VPP Contribution",
      value: `${vppResponse > 0 ? "+" : ""}${vppResponse} MW`,
      sub: vppResponse !== 0 ? "Dispatching assets" : "Idle state",
      icon: Zap,
      color: vppResponse === 0 ? "text-muted-foreground" : "text-accent",
    },
    {
      label: "Defense status",
      value: attackStatus === 'none' ? "STABLE" : "ACTIVE",
      sub: attackStatus === 'none' ? "No threats detected" : "Mitigating attack",
      icon: Shield,
      color: attackStatus === 'none' ? "text-muted-foreground" : "text-red-400",
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
          {m.color.includes('red') && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
          )}
          {m.color.includes('accent') && vppResponse !== 0 && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-accent animate-pulse" />
          )}
        </Card>
      ))}
    </div>
  )
}
