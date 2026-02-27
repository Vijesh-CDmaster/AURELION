"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGridStore } from "@/lib/grid-store"
import { AlertTriangle, ZapOff, ArrowDownCircle, Bomb } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function EventInjector() {
  const { updateFrequency } = useGridStore()

  const injectEvent = (type: string, val: number, duration: number = 3000) => {
    toast({
      title: "Event Injected",
      description: `Simulating ${type}...`,
    })
    
    updateFrequency(val)
    
    // Gradual recovery
    setTimeout(() => {
      updateFrequency(50.00)
      toast({
        title: "Event Resolved",
        description: "Grid has stabilized.",
      })
    }, duration)
  }

  return (
    <Card className="bg-card border-border shadow-md h-full">
      <CardHeader>
        <CardTitle className="text-lg font-headline">Event Injector</CardTitle>
        <CardDescription>Trigger simulated anomalies to test VPP response</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button 
          variant="outline" 
          className="justify-start gap-3 h-12 bg-muted/20 border-border hover:bg-red-950/20 hover:border-red-500/50"
          onClick={() => injectEvent("Frequency Dip", 49.85)}
        >
          <ArrowDownCircle className="h-5 w-5 text-red-500" />
          <div className="text-left">
            <div className="font-semibold text-sm">Frequency Dip</div>
            <div className="text-[10px] text-muted-foreground">-150mHz sudden drop</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="justify-start gap-3 h-12 bg-muted/20 border-border hover:bg-orange-950/20 hover:border-orange-500/50"
          onClick={() => injectEvent("Load Spike", 49.92)}
        >
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <div className="text-left">
            <div className="font-semibold text-sm">Major Load Spike</div>
            <div className="text-[10px] text-muted-foreground">+500MW industrial startup</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="justify-start gap-3 h-12 bg-muted/20 border-border hover:bg-purple-950/20 hover:border-purple-500/50"
          onClick={() => injectEvent("VPP Outage", 50.15)}
        >
          <ZapOff className="h-5 w-5 text-purple-500" />
          <div className="text-left">
            <div className="font-semibold text-sm">VPP Asset Loss</div>
            <div className="text-[10px] text-muted-foreground">-20% response capacity</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="justify-start gap-3 h-12 bg-muted/20 border-border hover:bg-destructive/10 hover:border-destructive"
          onClick={() => injectEvent("Demand Attack", 49.75, 5000)}
        >
          <Bomb className="h-5 w-5 text-destructive" />
          <div className="text-left">
            <div className="font-semibold text-sm">Demand-Side Attack</div>
            <div className="text-[10px] text-muted-foreground">Coordinated device surge</div>
          </div>
        </Button>
      </CardContent>
    </Card>
  )
}