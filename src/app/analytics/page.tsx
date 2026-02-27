"use client"

import { useEffect, useState, useCallback } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { BarChart3, TrendingUp, Download, Calendar, Zap, ShieldCheck, Activity, Target, Brain, Bot, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAI } from "@/hooks/useAI"
import { fastapi } from "@/lib/fastapi"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Area,
  AreaChart,
  Cell
} from "recharts"

export default function AnalyticsPage() {
  const {
    energySaved, performanceData, latency, avgDetectionTime, falsePositiveRate,
    recoveryEfficiency, attacksMitigated, attackFrequencyData, marlRewardHistory,
    forecastAccuracyHistory, initializeSystemData, updateFromServer, tick
  } = useGridStore()

  const [timeRange, setTimeRange] = useState("7d")

  const { connected } = useWebSocket({ channel: 'grid', onMessage: (data) => updateFromServer(data) })
  const { insight: aiInsight, loading: aiLoading, refresh: refreshAI } = useAI({
    fetcher: fastapi.ai.analyticsSummary, refreshInterval: 30000,
  })

  useEffect(() => { initializeSystemData() }, [initializeSystemData])
  useEffect(() => { if (!connected) { const i = setInterval(() => tick(), 2000); return () => clearInterval(i) } }, [tick, connected])

  const avgStability = performanceData.length > 0
    ? (performanceData.reduce((s, d) => s + d.stability, 0) / performanceData.length)
    : 0
  const totalSavings = performanceData.reduce((s, d) => s + d.savings, 0)
  const estimatedValue = `+$${Math.round(totalSavings * 0.12).toLocaleString()}`

  // Filter performance data based on time range
  const filteredPerf = timeRange === '24h' ? performanceData.slice(-3) : timeRange === '30d' ? performanceData : performanceData.slice(-7)

  const handleExportPDF = useCallback(() => {
    // Generate a text-based report as a downloadable file
    const lines = [
      "GRID-ENTROPY SENTINEL — ANALYTICS REPORT",
      `Generated: ${new Date().toISOString()}`,
      `Time Range: ${timeRange}`,
      "",
      `Avg Stability: ${avgStability.toFixed(1)}%`,
      `Energy Saved: ${Math.round(energySaved).toLocaleString()} kWh`,
      `Attacks Mitigated: ${attacksMitigated}`,
      `Response Latency: ${latency.toFixed(1)}ms`,
      `Avg Detection Time: ${avgDetectionTime.toFixed(1)}s`,
      `False Positive Rate: ${(falsePositiveRate * 100).toFixed(2)}%`,
      `Recovery Efficiency: ${recoveryEfficiency.toFixed(1)}%`,
      "",
      "PERFORMANCE DATA:",
      ...filteredPerf.map(d => `  ${d.day}: Stability ${d.stability}%, Savings ${d.savings} kWh`)
    ]
    const blob = new Blob([lines.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const  a = document.createElement("a"); a.href = url; a.download = "analytics-report.txt"; a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Report Exported", description: "Analytics report downloaded." })
  }, [timeRange, avgStability, energySaved, attacksMitigated, latency, avgDetectionTime, falsePositiveRate, recoveryEfficiency, filteredPerf])

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Analytics & Performance</h2>
            <p className="text-muted-foreground text-sm">Aggregated KPI monitoring and long-term stability trends.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <Calendar className="h-3.5 w-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-2 bg-primary text-white font-bold h-8 text-[10px] uppercase" onClick={handleExportPDF} suppressHydrationWarning>
              <Download className="h-3.5 w-3.5" />
              Export Report
            </Button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Avg Stability</CardDescription>
              <CardTitle className="text-3xl font-headline font-black text-emerald-400">{avgStability.toFixed(1)}%</CardTitle>
            </CardHeader>
            <CardContent><div className="text-[10px] text-muted-foreground">Normal operation hours</div></CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Energy Saved</CardDescription>
              <CardTitle className="text-3xl font-headline font-black text-primary">{Math.round(energySaved).toLocaleString()} <span className="text-sm">kWh</span></CardTitle>
            </CardHeader>
            <CardContent><div className="text-[10px] text-emerald-400 font-bold">{estimatedValue} estimated value</div></CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Attacks Mitigated</CardDescription>
              <CardTitle className="text-3xl font-headline font-black text-accent">{attacksMitigated}</CardTitle>
            </CardHeader>
            <CardContent><div className="text-[10px] text-muted-foreground">Last 30 days</div></CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Response Latency</CardDescription>
              <CardTitle className="text-3xl font-headline font-black text-blue-400">{latency.toFixed(1)}ms</CardTitle>
            </CardHeader>
            <CardContent><div className="text-[10px] text-muted-foreground">System-wide average</div></CardContent>
          </Card>
        </div>

        {/* Energy + Stability Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Energy Curtailment Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredPerf}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '11px' }} />
                    <Bar dataKey="savings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                Frequency Stability Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredPerf}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[90, 100]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="stability" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--accent))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attack Frequency + MARL Reward + Forecast Accuracy */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-red-400" />
                Attack Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attackFrequencyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="day" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '10px' }} />
                    <Bar dataKey="attacks" radius={[3, 3, 0, 0]}>
                      {attackFrequencyData.map((_, i) => (
                        <Cell key={i} fill={i === attackFrequencyData.length - 1 ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground) / 0.5)'} />
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
                <Brain className="h-4 w-4 text-primary" />
                MARL Cumulative Reward
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={marlRewardHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="episode" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="reward" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400" />
                Forecast Accuracy Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastAccuracyHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="time" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '10px' }} />
                    <Line type="monotone" dataKey="accuracy" stroke="#34d399" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Analytics Summary */}
        <Card className="bg-card border-border border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              AI Analytics Summary
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshAI} disabled={aiLoading} suppressHydrationWarning>
              <RefreshCw className={`h-3.5 w-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
              {aiLoading ? 'Generating comprehensive analytics report...' : aiInsight || 'Connect to backend for AI-powered analytics insights.'}
            </p>
          </CardContent>
        </Card>

        {/* Defense Metrics Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Defense Metrics Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-2">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Avg Attack Detection Time</div>
                <div className="text-2xl font-headline font-black">{avgDetectionTime.toFixed(1)}s</div>
                <Progress value={Math.min(100, (1 / avgDetectionTime) * 100)} className="h-1 bg-emerald-500/10" />
              </div>
              <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-2">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">False Positive Rate</div>
                <div className="text-2xl font-headline font-black text-emerald-400">{(falsePositiveRate * 100).toFixed(2)}%</div>
                <Progress value={falsePositiveRate * 500} className="h-1 bg-emerald-500/10" />
              </div>
              <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-2">
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Recovery Efficiency</div>
                <div className="text-2xl font-headline font-black">{recoveryEfficiency.toFixed(1)}%</div>
                <Progress value={recoveryEfficiency} className="h-1 bg-emerald-500/10" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}