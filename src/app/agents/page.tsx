"use client"

import { useEffect, useState } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { Activity, Zap, Search, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function AgentsPage() {
  const { activeAgents, agentClusters, avgAgentResponse, virtualInertia, rewardWeightStatus, systemCapacity, initializeSystemData } = useGridStore()
  const [dots, setDots] = useState<{ top: number; left: number; opacity: number; isRed: boolean }[]>([])

  useEffect(() => {
    initializeSystemData()
    const newDots = Array.from({ length: 40 }).map(() => ({
      top: Math.random() * 80 + 10,
      left: Math.random() * 80 + 10,
      opacity: Math.random() * 0.7 + 0.3,
      isRed: Math.random() > 0.8
    }))
    setDots(newDots)
  }, [initializeSystemData])

  const prevResponse = avgAgentResponse > 0 ? ((avgAgentResponse - 2) / avgAgentResponse * 100 - 100).toFixed(0) : '0';

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">MARL Agent Control</h2>
            <p className="text-muted-foreground text-sm">Monitoring {activeAgents.toLocaleString()} Multi-Agent Reinforcement Learning (MARL) edge agents.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search agents..." className="pl-8 h-9 text-xs" suppressHydrationWarning />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Active Agents</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-primary">{activeAgents.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={systemCapacity} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-2">{systemCapacity.toFixed(0)}% System Capacity Engaged</p>
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
                <span>{prevResponse}% from last hour</span>
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Transformer Clusters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {agentClusters.map((cluster, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{cluster.name}</div>
                      <div className="text-[10px] text-muted-foreground">{cluster.count} Edge Nodes</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">{cluster.response}% Response</div>
                    <Badge variant={cluster.status === 'active' ? 'default' : 'secondary'} className="text-[8px] h-4">
                      {cluster.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Global Agent Map</CardTitle>
              <CardDescription>Real-time topological asset distribution</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="relative h-64 w-full bg-muted/10 rounded-xl border border-border overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
                    {Array.from({ length: 100 }).map((_, i) => (
                      <div key={i} className="border-[0.5px] border-border/20" />
                    ))}
                  </div>
                </div>
                {dots.map((dot, i) => (
                  <div 
                    key={i} 
                    className={`absolute h-1.5 w-1.5 rounded-full ${dot.isRed ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}
                    style={{ 
                      top: `${dot.top}%`, 
                      left: `${dot.left}%`,
                      opacity: dot.opacity
                    }}
                  />
                ))}
                <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg border border-border z-10 text-center">
                  <Activity className="h-8 w-8 text-accent mx-auto mb-2 animate-pulse" />
                  <div className="text-xs font-bold">{activeAgents.toLocaleString()} Agents Synced</div>
                  <div className="text-[10px] text-muted-foreground">Across Distributed Transformers</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  )
}