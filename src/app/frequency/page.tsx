"use client"

import { useEffect } from "react"
import { Shell } from "@/components/layout/Shell"
import { FrequencyChart } from "@/components/dashboard/FrequencyChart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { Activity, ArrowDown, ArrowUp, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function FrequencyMonitorPage() {
  const { frequency, status, dfdt, latency, virtualInertia, stabilityZones, initializeSystemData } = useGridStore()

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Grid Frequency Monitor</h2>
            <p className="text-muted-foreground text-sm">Real-time analysis of grid frequency deviations and df/dt stability metrics.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" suppressHydrationWarning>
              <Download className="h-4 w-4" />
              Export History
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Current Hz</CardDescription>
              <CardTitle className="text-4xl font-headline font-black text-primary">{frequency.toFixed(3)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs">
                {frequency > 50 ? <ArrowUp className="h-3 w-3 text-emerald-400" /> : <ArrowDown className="h-3 w-3 text-red-400" />}
                <span className={frequency > 50 ? "text-emerald-400" : "text-red-400"}>
                  {Math.abs(50 - frequency).toFixed(3)} Hz from nominal
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">df/dt (Rate of Change)</CardDescription>
              <CardTitle className="text-4xl font-headline font-black">{dfdt.toFixed(4)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">Hz per second</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Status</CardDescription>
              <CardTitle className="text-2xl font-headline font-black uppercase flex items-center gap-2">
                <Badge className={status === 'stable' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                  {status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">Inertia: {virtualInertia > 0.8 ? 'STABLE' : virtualInertia > 0.5 ? 'MODERATE' : 'LOW'}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Latency</CardDescription>
              <CardTitle className="text-4xl font-headline font-black text-accent">{Math.round(latency)}ms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">VPP Response delay</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FrequencyChart />
          </div>
          <Card className="bg-card border-border h-full">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Stability Zones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stabilityZones.map((zone, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">{zone.label}</div>
                    <div className="text-[10px] text-muted-foreground">Load: {zone.load}</div>
                  </div>
                  <div className="text-xs font-mono font-bold text-primary">{zone.freq.toFixed(3)} Hz</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  )
}