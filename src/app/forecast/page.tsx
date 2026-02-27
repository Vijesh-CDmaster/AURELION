"use client"

import { useEffect } from "react"
import { Shell } from "@/components/layout/Shell"
import { SolarForecastChart } from "@/components/forecast/SolarForecastChart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, MapPin } from "lucide-react"
import { useGridStore } from "@/lib/grid-store"

export default function ForecastPage() {
  const { shadingEvents, clusterCoverage, initializeSystemData } = useGridStore()

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold mb-2 text-foreground">Generation Forecasting</h2>
            <p className="text-muted-foreground">Advanced meteorological integration and cloud-shading prediction for distributed PV clusters.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SolarForecastChart />
          </div>
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-md font-headline">Upcoming Shading Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shadingEvents.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-accent/20 flex items-center justify-center">
                        <Cloud className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{ev.time} - {ev.transformer}</div>
                        <div className="text-[10px] text-muted-foreground">Lead time: {ev.duration}</div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${ev.severity === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {ev.severity}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-md font-headline flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  Cluster Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clusterCoverage.map((cluster, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs">
                        <span>{cluster.name} ({cluster.assets} Assets)</span>
                        <span className="font-bold">{cluster.stability.toFixed(0)}% Stability</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mt-1">
                        <div className="bg-accent h-full" style={{ width: `${cluster.stability}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  )
}