"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, ShieldAlert, TrendingDown, CloudRain, Thermometer, Wind } from "lucide-react"
import { fastapi, DropPredictionResponse } from "@/lib/fastapi"

const RISK_CONFIG = {
  low:      { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle,   label: "LOW RISK",      pulse: false },
  medium:   { color: "bg-amber-500/20 text-amber-400 border-amber-500/30",       icon: AlertTriangle, label: "MEDIUM RISK",   pulse: false },
  high:     { color: "bg-orange-500/20 text-orange-400 border-orange-500/30",     icon: AlertTriangle, label: "HIGH RISK",     pulse: true  },
  critical: { color: "bg-red-500/20 text-red-400 border-red-500/30",             icon: ShieldAlert,   label: "CRITICAL RISK", pulse: true  },
  unknown:  { color: "bg-muted/20 text-muted-foreground border-border",          icon: AlertTriangle, label: "UNKNOWN",       pulse: false },
}

export function DropPredictionCard() {
  const [data, setData] = React.useState<DropPredictionResponse | null>(null)
  const [loading, setLoading] = React.useState(true)

  const fetchPrediction = React.useCallback(async () => {
    try {
      const res = await fastapi.prediction.drop()
      setData(res)
    } catch (err) {
      console.warn("Drop prediction fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPrediction()
    const interval = setInterval(fetchPrediction, 5000) // refresh every 5s
    return () => clearInterval(interval)
  }, [fetchPrediction])

  const risk = data?.risk_level || "unknown"
  const config = RISK_CONFIG[risk]
  const Icon = config.icon
  const probability = data ? (data.drop_probability * 100).toFixed(1) : "—"

  return (
    <Card className="bg-card border-border shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-primary" />
          ML Drop Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Risk badge + probability */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.color} ${config.pulse ? "animate-pulse" : ""}`}>
                <Icon className="h-4 w-4" />
                <span className="text-xs font-bold">{config.label}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-headline font-bold">{probability}%</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Drop Probability</div>
              </div>
            </div>

            {/* Prediction result */}
            <div className={`p-3 rounded-lg border ${data?.prediction === 1 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
              <div className="text-xs font-bold mb-1">
                {data?.prediction === 1 ? "⚠️ Generation Drop Expected" : "✅ No Drop Expected"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {data?.prediction === 1
                  ? "The ML model predicts an imminent renewable energy generation drop. Consider preemptive VPP action."
                  : "Current conditions indicate stable renewable generation. Model confidence is high."}
              </div>
            </div>

            {/* Weather conditions */}
            {data?.weather && (
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg border border-border bg-muted/20 text-center">
                  <Thermometer className="h-3 w-3 mx-auto mb-1 text-orange-400" />
                  <div className="text-[10px] font-bold text-muted-foreground">TEMP</div>
                  <div className="text-xs font-bold">{data.weather.temperature?.toFixed(1)}°C</div>
                </div>
                <div className="p-2 rounded-lg border border-border bg-muted/20 text-center">
                  <CloudRain className="h-3 w-3 mx-auto mb-1 text-blue-400" />
                  <div className="text-[10px] font-bold text-muted-foreground">CLOUD</div>
                  <div className="text-xs font-bold">{data.weather.cloud_cover?.toFixed(0)}%</div>
                </div>
                <div className="p-2 rounded-lg border border-border bg-muted/20 text-center">
                  <Wind className="h-3 w-3 mx-auto mb-1 text-cyan-400" />
                  <div className="text-[10px] font-bold text-muted-foreground">WIND</div>
                  <div className="text-xs font-bold">{data.weather.wind_speed?.toFixed(1)} m/s</div>
                </div>
              </div>
            )}

            {data?.error && (
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
                Model error: {data.error}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
