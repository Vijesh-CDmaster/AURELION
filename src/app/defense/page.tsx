"use client"

import { useEffect } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { Shield, AlertTriangle, Lock, Unlock, Fingerprint, History, Radio, HeartPulse, Radar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

export default function DefensePage() {
  const {
    attackStatus, triggerAttack, phaseCoherence, attackIntensity, coherenceData,
    defenseLog, deceptiveSignalInjection, nodesAtRisk, recoveryProgress,
    deceptiveSignalStrength, avgDetectionTime, falsePositiveRate, recoveryEfficiency,
    attacksMitigated, initializeSystemData
  } = useGridStore()

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Adversarial Defense</h2>
            <p className="text-muted-foreground text-sm">Monitoring load phase-coherence for demand-side fingerprinting and attack mitigation.</p>
          </div>
          <div className="flex items-center gap-2">
            {attackStatus === 'none' ? (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2 font-bold uppercase tracking-widest text-[10px]"
                onClick={() => triggerAttack('detected')}
                suppressHydrationWarning
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Simulate Attack
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 font-bold uppercase tracking-widest text-[10px] border-emerald-500/30 text-emerald-400"
                onClick={() => triggerAttack('none')}
                suppressHydrationWarning
              >
                <Shield className="h-3.5 w-3.5" />
                Clear System
              </Button>
            )}
          </div>
        </div>

        {/* Attack Banner */}
        {attackStatus !== 'none' && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                  <Shield className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">Active Demand-Side Attack</h3>
                  <p className="text-xs text-red-300/80">Coordinated device surge detected. Deploying desynchronization signals.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500/20 text-red-400 text-[8px]">{nodesAtRisk.toLocaleString()} Nodes at Risk</Badge>
                <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white font-bold h-8 text-[10px] uppercase" suppressHydrationWarning>
                  Escalate Defense
                </Button>
              </div>
            </div>
            {/* Recovery Progress */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-red-300/80 font-bold uppercase">Recovery Progress</span>
                <span className="text-red-400 font-mono">{recoveryProgress.toFixed(0)}%</span>
              </div>
              <Progress value={recoveryProgress} className="h-2 bg-red-500/10" />
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Phase Coherence</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-primary">{(phaseCoherence * 100).toFixed(1)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={phaseCoherence * 100} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-2">Threshold: 45.0%</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Defense Status</CardDescription>
              <CardTitle className="text-2xl font-headline font-bold uppercase flex items-center gap-2">
                {attackStatus === 'none' ? <Unlock className="h-5 w-5 text-muted-foreground" /> : <Lock className="h-5 w-5 text-accent" />}
                {attackStatus === 'none' ? 'Passive' : 'ACTIVE'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className={`text-[8px] ${attackStatus !== 'none' ? 'border-accent text-accent' : 'text-muted-foreground'}`}>
                DSI {deceptiveSignalInjection && attackStatus !== 'none' ? 'ENGAGED' : 'STANDBY'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Attack Intensity</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold">
                {attackIntensity.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">MW/min</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">Delta-demand rate variation</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Attacks Mitigated</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-emerald-400">{attacksMitigated}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">Avg detection: {avgDetectionTime.toFixed(1)}s</div>
            </CardContent>
          </Card>
        </div>

        {/* Deceptive Signal Meter + Defense Metrics */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Radio className="h-4 w-4 text-accent" />
                Deceptive Signal Strength
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="relative h-32 w-32">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={deceptiveSignalStrength > 60 ? 'hsl(var(--accent))' : deceptiveSignalStrength > 30 ? 'hsl(45 100% 50%)' : 'hsl(var(--muted-foreground))'} strokeWidth="8" strokeDasharray={`${deceptiveSignalStrength * 3.14} 314`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-headline font-bold">{deceptiveSignalStrength.toFixed(0)}%</div>
                      <div className="text-[8px] text-muted-foreground uppercase">Strength</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground text-center italic">
                {deceptiveSignalInjection ? 'Noise injection active to disrupt phase-fingerprinting' : 'DSI module disabled in config'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-emerald-400" />
                Defense Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Detection Time</span>
                  <span className="text-xs font-mono font-bold">{avgDetectionTime.toFixed(1)}s</span>
                </div>
                <Progress value={Math.min(100, (1 / avgDetectionTime) * 100)} className="h-1" />
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">False Positive Rate</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{(falsePositiveRate * 100).toFixed(2)}%</span>
                </div>
                <Progress value={falsePositiveRate * 500} className="h-1" />
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Recovery Efficiency</span>
                  <span className="text-xs font-mono font-bold">{recoveryEfficiency.toFixed(1)}%</span>
                </div>
                <Progress value={recoveryEfficiency} className="h-1" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Radar className="h-4 w-4 text-red-400" />
                Node Risk Visualization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 25 }).map((_, i) => {
                  const isAtRisk = attackStatus !== 'none' && i < Math.round(nodesAtRisk / 100)
                  return (
                    <div
                      key={i}
                      className={`h-8 rounded border ${isAtRisk ? 'bg-red-500/30 border-red-500/50 animate-pulse' : 'bg-muted/20 border-border'}`}
                    />
                  )
                })}
              </div>
              <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded bg-muted/50 border border-border" />
                  <span>Safe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded bg-red-500/30 border border-red-500/50" />
                  <span>At Risk ({nodesAtRisk.toLocaleString()})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coherence Fingerprint + Defense Log */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-primary" />
                Load Synchronization Fingerprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={coherenceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[0, 1]} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                    <Area type="monotone" dataKey="attack" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Defense Action Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[340px] overflow-auto">
              {defenseLog.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">No actions logged. Trigger an attack simulation.</div>
              ) : defenseLog.slice(0, 10).map((log, i) => (
                <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-muted/20 border border-border">
                  <div className={`h-2 w-2 rounded-full mt-1 shrink-0 ${log.severity === 'critical' ? 'bg-red-500 animate-pulse' : log.severity === 'warning' ? 'bg-amber-500' : 'bg-primary'}`} />
                  <div>
                    <div className="text-[10px] text-muted-foreground">{log.time} — {log.target}</div>
                    <div className="text-xs font-medium">{log.action}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  )
}