"use client"

import { useEffect, useState } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { PlayCircle, RefreshCcw, Save, Trash2, Sliders, Activity, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

export default function SimulationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const { updateFrequency, simulationHistory, initializeSystemData } = useGridStore()

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  const runSimulation = () => {
    setIsRunning(true)
    toast({ title: "Simulation Started", description: "Injecting mass EV charging scenario..." })
    
    // Simulate a dip
    setTimeout(() => updateFrequency(49.82), 1000)
    
    setTimeout(() => {
      setIsRunning(false)
      updateFrequency(50.00)
      toast({ title: "Simulation Complete", description: "Grid stabilized in 4.2 seconds." })
    }, 5000)
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Simulation & Stress Testing</h2>
            <p className="text-muted-foreground text-sm">Validate MARL coordination and defense mechanisms against simulated grid events.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" suppressHydrationWarning>
              <Save className="h-4 w-4" />
              Save Config
            </Button>
            <Button 
              size="sm" 
              className={`gap-2 font-bold uppercase tracking-widest text-[10px] ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
              onClick={runSimulation}
              disabled={isRunning}
              suppressHydrationWarning
            >
              {isRunning ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
              {isRunning ? "Running..." : "Run Simulation"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                Scenario parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Scenario Type</Label>
                <Select defaultValue="ev-mass">
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
                  <span className="text-xs font-mono font-bold text-primary">450</span>
                </div>
                <Slider defaultValue={[45]} max={100} step={1} />
                
                <div className="flex justify-between items-center pt-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Affected Nodes</Label>
                  <span className="text-xs font-mono font-bold text-primary">1,200</span>
                </div>
                <Slider defaultValue={[60]} max={100} step={1} />

                <div className="flex justify-between items-center pt-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Duration (Sec)</Label>
                  <span className="text-xs font-mono font-bold text-primary">30</span>
                </div>
                <Slider defaultValue={[30]} max={120} step={5} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">Real-time Response output</CardTitle>
              <CardDescription>Live telemetry from simulation engine</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full bg-muted/10 rounded-xl border border-border flex items-center justify-center relative overflow-hidden">
                {!isRunning ? (
                  <div className="text-center space-y-2 z-10">
                    <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground">Engine Standby. Click "Run Simulation" to begin.</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    <div className="flex flex-col items-center gap-4 z-10">
                      <div className="text-4xl font-headline font-black text-primary animate-bounce">49.825 Hz</div>
                      <div className="flex gap-2">
                        <Badge className="bg-red-500/20 text-red-400">DIP DETECTED</Badge>
                        <Badge className="bg-accent/20 text-accent">VPP DISPATCHING</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                  <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Max Deviation</div>
                  <div className="text-lg font-headline font-black">175mHz</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                  <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Recovery Time</div>
                  <div className="text-lg font-headline font-black">4.2s</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                  <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">Energy Curtailed</div>
                  <div className="text-lg font-headline font-black">124kWh</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Simulation History</CardTitle>
          </CardHeader>
          <CardContent>
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