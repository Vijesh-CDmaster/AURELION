"use client"

import { useEffect } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import {
  PlayCircle, PauseCircle, StopCircle, RefreshCcw, Save, Trash2,
  Sliders, Activity, Zap, AlertTriangle, Shield, TrendingDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts"

export default function SimulationPage() {
  const {
    simulationParams, simulationResults, simulationHistory, frequency,
    setSimulationParams, runSimulation: storeRunSimulation, completeSimulation,
    startLiveSimulation, pauseLiveSimulation, resumeLiveSimulation, stopLiveSimulation,
    liveSimStatus, liveSimFrames, liveSimTick, liveSimTotalTicks,
    initializeSystemData,
  } = useGridStore()

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveSimStatus === 'running') pauseLiveSimulation()
    }
  }, [liveSimStatus, pauseLiveSimulation])

  const handleStartLive = () => {
    startLiveSimulation()
    toast({
      title: "Live Simulation Started",
      description: `Running ${simulationParams.scenario.replace(/-/g, ' ')} — ${liveSimTotalTicks || Math.round(simulationParams.duration / 2)} ticks at 500ms intervals.`,
    })
  }

  const handleRunInstant = () => {
    storeRunSimulation()
    toast({ title: "Instant Stress Test", description: "Completed. Results below." })
  }

  const handleStop = () => {
    stopLiveSimulation()
    toast({ title: "Simulation Stopped" })
  }

  const handleComplete = () => {
    completeSimulation()
    toast({ title: "Results Saved", description: "Added to simulation history." })
  }

  const progressPct = liveSimTotalTicks > 0 ? (liveSimTick / liveSimTotalTicks) * 100 : 0
  const isLive = liveSimStatus === 'running' || liveSimStatus === 'paused'
  const currentFrame = liveSimFrames[liveSimFrames.length - 1]
  const liveFreq = currentFrame?.frequency ?? frequency
  const liveDev = Math.abs(liveFreq - 50) * 1000

  // Chart data from live frames
  const freqChartData = liveSimFrames.map(f => ({
    tick: f.tick,
    frequency: f.frequency,
    nominal: 50,
  }))

  const vppChartData = liveSimFrames.map(f => ({
    tick: f.tick,
    vpp: Math.abs(f.vppMW),
    load: f.loadMW / 100,
  }))

  return (
    <Shell>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Simulation & Stress Testing</h2>
            <p className="text-muted-foreground text-sm">
              Live engine-driven simulation — every tick runs the full Forecast → Defense → MARL → Physics pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {liveSimStatus === 'idle' || liveSimStatus === 'complete' ? (
              <>
                <Button
                  size="sm" className="gap-2 font-bold uppercase tracking-widest text-[10px] bg-primary"
                  onClick={handleStartLive} suppressHydrationWarning
                >
                  <PlayCircle className="h-3.5 w-3.5" /> Live Simulation
                </Button>
                <Button
                  size="sm" variant="outline" className="gap-2 font-bold uppercase tracking-widest text-[10px]"
                  onClick={handleRunInstant} suppressHydrationWarning
                >
                  <Zap className="h-3.5 w-3.5" /> Instant Test
                </Button>
              </>
            ) : liveSimStatus === 'running' ? (
              <>
                <Button
                  size="sm" variant="outline" className="gap-2 font-bold uppercase tracking-widest text-[10px] border-amber-500/40 text-amber-400"
                  onClick={() => pauseLiveSimulation()} suppressHydrationWarning
                >
                  <PauseCircle className="h-3.5 w-3.5" /> Pause
                </Button>
                <Button
                  size="sm" variant="destructive" className="gap-2 font-bold uppercase tracking-widest text-[10px]"
                  onClick={handleStop} suppressHydrationWarning
                >
                  <StopCircle className="h-3.5 w-3.5" /> Stop
                </Button>
              </>
            ) : liveSimStatus === 'paused' ? (
              <>
                <Button
                  size="sm" className="gap-2 font-bold uppercase tracking-widest text-[10px] bg-emerald-600"
                  onClick={() => resumeLiveSimulation()} suppressHydrationWarning
                >
                  <PlayCircle className="h-3.5 w-3.5" /> Resume
                </Button>
                <Button
                  size="sm" variant="destructive" className="gap-2 font-bold uppercase tracking-widest text-[10px]"
                  onClick={handleStop} suppressHydrationWarning
                >
                  <StopCircle className="h-3.5 w-3.5" /> Stop
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {/* ── Live progress bar ── */}
        {isLive && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase">
              <span>Tick {liveSimTick} / {liveSimTotalTicks}</span>
              <span>{progressPct.toFixed(0)}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Parameters panel ── */}
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
                <Select
                  value={simulationParams.scenario}
                  onValueChange={(v) => setSimulationParams({ scenario: v })}
                  disabled={isLive}
                >
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
                <Slider value={[simulationParams.intensity]} max={100} step={1} disabled={isLive} onValueChange={([v]) => setSimulationParams({ intensity: v })} />

                <div className="flex justify-between items-center pt-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Affected Nodes</Label>
                  <span className="text-xs font-mono font-bold text-primary">{Math.round(simulationParams.affectedNodes * 20).toLocaleString()}</span>
                </div>
                <Slider value={[simulationParams.affectedNodes]} max={100} step={1} disabled={isLive} onValueChange={([v]) => setSimulationParams({ affectedNodes: v })} />

                <div className="flex justify-between items-center pt-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Duration (Sec)</Label>
                  <span className="text-xs font-mono font-bold text-primary">{simulationParams.duration}</span>
                </div>
                <Slider value={[simulationParams.duration]} max={120} step={5} disabled={isLive} onValueChange={([v]) => setSimulationParams({ duration: v })} />
              </div>

              {/* Scenario description */}
              <div className="p-3 rounded-lg bg-muted/10 border border-border text-[10px] text-muted-foreground leading-relaxed">
                {simulationParams.scenario === 'ev-mass' && 'Simulates a sudden surge of EV charging demand across multiple clusters. Tests MARL VPP load-shedding coordination.'}
                {simulationParams.scenario === 'cloud-shading' && 'A cloud bank sweeps across solar arrays, cutting renewable generation. Forecast engine should predict impact 30s ahead.'}
                {simulationParams.scenario === 'adversarial' && 'MadIoT-style attack synchronises appliance cycles. Defense engine (FFT+CUSUM) detects the spectral signature.'}
                {simulationParams.scenario === 'freq-dip' && 'Instantaneous frequency dip from generator trip. MARL agents must coordinate battery discharge within 50ms.'}
              </div>
            </CardContent>
          </Card>

          {/* ── Realtime output panel ── */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Live Engine Output</CardTitle>
              <CardDescription>
                {isLive ? 'Streaming tick-by-tick from Forecast → Defense → MARL → Physics pipeline' : 'Configure scenario and click "Live Simulation" to begin'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Live frequency trace */}
              <div className="h-52 w-full bg-muted/5 rounded-xl border border-border overflow-hidden relative">
                {freqChartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={freqChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                      <XAxis dataKey="tick" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'Tick', position: 'insideBottomRight', offset: -5, fontSize: 9 }} />
                      <YAxis domain={[49.5, 50.5]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeOpacity={0.5} />
                      <Line type="monotone" dataKey="frequency" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} animationDuration={200} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : !isLive && !simulationResults ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-2">
                      <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                      <p className="text-xs text-muted-foreground">Engine Standby</p>
                    </div>
                  </div>
                ) : isLive ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCcw className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : null}

                {/* Floating live frequency */}
                {isLive && currentFrame && (
                  <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-right">
                    <div className={`text-2xl font-headline font-black ${currentFrame.status === 'critical' ? 'text-red-400' : currentFrame.status === 'warning' ? 'text-amber-400' : 'text-primary'}`}>
                      {currentFrame.frequency.toFixed(3)} Hz
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      df/dt = {currentFrame.dfdt.toFixed(4)} Hz/s
                    </div>
                  </div>
                )}
              </div>

              {/* Live status badges */}
              {isLive && currentFrame && (
                <div className="flex flex-wrap gap-2">
                  <Badge className={currentFrame.status === 'critical' ? 'bg-red-500/20 text-red-400' : currentFrame.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}>
                    {currentFrame.status.toUpperCase()}
                  </Badge>
                  {Math.abs(currentFrame.vppMW) > 0.1 && (
                    <Badge className="bg-accent/20 text-accent">
                      <Zap className="h-3 w-3 mr-1" /> VPP {currentFrame.vppMW.toFixed(1)} MW
                    </Badge>
                  )}
                  {currentFrame.attackDetected && (
                    <Badge className="bg-red-500/20 text-red-400">
                      <Shield className="h-3 w-3 mr-1" /> ATTACK DETECTED
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[9px]">
                    <TrendingDown className="h-3 w-3 mr-1" /> Dev: {liveDev.toFixed(1)} mHz
                  </Badge>
                </div>
              )}

              {/* VPP response chart */}
              {vppChartData.length > 1 && (
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vppChartData}>
                      <XAxis dataKey="tick" hide />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Bar dataKey="vpp" fill="hsl(var(--primary))" fillOpacity={0.6} radius={[2, 2, 0, 0]} name="VPP Response (MW)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ── Result KPIs ── */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                  <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Max Deviation</div>
                  <div className="text-lg font-headline font-black">
                    {simulationResults ? `${Math.round(simulationResults.maxDeviation)}mHz` : isLive ? `${liveDev.toFixed(0)}mHz` : '—'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                  <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Recovery Time</div>
                  <div className="text-lg font-headline font-black">
                    {simulationResults ? `${simulationResults.recoveryTime.toFixed(1)}s` : '—'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                  <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Energy Curtailed</div>
                  <div className="text-lg font-headline font-black">
                    {simulationResults ? `${Math.round(simulationResults.energyCurtailed)}kWh` : '—'}
                  </div>
                </div>
              </div>

              {simulationResults && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                    <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Avg VPP Response</div>
                    <div className="text-lg font-headline font-black text-primary">{simulationResults.avgVPPResponse?.toFixed(1) ?? '—'} MW</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                    <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Attack Detected</div>
                    <div className={`text-lg font-headline font-black ${simulationResults.attackDetected ? 'text-red-400' : 'text-emerald-400'}`}>
                      {simulationResults.attackDetected ? 'YES' : 'NO'}
                    </div>
                  </div>
                </div>
              )}

              {/* Save results button */}
              {(liveSimStatus === 'complete' || simulationResults) && (
                <Button size="sm" variant="outline" className="w-full gap-2 text-[10px] font-bold uppercase" onClick={handleComplete} suppressHydrationWarning>
                  <Save className="h-3.5 w-3.5" /> Save to History
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── History ── */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Simulation History</CardTitle>
          </CardHeader>
          <CardContent>
            {simulationHistory.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                No simulations recorded yet. Run a scenario to populate this table.
              </div>
            ) : (
              <div className="space-y-3">
                {simulationHistory.map((sim) => (
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}
