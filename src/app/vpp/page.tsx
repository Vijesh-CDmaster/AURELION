"use client"

import { useEffect } from "react"
import { Shell } from "@/components/layout/Shell"
import { VPPConfigPanel } from "@/components/vpp/VPPConfigPanel"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGridStore } from "@/lib/grid-store"
import { Zap, Battery, Network, Activity, Users, Clock } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function VPPPage() {
  const {
    vppEnabled, totalDevices, solarGeneration, loadDemand, agentClusters,
    vppCapacityHistory, vppClusterLog, capacityReserved, responseThreshold,
    initializeSystemData
  } = useGridStore()

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  const totalCapacityMW = agentClusters.reduce((s, c) => s + c.devices * 0.8, 0)
  const activeAssets = agentClusters.filter(c => c.status === 'active').length
  const v2gContribution = solarGeneration * 0.12

  // Per-cluster contribution data for bar chart
  const clusterContrib = agentClusters.map(c => ({
    name: c.name.replace('Cluster-', 'C'),
    contribution: +(c.devices * 0.8 * (c.responseRate / 100)).toFixed(1),
    status: c.status
  }))

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">VPP Control Center</h2>
            <p className="text-muted-foreground text-sm">Manage Virtual Power Plant behavior, V2G charging, and response latency across aggregated edge assets.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[9px] ${vppEnabled ? 'border-emerald-500/30 text-emerald-400' : 'text-muted-foreground'}`}>
              VPP {vppEnabled ? 'ACTIVE' : 'STANDBY'}
            </Badge>
            <Badge variant="outline" className="text-[9px] text-muted-foreground">
              Threshold: {responseThreshold.toFixed(2)} Hz
            </Badge>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Aggregated Capacity</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-primary">{totalCapacityMW.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">MW</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">{totalDevices} assets enrolled</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">V2G Contribution</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-emerald-400">{v2gContribution.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">MW</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">Bidirectional flow active</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Active Clusters</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold">{activeAssets}<span className="text-sm text-muted-foreground ml-1">/ {agentClusters.length}</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">Participating in dispatch</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Reserved Buffer</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-amber-400">{capacityReserved}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">Emergency stabilization reserve</div>
            </CardContent>
          </Card>
        </div>

        {/* Capacity Chart + Config Panel */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Aggregated Capacity Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vppCapacityHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} unit=" MW" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="capacity" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <VPPConfigPanel />
        </div>

        {/* Cluster Contribution + Cluster Log */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Network className="h-4 w-4 text-primary" />
                Per-Cluster Contribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clusterContrib}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} unit=" MW" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '11px' }} />
                    <Bar dataKey="contribution" radius={[4, 4, 0, 0]}>
                      {clusterContrib.map((c, i) => (
                        <Cell key={i} fill={c.status === 'active' ? 'hsl(var(--primary))' : c.status === 'idle' ? 'hsl(var(--muted-foreground))' : 'hsl(45 100% 50%)'} />
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
                <Clock className="h-4 w-4 text-primary" />
                Cluster Formation Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[220px]">
                <div className="space-y-2">
                  {vppClusterLog.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-8">No cluster events recorded yet.</div>
                  ) : vppClusterLog.slice(-15).reverse().map((entry, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/20 border border-border">
                      <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${entry.action === 'joined' ? 'bg-emerald-500' : entry.action === 'left' ? 'bg-red-400' : 'bg-amber-500'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium truncate">{entry.cluster}</span>
                          <Badge variant="outline" className={`text-[7px] shrink-0 ${entry.action === 'joined' ? 'border-emerald-500/30 text-emerald-400' : entry.action === 'left' ? 'border-red-500/30 text-red-400' : 'border-amber-500/30 text-amber-400'}`}>
                            {entry.action.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{entry.time} — {entry.devices} devices</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Transformer Map */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Agent Recruitment — Transformer Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {agentClusters.map((cluster, i) => (
                <div key={i} className={`p-3 rounded-lg border ${cluster.status === 'active' ? 'bg-primary/5 border-primary/30' : cluster.status === 'idle' ? 'bg-muted/20 border-border' : 'bg-amber-500/5 border-amber-500/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">{cluster.name}</span>
                    <Badge variant="outline" className={`text-[7px] ${cluster.status === 'active' ? 'border-emerald-500/30 text-emerald-400' : cluster.status === 'idle' ? 'text-muted-foreground' : 'border-amber-500/30 text-amber-400'}`}>
                      {cluster.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <div className="text-muted-foreground">Devices</div>
                      <div className="font-mono font-bold">{cluster.devices}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Response</div>
                      <div className="font-mono font-bold">{cluster.responseRate.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Capacity</div>
                      <div className="font-mono font-bold">{(cluster.devices * 0.8).toFixed(1)} MW</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Contrib.</div>
                      <div className="font-mono font-bold">{(cluster.devices * 0.8 * cluster.responseRate / 100).toFixed(1)} MW</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}