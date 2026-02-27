"use client"

import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { Settings2, Save, RotateCcw, Shield, Zap, CloudSun, Database, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

export default function ConfigPage() {
  const { 
    responseThreshold, 
    capacityReserved, 
    criticalWarningLevel,
    detectionSensitivity,
    deceptiveSignalInjection,
    autonomousEscalation,
    forecastHorizon,
    skyCamEnabled,
    primaryGridFeed,
    marlLearningRate,
    marlDiscountFactor,
    dataSources,
    setVPPConfig 
  } = useGridStore()

  const handleSave = () => {
    toast({ title: "Configuration Saved", description: "System parameters updated successfully." })
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">System Configuration</h2>
            <p className="text-muted-foreground text-sm">Fine-tune MARL hyperparameters, alert thresholds, and data source integrations.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset Defaults
            </Button>
            <Button size="sm" className="gap-2 bg-primary text-white font-bold h-8 text-[10px] uppercase" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Apply Changes
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Stability Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold uppercase">Frequency Response Threshold (Hz)</Label>
                  <span className="text-xs font-mono font-bold text-primary">{responseThreshold.toFixed(2)}</span>
                </div>
                <Slider 
                  value={[responseThreshold]} 
                  min={0.01} 
                  max={0.20} 
                  step={0.01} 
                  onValueChange={([v]) => setVPPConfig({ responseThreshold: v })}
                />
                <p className="text-[10px] text-muted-foreground italic">Minimum Hz deviation to trigger automated MARL intervention.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold uppercase">Critical Warning Level (Hz)</Label>
                  <span className="text-xs font-mono font-bold text-red-400">{criticalWarningLevel.toFixed(2)}</span>
                </div>
                <Slider value={[criticalWarningLevel * 100]} max={50} step={1} onValueChange={([v]) => setVPPConfig({ criticalWarningLevel: v / 100 })} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold uppercase">VPP Capacity Reserve (%)</Label>
                  <span className="text-xs font-mono font-bold text-primary">{capacityReserved}%</span>
                </div>
                <Slider 
                  value={[capacityReserved]} 
                  min={5} 
                  max={40} 
                  step={1} 
                  onValueChange={([v]) => setVPPConfig({ capacityReserved: v })}
                />
                <p className="text-[10px] text-muted-foreground italic">Percentage of storage buffer reserved exclusively for frequency support.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                Security & Defense Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold uppercase">Attack Detection Sensitivity</Label>
                  <p className="text-[10px] text-muted-foreground italic">Lower value increases sensitivity but may cause false positives.</p>
                </div>
                <Select value={detectionSensitivity} onValueChange={(v) => setVPPConfig({ detectionSensitivity: v as 'low' | 'medium' | 'high' })}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold uppercase">Deceptive Signal Injection</Label>
                  <p className="text-[10px] text-muted-foreground italic">Inject randomized noise to disrupt phase-fingerprinting.</p>
                </div>
                <Switch checked={deceptiveSignalInjection} onCheckedChange={(v) => setVPPConfig({ deceptiveSignalInjection: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold uppercase">Autonomous escalation</Label>
                  <p className="text-[10px] text-muted-foreground italic">Allow system to trigger high-defense mode without operator approval.</p>
                </div>
                <Switch checked={autonomousEscalation} onCheckedChange={(v) => setVPPConfig({ autonomousEscalation: v })} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-emerald-400" />
                Forecast Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase">Forecast Horizon</Label>
                <Select value={forecastHorizon} onValueChange={(v) => setVPPConfig({ forecastHorizon: v as '10s' | '30s' | '60s' })}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10s">10 Seconds (Ultra-Low Latency)</SelectItem>
                    <SelectItem value="30s">30 Seconds (Standard)</SelectItem>
                    <SelectItem value="60s">60 Seconds (Extended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold uppercase">Sky-Cam Integration</Label>
                  <p className="text-[10px] text-muted-foreground">Utilize local irradiance sensors.</p>
                </div>
                <Switch checked={skyCamEnabled} onCheckedChange={(v) => setVPPConfig({ skyCamEnabled: v })} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Data Source Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase">Primary Grid Feed</Label>
                <Input placeholder="https://api.ukgrid.data/live" className="h-9 text-xs bg-muted/20 border-border" value={primaryGridFeed} onChange={(e) => setVPPConfig({ primaryGridFeed: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {dataSources.map((src, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border bg-muted/10">
                    <div className="text-[8px] font-bold uppercase text-muted-foreground mb-1">{src.name}</div>
                    <Badge variant="outline" className={`text-[8px] h-4 ${src.status === 'connected' ? 'border-emerald-500/30 text-emerald-400' : src.status === 'error' ? 'border-red-500/30 text-red-400' : 'border-amber-500/30 text-amber-400'}`}>
                      {src.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-4 items-center">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <Info className="h-5 w-5 text-accent" />
          </div>
          <div className="text-xs leading-relaxed text-muted-foreground italic">
            MARL hyperparameters (Learning Rate: {marlLearningRate}, Discount Factor: {marlDiscountFactor}) are currently set by the Global Optimization Engine. Manual override requires Administrator access in the CLI.
          </div>
        </div>
      </div>
    </Shell>
  )
}
