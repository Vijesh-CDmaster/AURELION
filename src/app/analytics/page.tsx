"use client"

import { useEffect } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { BarChart3, TrendingUp, Download, Calendar, Zap, ShieldCheck, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  Line,
  LineChart
} from "recharts"

export default function AnalyticsPage() {
  const { energySaved, performanceData, latency, avgDetectionTime, falsePositiveRate, recoveryEfficiency, attacksMitigated, initializeSystemData } = useGridStore()

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  // Compute avg stability from performance data
  const avgStability = performanceData.length > 0
    ? (performanceData.reduce((s, d) => s + d.stability, 0) / performanceData.length)
    : 0;
  const totalSavings = performanceData.reduce((s, d) => s + d.savings, 0);
  const estimatedValue = `+$${Math.round(totalSavings * 0.12).toLocaleString()}`;

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Analytics & Performance</h2>
            <p className="text-muted-foreground text-sm">Aggregated KPI monitoring and long-term stability trends.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" suppressHydrationWarning>
              <Calendar className="h-4 w-4" />
              Last 7 Days
            </Button>
            <Button size="sm" className="gap-2 bg-primary text-white font-bold h-8 text-[10px] uppercase" suppressHydrationWarning>
              <Download className="h-4 w-4" />
              Export PDF Report
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Avg stability</CardDescription>
              <CardTitle className="text-3xl font-headline font-black text-emerald-400">{avgStability.toFixed(1)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">Normal operation hours</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Energy Saved</CardDescription>
              <CardTitle className="text-3xl font-headline font-black text-primary">{Math.round(energySaved).toLocaleString()} <span className="text-sm">kWh</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-emerald-400 font-bold">{estimatedValue} estimated value</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Attacks Mitigated</CardDescription>
              <CardTitle className="text-3xl font-headline font-black text-accent">{attacksMitigated}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">Last 30 days</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Response Latency</CardDescription>
              <CardTitle className="text-3xl font-headline font-black text-blue-400">{latency.toFixed(1)}ms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">System-wide average</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Energy Curtailment Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
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
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[90, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="stability" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ fill: 'hsl(var(--accent))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Defense Metrics summary
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
                <div className="text-[10px] font-bold uppercase text-muted-foreground">Recovery efficiency</div>
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