"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGridStore } from "@/lib/grid-store"
import { AlertTriangle, ZapOff, ArrowDownCircle, Bomb, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function EventInjector() {
  const { injectEvent, attackStatus } = useGridStore()
  const [cooldown, setCooldown] = React.useState<string | null>(null)

  const fire = (type: Parameters<typeof injectEvent>[0], label: string, magnitude?: number) => {
    setCooldown(type)
    injectEvent(type, magnitude)
    toast({
      title: "Event Injected",
      description: `Injecting ${label} into live physics engine...`,
    })
    // 4-second cooldown to let the engines react visibly
    setTimeout(() => setCooldown(null), 4000)
  }

  const busy = (t: string) => cooldown === t

  return (
    <Card className="bg-card border-border shadow-md h-full">
      <CardHeader>
        <CardTitle className="text-lg font-headline">Event Injector</CardTitle>
        <CardDescription>Inject real perturbations into the live engine pipeline</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button
          variant="outline"
          className="justify-start gap-3 h-12 bg-muted/20 border-border hover:bg-red-950/20 hover:border-red-500/50"
          onClick={() => fire('freq-dip', 'Frequency Dip (−150 mHz)', 150)}
          disabled={!!cooldown}
        >
          {busy('freq-dip') ? <Loader2 className="h-5 w-5 text-red-500 animate-spin" /> : <ArrowDownCircle className="h-5 w-5 text-red-500" />}
          <div className="text-left">
            <div className="font-semibold text-sm">Frequency Dip</div>
            <div className="text-[10px] text-muted-foreground">−150 mHz via swing equation</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="justify-start gap-3 h-12 bg-muted/20 border-border hover:bg-orange-950/20 hover:border-orange-500/50"
          onClick={() => fire('load-spike', 'Load Spike (+500 MW)', 500)}
          disabled={!!cooldown}
        >
          {busy('load-spike') ? <Loader2 className="h-5 w-5 text-orange-500 animate-spin" /> : <AlertTriangle className="h-5 w-5 text-orange-500" />}
          <div className="text-left">
            <div className="font-semibold text-sm">Major Load Spike</div>
            <div className="text-[10px] text-muted-foreground">+500 MW industrial startup</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="justify-start gap-3 h-12 bg-muted/20 border-border hover:bg-purple-950/20 hover:border-purple-500/50"
          onClick={() => fire('vpp-loss', 'VPP Asset Loss (−20% renewable)')}
          disabled={!!cooldown}
        >
          {busy('vpp-loss') ? <Loader2 className="h-5 w-5 text-purple-500 animate-spin" /> : <ZapOff className="h-5 w-5 text-purple-500" />}
          <div className="text-left">
            <div className="font-semibold text-sm">VPP Asset Loss</div>
            <div className="text-[10px] text-muted-foreground">−20% renewable generation</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="justify-start gap-3 h-12 bg-muted/20 border-border hover:bg-destructive/10 hover:border-destructive"
          onClick={() => fire('demand-attack', 'MadIoT Demand Attack')}
          disabled={!!cooldown || attackStatus !== 'none'}
        >
          {busy('demand-attack') ? <Loader2 className="h-5 w-5 text-destructive animate-spin" /> : <Bomb className="h-5 w-5 text-destructive" />}
          <div className="text-left">
            <div className="font-semibold text-sm">Demand-Side Attack</div>
            <div className="text-[10px] text-muted-foreground">
              {attackStatus !== 'none' ? 'Attack in progress — wait for resolution' : 'MadIoT load-sync (auto-clears 10 s)'}
            </div>
          </div>
        </Button>
      </CardContent>
    </Card>
  )
}