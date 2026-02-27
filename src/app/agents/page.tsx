"use client"

import { useEffect, useState } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAI } from "@/hooks/useAI"
import { fastapi } from "@/lib/fastapi"
import { Activity, Zap, Search, TrendingUp, Award, ToggleLeft, ToggleRight, Users, Bot, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(45 100% 50%)', '#ef4444']

export default function AgentsPage() {
  const {
    activeAgents, agentClusters, avgAgentResponse, virtualInertia,
    rewardWeightStatus, systemCapacity, agentResponseTimeline,
    agentSyncRate, initializeSystemData, updateFromServer, tick
  } = useGridStore()
  const [dots, setDots] = useState<{ top: number; left: number; opacity: number; isRed: boolean }[]>([])
  const [manualOverride, setManualOverride] = useState(false)

  const { connected } = useWebSocket({ channel: 'grid', onMessage: (data) => updateFromServer(data) })
  const { insight: aiInsight, loading: aiLoading, refresh: refreshAI } = useAI({
    fetcher: fastapi.ai.agentRecommendation, refreshInterval: 30000,
  })

  useEffect(() => {
    initializeSystemData()
    setDots(Array.from({ length: 60 }).map(() => ({
      top: Math.random() * 80 + 10, left: Math.random() * 80 + 10,
      opacity: Math.random() * 0.7 + 0.3, isRed: Math.random() > 0.85
    })))
  }, [initializeSystemData])
  useEffect(() => { if (!connected) { const i = setInterval(() => tick(), 2000); return () => clearInterval(i) } }, [tick, connected])

  // Status breakdown for pie chart
  const activeClusters = agentClusters.filter(c => c.status === 'active')
  const idleClusters = agentClusters.filter(c => c.status === 'idle')
  const activeCount = activeClusters.reduce((s, c) => s + c.count, 0)
  const idleCount = idleClusters.reduce((s, c) => s + c.count, 0)
  const pieData = [
    { name: 'Active', value: activeCount },
    { name: 'Idle', value: idleCount },
    { name: 'Syncing', value: Math.round(activeAgents * 0.02) },
  ].filter(d => d.value > 0)

  // Cluster leaderboard sorted by response
  const leaderboard = [...agentClusters].sort((a, b) => b.response - a.response)

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">MARL Agent Control</h2>
            <p className="text-muted-foreground text-sm">Monitoring {activeAgents.toLocaleString()} Multi-Agent Reinforcement Learning (MARL) edge agents.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={manualOverride ? "destructive" : "outline"}
              size="sm"
              className="gap-2 text-[10px] uppercase font-bold"
              onClick={() => setManualOverride(!manualOverride)}
              suppressHydrationWarning
            >
              {manualOverride ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              Manual Override {manualOverride ? 'ON' : 'OFF'}
            </Button>
            <div className="relative w-full md:w-48">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search agents..." className="pl-8 h-9 text-xs" suppressHydrationWarning />
            </div>
          </div>
        </div>

        {manualOverride && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-bold uppercase">Manual Override Active — Autonomous MARL decisions are paused. Operator control required.</span>
          </div>
        )}

        {/* AI Coordinator Panel */}
        <Card className="bg-card border-border bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Bot className="h-4 w-4 text-accent" />
              AI Coordinator
              <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={refreshAI} disabled={aiLoading}>
                <RefreshCw className={`h-3 w-3 ${aiLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground italic leading-relaxed">{aiLoading ? 'Analysing cluster states…' : aiInsight || 'Waiting for AI recommendation…'}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Active Agents</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-primary">{activeAgents.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={systemCapacity} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-2">{systemCapacity.toFixed(0)}% System Capacity</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Avg Response</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold">{avgAgentResponse.toFixed(0)}ms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>Sync Rate: {agentSyncRate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Virtual Inertia</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-accent">{virtualInertia.toFixed(2)} MW·s</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">Synthetic stabilizing mass</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Reward Weights</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold">{rewardWeightStatus}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-[8px] border-accent/30 text-accent">
                {rewardWeightStatus === 'MUTATED' ? 'ADAPTIVE MODE' : 'BASELINE MODE'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown + Response Timeline */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Agent Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                    <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}: {d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                Agent Response Timeline
              </CardTitle>
              <CardDescription>Average response latency (ms) over recent ticks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={agentResponseTimeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="responseMs" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clusters + Leaderboard */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Transformer Clusters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentClusters.map((cluster, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{cluster.name}</div>
                      <div className="text-[10px] text-muted-foreground">{cluster.count.toLocaleString()} Edge Nodes</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">{cluster.response.toFixed(0)}% Response</div>
                    <Badge variant={cluster.status === 'active' ? 'default' : 'secondary'} className="text-[8px] h-4">
                      {cluster.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" />
                Performance Leaderboard
              </CardTitle>
              <CardDescription>Clusters ranked by response rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.map((cluster, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-muted/30 text-muted-foreground'}`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{cluster.name}</div>
                    <div className="text-[10px] text-muted-foreground">{cluster.count.toLocaleString()} nodes</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-primary">{cluster.response.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Global Agent Map */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Global Agent Topology Map</CardTitle>
            <CardDescription>Real-time distributed asset visualization across {agentClusters.length} transformer clusters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 w-full bg-muted/10 rounded-xl border border-border overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="grid grid-cols-12 grid-rows-8 h-full w-full">
                  {Array.from({ length: 96 }).map((_, i) => (
                    <div key={i} className="border-[0.5px] border-border/20" />
                  ))}
                </div>
              </div>
              {dots.map((dot, i) => (
                <div
                  key={i}
                  className={`absolute h-1.5 w-1.5 rounded-full transition-colors ${dot.isRed ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}
                  style={{ top: `${dot.top}%`, left: `${dot.left}%`, opacity: dot.opacity }}
                />
              ))}
              <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg border border-border z-10 text-center">
                <Activity className="h-8 w-8 text-accent mx-auto mb-2 animate-pulse" />
                <div className="text-xs font-bold">{activeAgents.toLocaleString()} Agents Synced</div>
                <div className="text-[10px] text-muted-foreground">Across {agentClusters.length} Distributed Transformers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}