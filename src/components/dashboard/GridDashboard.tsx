"use client"

import * as React from "react"
import { StatusGrid } from "./StatusGrid"
import { FrequencyChart } from "./FrequencyChart"
import { EventInjector } from "../simulator/EventInjector"
import { useGridStore } from "@/lib/grid-store"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAI } from "@/hooks/useAI"
import { fastapi } from "@/lib/fastapi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, CloudSun, ShieldAlert, Activity, Zap, Heart, AlertTriangle, Wifi, WifiOff, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export function GridDashboard() {
  const {
    status, attackStatus, phaseCoherence, nodesAtRisk, deceptiveSignalInjection,
    forecastAlert, initializeSystemData, tick, frequency, solarGeneration, loadDemand,
    energySaved, latency, activeAgents, agentSyncRate, alerts, dfdt,
    recoveryEfficiency, avgDetectionTime, forecastAccuracy, updateFromServer, serverConnected
  } = useGridStore()

  // ── WebSocket: stream full grid state from FastAPI ──
  const { connected } = useWebSocket({
    channel: 'grid',
    onMessage: (data) => updateFromServer(data),
  })

  // ── Claude AI: dashboard summary (refreshes every 30s) ──
  const { insight: aiSummary, loading: aiLoading, refresh: refreshAI } = useAI({
    fetcher: fastapi.ai.dashboardSummary,
    refreshInterval: 30000,
  })

  // Fallback: local tick if WebSocket not connected
  React.useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  React.useEffect(() => {
    if (!connected) {
      const interval = setInterval(() => tick(), 2000)
      return () => clearInterval(interval)
    }
  }, [tick, connected])

  const recentAlerts = alerts.filter(a => a.status === 'active').slice(0, 4)
  const freqDev = Math.abs(50 - frequency)

  return (
    <div className="space-y-6">
      {/* Connection Status Banner */}
      <div className="flex items-center gap-2 text-xs">
        {connected ? (
          <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-400">
            <Wifi className="h-3 w-3" /> FastAPI Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-400">
            <WifiOff className="h-3 w-3" /> Local Simulation
          </Badge>
        )}
      </div>

      <StatusGrid />

      {/* System Health Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Solar Generation</span>
              <CloudSun className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-headline font-bold">{Math.round(solarGeneration).toLocaleString()} <span className="text-sm text-muted-foreground">kW</span></div>
            <div className="mt-2 flex items-center gap-2">
              <Progress value={Math.min(100, (solarGeneration / 4000) * 100)} className="h-1 flex-1" />
              <span className="text-[9px] text-muted-foreground">{Math.round((solarGeneration / 4000) * 100)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Load Demand</span>
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-headline font-bold">{Math.round(loadDemand).toLocaleString()} <span className="text-sm text-muted-foreground">kW</span></div>
            <div className="text-[10px] mt-1 text-muted-foreground">Imbalance: <span className={solarGeneration > loadDemand ? 'text-emerald-400' : 'text-amber-400'}>{Math.round(solarGeneration - loadDemand).toLocaleString()} kW</span></div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Energy Saved</span>
              <Heart className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-headline font-bold text-emerald-400">{Math.round(energySaved).toLocaleString()} <span className="text-sm text-muted-foreground">kWh</span></div>
            <div className="text-[10px] mt-1 text-emerald-400/80 font-bold">+${(energySaved * 0.12).toFixed(0)} estimated value</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Forecast Accuracy</span>
              <Activity className="h-4 w-4 text-accent" />
            </div>
            <div className="text-2xl font-headline font-bold text-accent">{forecastAccuracy.toFixed(1)}%</div>
            <div className="text-[10px] mt-1 text-muted-foreground">df/dt: <span className="font-mono">{dfdt.toFixed(4)} Hz/s</span></div>
          </CardContent>
        </Card>
      </div>

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
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[8px] h-4 border-emerald-500/30 text-emerald-400">
                      {(forecastAlert.probability * 100).toFixed(0)}% Probability
                    </Badge>
                    <Badge variant="outline" className="text-[8px] h-4">
                      {forecastAlert.leadMinutes}m Lead
                    </Badge>
                  </div>
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
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={refreshAI} disabled={aiLoading}>
                  <RefreshCw className={`h-3 w-3 ${aiLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                {aiLoading ? 'Analysing grid state…' : aiSummary || `"System health is currently ${status.toUpperCase()}. MARL agents are synchronized (${agentSyncRate.toFixed(1)}%). ${attackStatus !== 'none' ? `Adversarial phase alignment detected — coherence at ${(phaseCoherence * 100).toFixed(1)}%.` : `Forecast accuracy at ${forecastAccuracy.toFixed(1)}%.`}"`}
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
        <div className="lg:col-span-1">
          <Card className="bg-card border-border shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Live Defense Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-headline font-bold text-foreground">
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
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg border border-border bg-muted/20">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Nodes at Risk</div>
                  <div className="text-sm font-bold">{nodesAtRisk.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded-lg border border-border bg-muted/20">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Defense</div>
                  <div className="text-sm font-bold">{attackStatus === 'none' ? 'Passive' : deceptiveSignalInjection ? 'DECEPTIVE' : 'ACTIVE'}</div>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full mt-4 text-[10px] font-bold uppercase tracking-widest" suppressHydrationWarning>
                <Link href="/defense">
                  Open Defense Console
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="bg-card border-border shadow-md h-full">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAlerts.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">No active alerts. System nominal.</div>
              ) : recentAlerts.map((alert) => (
                <div key={alert.id} className="flex gap-3 p-2 rounded-lg bg-muted/20 border border-border">
                  <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${alert.severity === 'critical' || alert.severity === 'attack' ? 'bg-red-500 animate-pulse' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground">{alert.time}</div>
                    <div className="text-xs font-medium truncate">{alert.message}</div>
                  </div>
                </div>
              ))}
              <Button asChild variant="link" className="text-accent text-[10px] p-0 h-auto w-full justify-center" suppressHydrationWarning>
                <Link href="/history">View All Events →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}