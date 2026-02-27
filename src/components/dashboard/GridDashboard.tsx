"use client"

import * as React from "react"
import { StatusGrid } from "./StatusGrid"
import { FrequencyChart } from "./FrequencyChart"
import { EventInjector } from "../simulator/EventInjector"
import { useGridStore } from "@/lib/grid-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, CloudSun, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function GridDashboard() {
  const { status, attackStatus, phaseCoherence, nodesAtRisk, deceptiveSignalInjection, forecastAlert, initializeSystemData } = useGridStore()

  // No need for local tick — global TickProvider handles the 2s interval
  React.useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  return (
    <div className="space-y-6">
      <StatusGrid />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FrequencyChart />
        </div>
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-emerald-400" />
                Forecast Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              {forecastAlert ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <div className="text-xs font-bold mb-1">{forecastAlert.event}</div>
                  <div className="text-[10px] text-muted-foreground">{forecastAlert.detail}</div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted/20 border border-border mb-4">
                  <div className="text-xs font-bold mb-1">No Active Alerts</div>
                  <div className="text-[10px] text-muted-foreground">All sectors nominal.</div>
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest" suppressHydrationWarning>
                <Link href="/forecast">
                  View Sky-Cam Feed
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Bot className="h-4 w-4 text-accent" />
                AI Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                &quot;System health is currently {status.toUpperCase()}. MARL agents are synchronized. {attackStatus !== 'none' ? `Adversarial phase alignment detected — coherence at ${(phaseCoherence * 100).toFixed(1)}%.` : 'No adversarial phase alignment detected.'}&quot;
              </p>
              <Button asChild className="w-full bg-accent text-accent-foreground rounded-lg font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity" suppressHydrationWarning>
                <Link href="/assistant">
                  Initiate Full Analysis
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <EventInjector />
        </div>
        <div className="lg:col-span-2">
          <Card className="bg-card border-border shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Live Defense Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-3xl font-headline font-bold text-foreground">
                    {attackStatus === 'none' ? 'NO ATTACK' : 'MITIGATING'}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
                    Phase Coherence: {(phaseCoherence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${attackStatus === 'none' ? 'bg-muted/50' : 'bg-red-500/20 animate-pulse'}`}>
                  <ShieldAlert className={`h-6 w-6 ${attackStatus === 'none' ? 'text-muted-foreground' : 'text-red-500'}`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Nodes at Risk</div>
                  <div className="text-sm font-bold">{nodesAtRisk.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Defense Level</div>
                  <div className="text-sm font-bold">{attackStatus === 'none' ? 'Passive' : deceptiveSignalInjection ? 'DECEPTIVE ON' : 'ACTIVE'}</div>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full bg-primary/10 border border-primary/20 text-primary rounded-lg font-bold text-[10px] uppercase tracking-widest mt-6 hover:bg-primary/20 transition-colors" suppressHydrationWarning>
                <Link href="/defense">
                  Open Defense Console
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}