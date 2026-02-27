"use client"

import { useEffect } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { Shield, AlertTriangle, Lock, Unlock, Fingerprint, History, Radio, BarChart3, Waves } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"

export default function DefensePage() {
  const {
    attackStatus, triggerAttack, phaseCoherence, attackIntensity, coherenceData,
    defenseLog, deceptiveSignalInjection, defenseTelemetry, initializeSystemData,
  } = useGridStore()

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  const dt = defenseTelemetry
  const cusumPct = Math.min((dt.cusumStatistic / dt.cusumThreshold) * 100, 100)

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Adversarial Defense</h2>
            <p className="text-muted-foreground text-sm">
              FFT spectral analysis + CUSUM change-point detection + Kuramoto phase coherence.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {attackStatus === 'none' ? (
              <Button
                variant="destructive" size="sm"
                className="gap-2 font-bold uppercase tracking-widest text-[10px]"
                onClick={() => triggerAttack('detected')} suppressHydrationWarning
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Simulate MadIoT Attack
              </Button>
            ) : (
              <Button
                variant="outline" size="sm"
                className="gap-2 font-bold uppercase tracking-widest text-[10px] border-emerald-500/30 text-emerald-400"
                onClick={() => triggerAttack('none')} suppressHydrationWarning
              >
                <Shield className="h-3.5 w-3.5" />
                Clear System
              </Button>
            )}
          </div>
        </div>

        {attackStatus !== 'none' && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                  <Shield className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">Active Demand-Side Attack</h3>
                  <p className="text-xs text-red-300/80">
                    Sync Index: {dt.synchronizationIndex.toFixed(3)} | Spectral: {dt.spectralAnomaly.toFixed(3)} |
                    CUSUM: {dt.cusumStatistic.toFixed(1)}/{dt.cusumThreshold.toFixed(0)} — Deploying desynchronization jitter.
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="text-[8px]">
                LATENCY {dt.detectionLatencyMs.toFixed(0)}ms
              </Badge>
            </div>
          </div>
        )}

        {/* ── Top KPIs ── */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Phase Coherence (Kuramoto R)</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-primary">{(phaseCoherence * 100).toFixed(1)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={phaseCoherence * 100} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-2">Threshold: 45% for attack ID</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Synchronization Index</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold">{dt.synchronizationIndex.toFixed(3)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">
                0.4·coherence + 0.35·spectral + 0.25·cusum
              </div>
              <Badge variant="outline" className={`text-[8px] mt-1 ${dt.synchronizationIndex > 0.5 ? 'border-red-500/40 text-red-400' : 'border-emerald-500/40 text-emerald-400'}`}>
                {dt.synchronizationIndex > 0.5 ? 'ANOMALOUS' : 'NORMAL'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">CUSUM Statistic</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold">
                {dt.cusumStatistic.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">/ {dt.cusumThreshold}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={cusumPct} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-2">{cusumPct.toFixed(0)}% of change-point threshold</p>
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
              <div className="flex items-center gap-2">
                {attackStatus === 'none' ? <Unlock className="h-3.5 w-3.5 text-muted-foreground" /> : <Lock className="h-3.5 w-3.5 text-accent" />}
                <Badge variant="outline" className={`text-[8px] ${attackStatus !== 'none' ? 'border-accent text-accent' : 'text-muted-foreground'}`}>
                  DECEPTIVE SIGNAL {deceptiveSignalInjection && attackStatus !== 'none' ? 'ON' : 'OFF'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Spectral + Entropy row ── */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                FFT Spectral Anomaly
              </CardTitle>
              <CardDescription className="text-[10px]">Radix-2 Cooley-Tukey on 128-point load window</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-2">
                <div className={`text-5xl font-headline font-black ${dt.spectralAnomaly > 0.4 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {dt.spectralAnomaly.toFixed(3)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase">Power Spectrum Anomaly Score</div>
              </div>
              {dt.loadSpectrum.length > 0 && (
                <div className="h-[140px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dt.loadSpectrum.slice(0, 32)}>
                      <XAxis dataKey="frequency" hide />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Bar dataKey="magnitude" fill="hsl(var(--primary))" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Waves className="h-4 w-4 text-accent" />
                Shannon Entropy
              </CardTitle>
              <CardDescription className="text-[10px]">16-bin normalised load distribution entropy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-2">
                <div className={`text-5xl font-headline font-black ${dt.entropyScore < 0.6 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {dt.entropyScore.toFixed(3)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase">
                  {dt.entropyScore < 0.6 ? 'LOW — Possible synchronised load' : 'Normal diversity'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                  <div className="text-[8px] font-bold text-muted-foreground uppercase">Detection Latency</div>
                  <div className="text-lg font-headline font-bold">{dt.detectionLatencyMs.toFixed(0)}ms</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                  <div className="text-[8px] font-bold text-muted-foreground uppercase">Spectrum Bins</div>
                  <div className="text-lg font-headline font-bold">{dt.loadSpectrum.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Coherence chart + Action Log ── */}
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
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
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
            <CardContent className="space-y-4">
              {defenseLog.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">No defense actions logged. Trigger an attack simulation to generate entries.</div>
              ) : defenseLog.slice(0, 8).map((log, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                  <div className={`h-2 w-2 rounded-full mt-1 shrink-0 ${log.severity === 'warning' ? 'bg-amber-500' : log.severity === 'critical' ? 'bg-red-500' : 'bg-primary'}`} />
                  <div>
                    <div className="text-[10px] text-muted-foreground">{log.time} - {log.target}</div>
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