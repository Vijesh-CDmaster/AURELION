"use client"

import * as React from "react"
import { Bot, Send, Loader2, Info, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useGridStore } from "@/lib/grid-store"
import { identifyGridThreats } from "@/ai/flows/identify-grid-threats"
import { suggestStabilityMeasures } from "@/ai/flows/suggest-stability-measures-flow"
import { Badge } from "@/components/ui/badge"

export function AIAssistantTool() {
  const [loading, setLoading] = React.useState(false)
  const [analysis, setAnalysis] = React.useState<any>(null)
  const grid = useGridStore()

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      // Build dynamic forecasts from store shading events
      const dynamicForecasts = grid.shadingEvents.slice(0, 3).map(ev => ({
        type: 'cloud_shading' as const,
        description: `${ev.transformer} Cluster`,
        leadTimeMinutes: parseInt(ev.duration) || 12,
        impactEstimate: `${ev.severity === 'High' ? '-600kW' : ev.severity === 'Medium' ? '-400kW' : '-200kW'} solar`
      }))

      // Step 1: Identify threats
      const threatData = await identifyGridThreats({
        currentGridStatus: `Frequency: ${grid.frequency.toFixed(3)}Hz, Load: ${grid.loadDemand}MW, Solar: ${grid.solarGeneration}kW, VPP: ${grid.vppEnabled ? 'Active' : 'Standby'}, Latency: ${Math.round(grid.latency)}ms, Status: ${grid.status}`,
        forecasts: dynamicForecasts.length > 0 ? dynamicForecasts : [
          { type: 'other', description: 'No immediate shading events', leadTimeMinutes: 0, impactEstimate: 'Nominal' }
        ]
      })

      // Build dynamic shading events for measures
      const dynamicShadingEvents = grid.shadingEvents.slice(0, 3).map(ev => ({
        time: ev.time,
        severity: ev.severity.toLowerCase() as 'low' | 'medium' | 'high',
        transformerId: ev.transformer
      }))

      // Step 2: Get measures
      const measures = await suggestStabilityMeasures({
        threatDescription: threatData.threats[0]?.description || "Baseline Grid Drift",
        currentFrequencyDeviation: Math.abs(50 - grid.frequency),
        responseLatency: grid.latency,
        forecastedCloudShadingEvents: dynamicShadingEvents.length > 0 ? dynamicShadingEvents : [
          { time: 'N/A', severity: 'low', transformerId: 'N/A' }
        ],
        vppConfiguration: {
          bidirectionalChargingEnabled: grid.bidirectionalCharging,
          responseThreshold: grid.responseThreshold,
          capacityReservedPercent: grid.capacityReserved,
          geographicalConcentration: 'Distributed Urban'
        }
      })

      setAnalysis({ threatData, measures })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-card border-border flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center glow-primary">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-headline">AuraGrid Assistant</CardTitle>
          </div>
          <CardDescription>
            Autonomous grid stability analysis engine. Ask for a system health check or mitigation strategy.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 min-h-[300px] mb-4 pr-4">
            {!analysis && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <div className="p-4 rounded-full bg-muted/30">
                  <Sparkles className="h-8 w-8 text-accent opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Ready to analyze real-time grid telemetry and forecasts. Click "Initiate Analysis" to begin.
                </p>
              </div>
            )}
            {loading && (
              <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <p className="text-sm font-medium animate-pulse">Consulting Grid Dynamics & Historical Logs...</p>
              </div>
            )}
            {analysis && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="flex items-center gap-2 mb-2 text-accent">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-bold uppercase tracking-wider">Overall Assessment</span>
                  </div>
                  <p className="text-sm leading-relaxed">{analysis.threatData.overallAssessment}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Identified Threats</h4>
                  {analysis.threatData.threats.map((t: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-muted/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{t.description}</span>
                        <Badge variant="destructive" className="text-[10px] uppercase">{t.severity}</Badge>
                      </div>
                      <div className="space-y-1">
                        {t.mitigationActions.map((act: string, j: number) => (
                          <div key={j} className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-accent" />
                            {act}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
          
          <div className="space-y-3 pt-4 border-t border-border">
            <Button 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold" 
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? "Analyzing Grid State..." : "Initiate Full System Analysis"}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground italic">
              *Analysis includes VPP config review, solar forecast patterns, and asset health telemetry.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-md font-headline flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Proactive Stability Measures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis ? (
              <>
                <div className="space-y-2">
                  {analysis.measures.suggestedMeasures.map((m: string, i: number) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                      <div className="h-5 w-5 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <span className="text-xs">{m}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-border mt-4">
                  <h5 className="text-xs font-bold mb-3 uppercase tracking-wider text-muted-foreground">VPP Config Adjustments</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(analysis.measures.recommendedVPPAdjustments).map(([key, val]: any) => (
                      <div key={key} className="p-2 rounded bg-primary/5 border border-primary/20 text-[10px]">
                        <div className="text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1')}</div>
                        <div className="font-bold text-primary">{val.toString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto opacity-20" />
                <p className="text-xs">No active measures. Initiate analysis to receive guidance.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-md font-headline">AI Explanation Engine</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis ? (
              <div className="text-xs leading-relaxed text-muted-foreground bg-muted/10 p-4 rounded-lg border border-border">
                {analysis.measures.explanation}
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground italic">
                AuraGrid Sentinel uses Large Language Models to interpret complex grid telemetry, explaining system behavior in human terms to aid operators.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}