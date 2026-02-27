"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useGridStore } from "@/lib/grid-store"
import { Badge } from "@/components/ui/badge"

export function VPPConfigPanel() {
  const { 
    vppEnabled, 
    toggleVPP, 
    bidirectionalCharging, 
    responseThreshold, 
    capacityReserved, 
    setVPPConfig 
  } = useGridStore()

  return (
    <Card className="bg-card border-border shadow-md h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-headline">VPP Configuration</CardTitle>
          <CardDescription>Adjust agent autonomy and grid response logic</CardDescription>
        </div>
        <Badge variant={vppEnabled ? "default" : "outline"} className={vppEnabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}>
          {vppEnabled ? "Active" : "Standby"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Virtual Power Plant Enable</Label>
            <p className="text-[11px] text-muted-foreground">Allow autonomous asset dispatch</p>
          </div>
          <Switch checked={vppEnabled} onCheckedChange={toggleVPP} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Bidirectional V2G Charging</Label>
            <p className="text-[11px] text-muted-foreground">Enable vehicle-to-grid power flow</p>
          </div>
          <Switch 
            checked={bidirectionalCharging} 
            onCheckedChange={(val) => setVPPConfig({ bidirectionalCharging: val })} 
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Response Threshold (Hz)</Label>
            <span className="text-xs font-mono text-primary font-bold">{responseThreshold.toFixed(2)} Hz</span>
          </div>
          <Slider 
            value={[responseThreshold]} 
            min={0.01} 
            max={0.20} 
            step={0.01} 
            onValueChange={([val]) => setVPPConfig({ responseThreshold: val })}
          />
          <p className="text-[10px] text-muted-foreground italic">Frequency deviation required to trigger automated response.</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Capacity Reserved (%)</Label>
            <span className="text-xs font-mono text-primary font-bold">{capacityReserved}%</span>
          </div>
          <Slider 
            value={[capacityReserved]} 
            min={5} 
            max={40} 
            step={1} 
            onValueChange={([val]) => setVPPConfig({ capacityReserved: val })}
          />
          <p className="text-[10px] text-muted-foreground italic">Minimum storage buffer for emergency grid stabilization.</p>
        </div>
      </CardContent>
    </Card>
  )
}