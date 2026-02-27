"use client"

import { useEffect, useCallback } from "react"
import { Shell } from "@/components/layout/Shell"
import { FrequencyChart } from "@/components/dashboard/FrequencyChart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAI } from "@/hooks/useAI"
import { fastapi } from "@/lib/fastapi"
import { Activity, ArrowDown, ArrowUp, Download, Gauge, Cpu, MapPin, Bot, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from "recharts"

export default function FrequencyMonitorPage() {
  const {
    frequency, status, dfdt, latency, virtualInertia, stabilityZones,
    frequencyHistory, agentClusters, responseThreshold, initializeSystemData, updateFromServer, tick
  } = useGridStore()

  const { connected } = useWebSocket({ channel: 'grid', onMessage: (data) => updateFromServer(data) })
  const { insight: aiInsight, loading: aiLoading, refresh: refreshAI } = useAI({
    fetcher: fastapi.ai.frequencyAnalysis, refreshInterval: 30000,
  })

  useEffect(() => { initializeSystemData() }, [initializeSystemData])
  useEffect(() => { if (!connected) { const i = setInterval(() => tick(), 2000); return () => clearInterval(i) } }, [tick, connected])

  const deviationData = frequencyHistory.slice(-30).map((p) => ({
    time: p.time,
    deviation: Math.abs(50 - p.value) * 1000,
  }))

  const handleExportCSV = useCallback(() => {
    const header = "Timestamp,Frequency(Hz),Deviation(mHz),df/dt\n"
    const rows = frequencyHistory.map((p) =>
      `${p.time},${p.value.toFixed(4)},${(Math.abs(50 - p.value) * 1000).toFixed(1)},${dfdt.toFixed(5)}`
    ).join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `frequency-data-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [frequencyHistory, dfdt])

  const getDeviationColor = (dev: number) => {
    if (dev < 30) return "bg-emerald-500"
    if (dev < 80) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Grid Frequency Monitor</h2>
            <p className="text-muted-foreground text-sm">Real-time analysis of grid frequency deviations and df/dt stability metrics.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[8px] h-6 px-3">
              Threshold: {responseThreshold.toFixed(2)} Hz
            </Badge>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV} suppressHydrationWarning>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Current Hz</CardDescription>
              <CardTitle className="text-3xl font-headline font-black text-primary">{frequency.toFixed(3)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs">
                {frequency > 50 ? <ArrowUp className="h-3 w-3 text-emerald-400" /> : <ArrowDown className="h-3 w-3 text-red-400" />}
                <span className={frequency > 50 ? "text-emerald-400" : "text-red-400"}>
                  {Math.abs(50 - frequency).toFixed(3)} Hz
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">df/dt</CardDescription>
              <CardTitle className="text-3xl font-headline font-black">{dfdt.toFixed(4)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">Hz per second</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Status</CardDescription>
              <CardTitle className="text-2xl font-headline font-black uppercase">
                <Badge className={status === 'stable' ? 'bg-emerald-500/20 text-emerald-400' : status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}>
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
              <CardTitle className="text-3xl font-headline font-black text-accent">{Math.round(latency)}ms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">VPP Response delay</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Virtual Inertia</CardDescription>
              <CardTitle className="text-3xl font-headline font-black">{virtualInertia.toFixed(2)} <span className="text-sm text-muted-foreground">MW·s</span></CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={virtualInertia * 50} className="h-1.5" />
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
                <MapPin className="h-4 w-4 text-primary" />
                Stability Zones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stabilityZones.map((zone, i) => {
                const zDev = Math.abs(50 - zone.freq) * 1000
                return (
                  <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold">{zone.label}</div>
                      <div className="text-xs font-mono font-bold text-primary">{zone.freq.toFixed(3)} Hz</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-muted-foreground">Load: {zone.load}</div>
                      <Badge variant="outline" className={`text-[8px] h-4 ${zDev < 10 ? 'border-emerald-500/30 text-emerald-400' : zDev < 30 ? 'border-amber-500/30 text-amber-400' : 'border-red-500/30 text-red-400'}`}>
                        ±{zDev.toFixed(1)}mHz
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Gauge className="h-4 w-4 text-accent" />
                Frequency Deviation Heatmap
              </CardTitle>
              <CardDescription>Deviation magnitude over recent samples (mHz)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviationData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="time" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="deviation" radius={[2, 2, 0, 0]}>
                      {deviationData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.deviation < 30 ? 'hsl(var(--primary))' : entry.deviation < 80 ? 'hsl(45 100% 50%)' : 'hsl(0 80% 55%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Per-Transformer Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {agentClusters.slice(0, 6).map((cluster, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border">
                    <div className="text-xs font-bold mb-1 truncate">{cluster.name}</div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted-foreground">{cluster.count} nodes</span>
                      <Badge variant={cluster.status === 'active' ? 'default' : 'secondary'} className="text-[7px] h-3.5">
                        {cluster.status.toUpperCase()}
                      </Badge>
                    </div>
                    <Progress value={cluster.response} className="h-1" />
                    <div className="text-[9px] text-muted-foreground mt-1 text-right">{cluster.response.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI df/dt Analysis Card */}
        <Card className="bg-card border-border bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Bot className="h-4 w-4 text-accent" />
              AI Frequency Analysis
              <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={refreshAI} disabled={aiLoading}>
                <RefreshCw className={`h-3 w-3 ${aiLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground italic leading-relaxed">{aiLoading ? 'Analysing df/dt data…' : aiInsight || 'Waiting for AI analysis…'}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Historical Frequency Log</CardTitle>
            <CardDescription>Last {frequencyHistory.length} readings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Frequency (Hz)</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Deviation (mHz)</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...frequencyHistory].reverse().slice(0, 20).map((p, i) => {
                    const dev = Math.abs(50 - p.value) * 1000
                    const rowStatus = dev > 150 ? 'critical' : dev > 80 ? 'warning' : 'nominal'
                    return (
                      <TableRow key={i} className="border-border hover:bg-muted/30">
                        <TableCell className="text-xs font-mono">{p.time}</TableCell>
                        <TableCell className="text-xs font-mono font-bold">{p.value.toFixed(4)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getDeviationColor(dev)}`} />
                            <span className="text-xs font-mono">{dev.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[8px] h-4 ${rowStatus === 'nominal' ? 'border-emerald-500/30 text-emerald-400' : rowStatus === 'warning' ? 'border-amber-500/30 text-amber-400' : 'border-red-500/30 text-red-400'}`}>
                            {rowStatus.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}