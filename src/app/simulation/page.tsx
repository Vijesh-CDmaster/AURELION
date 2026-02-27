"use client"

import { useEffect, useState, useCallback } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { PlayCircle, RefreshCcw, Save, Trash2, Sliders, Activity, Zap, Download, BarChart3, Bot, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAI } from "@/hooks/useAI"
import { fastapi } from "@/lib/fastapi"

export default function SimulationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const {
    simulationParams,
    simulationResults,
    simulationHistory,
    frequency,
    setSimulationParams,
    runSimulation: storeRunSimulation,
    completeSimulation,
    updateFrequency,
    initializeSystemData,
  } = useGridStore()

  const { connected } = useWebSocket({ channel: 'simulation', onMessage: (data) => {
    if (data.frequency) updateFrequency(data.frequency)
  }})
  const { insight: aiInsight, loading: aiLoading, refresh: refreshAI } = useAI({
    fetcher: fastapi.ai.simulationDebrief, refreshInterval: 60000,
  })

  useEffect(() => { initializeSystemData() }, [initializeSystemData])

  const handleRunSimulation = () => {
    setIsRunning(true)
    storeRunSimulation()
    toast({ title: "Simulation Started", description: `Injecting ${simulationParams.scenario.replace(/-/g, ' ')} scenario...` })

    const dipAmount = (simulationParams.intensity / 100) * 0.5
    setTimeout(() => updateFrequency(50 - dipAmount), 1000)

    setTimeout(() => {
      setIsRunning(false)
      updateFrequency(50.00)
      completeSimulation()
      toast({ title: "Simulation Complete", description: "Grid stabilized. Results recorded." })
    }, simulationParams.duration * 150)
  }

  // Baseline comparison scores
  const baselineScore = simulationResults ? Math.max(30, 100 - simulationResults.maxDeviation * 0.8 - simulationResults.recoveryTime * 3) : 0
  const sentinelScore = simulationResults ? Math.max(50, 100 - simulationResults.maxDeviation * 0.3 - simulationResults.recoveryTime * 1) : 0

  const handleExportCSV = useCallback(() => {
    if (simulationHistory.length === 0) { toast({ title: "No data", description: "Run a simulation first." }); return }
    const header = "ID,Scenario,Date,Stability,Outcome\n"
    const rows = simulationHistory.map(s => `${s.id},${s.scenario},${s.date},${s.stability},${s.outcome}`).join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "simulation-history.csv"; a.click()
    URL.revokeObjectURL(url)
    toast({ title: "CSV Exported", description: `${simulationHistory.length} records exported.` })
  }, [simulationHistory])

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Simulation & Stress Testing</h2>
            <p className="text-muted-foreground text-sm">Validate MARL coordination and defense mechanisms against simulated grid events.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-[10px]" onClick={handleExportCSV} suppressHydrationWarning>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button
              size="sm"
              className={`gap-2 font-bold uppercase tracking-widest text-[10px] ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
              onClick={handleRunSimulation}
              disabled={isRunning}
              suppressHydrationWarning
            >
              {isRunning ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
              {isRunning ? "Running..." : "Run Simulation"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Scenario Parameters */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                Scenario Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Scenario Type</Label>
                <Select value={simulationParams.scenario} onValueChange={(v) => setSimulationParams({ scenario: v })}>
                  <SelectTrigger className="bg-muted/20 border-border" suppressHydrationWarning>
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ev-mass">Mass EV Charging Event</SelectItem>
                    <SelectItem value="cloud-shading">Sudden Cloud Shading</SelectItem>
                    <SelectItem value="adversarial">Adversarial Demand Attack</SelectItem>
                    <SelectItem value="freq-dip">Step Frequency Dip</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Intensity (MW)</Label>
                  <span className="text-xs font-mono font-bold text-primary">{Math.round(simulationParams.intensity * 10)}</span>
                </div>
                <Slider value={[simulationParams.intensity]} max={100} step={1} onValueChange={([v]) => setSimulationParams({ intensity: v })} />

                <div className="flex justify-between items-center pt-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Affected Nodes</Label>
                  <span className="text-xs font-mono font-bold text-primary">{Math.round(simulationParams.affectedNodes * 20).toLocaleString()}</span>
                </div>
                <Slider value={[simulationParams.affectedNodes]} max={100} step={1} onValueChange={([v]) => setSimulationParams({ affectedNodes: v })} />

                <div className="flex justify-between items-center pt-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Duration (Sec)</Label>
                  <span className="text-xs font-mono font-bold text-primary">{simulationParams.duration}</span>
                </div>
                <Slider value={[simulationParams.duration]} max={120} step={5} onValueChange={([v]) => setSimulationParams({ duration: v })} />
              </div>
            </CardContent>
          </Card>

          {/* Real-time Response */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Real-time Response Output</CardTitle>
              <CardDescription>Live telemetry from simulation engine</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full bg-muted/10 rounded-xl border border-border flex items-center justify-center relative overflow-hidden">
                {!isRunning ? (
                  <div className="text-center space-y-2 z-10">
                    <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground">Engine Standby. Click &quot;Run Simulation&quot; to begin.</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    <div className="flex flex-col items-center gap-4 z-10">
                      <div className="text-4xl font-headline font-black text-primary animate-bounce">
                        {simulationResults ? simulationResults.currentFrequency.toFixed(3) : frequency.toFixed(3)} Hz
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-red-500/20 text-red-400">DIP DETECTED</Badge>
                        <Badge className="bg-accent/20 text-accent">VPP DISPATCHING</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                  <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Max Deviation</div>
                  <div className="text-lg font-headline font-black">{simulationResults ? `${Math.round(simulationResults.maxDeviation)}mHz` : '—'}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                  <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Recovery Time</div>
                  <div className="text-lg font-headline font-black">{simulationResults ? `${simulationResults.recoveryTime.toFixed(1)}s` : '—'}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                  <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Energy Curtailed</div>
                  <div className="text-lg font-headline font-black">{simulationResults ? `${Math.round(simulationResults.energyCurtailed)}kWh` : '—'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Panel: Baseline vs Sentinel */}
        {simulationResults && (
          <Card className="bg-card border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Comparison — Baseline vs Sentinel
              </CardTitle>
              <CardDescription>Side-by-side performance comparison for the last simulation run</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-red-400">Baseline (No MARL)</span>
                    <Badge className="bg-red-500/20 text-red-400 text-[8px]">{baselineScore.toFixed(0)}%</Badge>
                  </div>
                  <Progress value={baselineScore} className="h-2 bg-red-500/10" />
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <div className="text-muted-foreground">Max Dev.</div>
                      <div className="font-mono font-bold">{Math.round(simulationResults.maxDeviation * 2.5)}mHz</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Recovery</div>
                      <div className="font-mono font-bold">{(simulationResults.recoveryTime * 3).toFixed(1)}s</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Curtailed</div>
                      <div className="font-mono font-bold">{Math.round(simulationResults.energyCurtailed * 2.2)}kWh</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-emerald-400">Sentinel (MARL + VPP)</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[8px]">{sentinelScore.toFixed(0)}%</Badge>
                  </div>
                  <Progress value={sentinelScore} className="h-2 bg-emerald-500/10" />
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <div className="text-muted-foreground">Max Dev.</div>
                      <div className="font-mono font-bold">{Math.round(simulationResults.maxDeviation)}mHz</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Recovery</div>
                      <div className="font-mono font-bold">{simulationResults.recoveryTime.toFixed(1)}s</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Curtailed</div>
                      <div className="font-mono font-bold">{Math.round(simulationResults.energyCurtailed)}kWh</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Simulation Debrief */}
        {simulationResults && (
          <Card className="bg-card border-border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                AI Simulation Debrief
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshAI} disabled={aiLoading} suppressHydrationWarning>
                <RefreshCw className={`h-3.5 w-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                {aiLoading ? 'Analyzing simulation results and comparing with baseline...' : aiInsight || 'Run a simulation to receive AI-powered debrief analysis.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Simulation History */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Simulation History</CardTitle>
            <Badge variant="outline" className="text-[8px]">{simulationHistory.length} runs</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {simulationHistory.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">No simulations run yet. Configure parameters and click &quot;Run Simulation&quot;.</div>
              ) : simulationHistory.map((sim) => (
                <div key={sim.id} className="p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between group hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-mono font-bold text-muted-foreground">{sim.id}</div>
                    <div>
                      <div className="text-xs font-bold">{sim.scenario}</div>
                      <div className="text-[10px] text-muted-foreground">{sim.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground">Stability</div>
                      <div className="text-xs font-bold">{sim.stability}</div>
                    </div>
                    <Badge variant={sim.outcome === 'SUCCESS' ? 'default' : 'secondary'} className={`text-[8px] ${sim.outcome === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {sim.outcome}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-primary" suppressHydrationWarning>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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