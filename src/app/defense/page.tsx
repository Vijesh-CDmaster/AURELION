"use client"

import { useEffect } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { Shield, AlertTriangle, Lock, Unlock, Fingerprint, History } from "lucide-react"
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
  const { attackStatus, triggerAttack, phaseCoherence, attackIntensity, coherenceData, defenseLog, deceptiveSignalInjection, initializeSystemData } = useGridStore()

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

        {attackStatus !== 'none' && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                  <Shield className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">Active Demand-Side Attack</h3>
                  <p className="text-xs text-red-300/80">Coordinated device surge detected in Central Sector. Deploying desynchronization signals.</p>
                </div>
              </div>
              <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white font-bold h-8 text-[10px] uppercase" suppressHydrationWarning>
                Escalate Defense
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Phase Coherence</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-primary">{(phaseCoherence * 100).toFixed(1)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={phaseCoherence * 100} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-2">
                Threshold: 45.0% for attack identification
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Defense Status</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold uppercase flex items-center gap-2">
                {attackStatus === 'none' ? <Unlock className="h-6 w-6 text-muted-foreground" /> : <Lock className="h-6 w-6 text-accent" />}
                {attackStatus === 'none' ? 'Passive' : 'ACTIVE'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className={`text-[8px] ${attackStatus !== 'none' ? 'border-accent text-accent' : 'text-muted-foreground'}`}>
                DECEPTIVE SIGNAL INJECTION {deceptiveSignalInjection && attackStatus !== 'none' ? 'ON' : 'OFF'}
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
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-primary" />
                Load Synchronization Fingerprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={coherenceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[0, 1]} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.1} 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="attack" 
                      stroke="hsl(var(--destructive))" 
                      fill="hsl(var(--destructive))" 
                      fillOpacity={0.2} 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
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
                  <div className={`h-2 w-2 rounded-full mt-1 shrink-0 ${log.severity === 'warning' ? 'bg-amber-500' : 'bg-primary'}`} />
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