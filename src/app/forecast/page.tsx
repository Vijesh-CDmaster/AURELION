"use client"

import { useEffect } from "react"
import { Shell } from "@/components/layout/Shell"
import { SolarForecastChart } from "@/components/forecast/SolarForecastChart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Cloud, MapPin, Camera, AlertTriangle, TrendingUp, Gauge, Eye, Bot, RefreshCw } from "lucide-react"
import { useGridStore } from "@/lib/grid-store"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useAI } from "@/hooks/useAI"
import { fastapi } from "@/lib/fastapi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts"

export default function ForecastPage() {
  const {
    shadingEvents, clusterCoverage, forecastAccuracy, forecastUncertainty,
    falseCalmDetected, forecastAccuracyHistory, solarForecast, solarGeneration,
    skyCamEnabled, forecastHorizon, initializeSystemData, updateFromServer, tick
  } = useGridStore()

  const { connected } = useWebSocket({ channel: 'grid', onMessage: (data) => updateFromServer(data) })
  const { insight: aiInsight, loading: aiLoading, refresh: refreshAI } = useAI({
    fetcher: fastapi.ai.solarUncertainty, refreshInterval: 30000,
  })

  useEffect(() => { initializeSystemData() }, [initializeSystemData])
  useEffect(() => { if (!connected) { const i = setInterval(() => tick(), 2000); return () => clearInterval(i) } }, [tick, connected])

  // Add confidence bands to solar forecast data
  const forecastWithBands = solarForecast.map((p) => ({
    ...p,
    upper: p.generation * (1 + forecastUncertainty / 100),
    lower: Math.max(0, p.generation * (1 - forecastUncertainty / 100)),
  }))

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold mb-2 text-foreground">Generation Forecasting</h2>
            <p className="text-muted-foreground">Advanced meteorological integration and cloud-shading prediction for distributed PV clusters.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[8px] h-6 px-3">Horizon: {forecastHorizon}</Badge>
            <Badge variant={skyCamEnabled ? "default" : "secondary"} className="text-[8px] h-6 px-3">
              <Camera className="h-3 w-3 mr-1" /> Sky-Cam {skyCamEnabled ? 'ON' : 'OFF'}
            </Badge>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Generation</span>
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-headline font-bold text-amber-400">{Math.round(solarGeneration).toLocaleString()} <span className="text-sm text-muted-foreground">kW</span></div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Forecast Accuracy</span>
                <Gauge className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-headline font-bold text-emerald-400">{forecastAccuracy.toFixed(1)}%</div>
              <Progress value={forecastAccuracy} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Uncertainty</span>
                <Eye className="h-4 w-4 text-accent" />
              </div>
              <div className="text-2xl font-headline font-bold">±{forecastUncertainty.toFixed(1)}%</div>
              <div className="text-[10px] mt-1 text-muted-foreground">Prediction confidence band</div>
            </CardContent>
          </Card>

          <Card className={`bg-card border-border ${falseCalmDetected ? 'border-red-500/50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">False Calm</span>
                <AlertTriangle className={`h-4 w-4 ${falseCalmDetected ? 'text-red-400 animate-pulse' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-2xl font-headline font-bold">
                {falseCalmDetected ? (
                  <span className="text-red-400">DETECTED</span>
                ) : (
                  <span className="text-emerald-400">CLEAR</span>
                )}
              </div>
              <div className="text-[10px] mt-1 text-muted-foreground">
                {falseCalmDetected ? 'Anomalous low-variance period' : 'No false calm signals'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart + Sidebar */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SolarForecastChart />

            {/* Confidence Bands Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Forecast Confidence Bands</CardTitle>
                <CardDescription>Upper/lower prediction bounds based on ±{forecastUncertainty.toFixed(1)}% uncertainty</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastWithBands}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="upper" stroke="transparent" fill="hsl(var(--primary))" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="lower" stroke="transparent" fill="hsl(var(--background))" fillOpacity={1} />
                      <Area type="monotone" dataKey="generation" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Sky Camera Panel */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-md font-headline flex items-center gap-2">
                  <Camera className="h-4 w-4 text-accent" />
                  Sky Camera Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 rounded-lg bg-gradient-to-b from-blue-900/50 to-blue-600/20 border border-border flex items-center justify-center mb-3 overflow-hidden relative">
                  {skyCamEnabled ? (
                    <>
                      <div className="absolute inset-0 opacity-30">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="absolute bg-white/20 rounded-full blur-md" style={{
                            width: `${30 + Math.random() * 40}px`, height: `${20 + Math.random() * 20}px`,
                            top: `${Math.random() * 60}%`, left: `${Math.random() * 80}%`,
                          }} />
                        ))}
                      </div>
                      <div className="text-center z-10">
                        <div className="text-[10px] text-blue-300 font-bold uppercase">Live Irradiance Feed</div>
                        <div className="text-lg font-headline font-bold text-white">{Math.round(solarGeneration / 10)} W/m²</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Camera Offline</div>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Cloud cover analysis processed at {forecastHorizon} intervals.
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Shading Events */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-md font-headline">Upcoming Shading Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shadingEvents.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-accent/20 flex items-center justify-center">
                        <Cloud className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{ev.time} - {ev.transformer}</div>
                        <div className="text-[10px] text-muted-foreground">Lead: {ev.duration}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[8px] h-4 ${ev.severity === 'High' ? 'border-red-500/30 text-red-400' : ev.severity === 'Medium' ? 'border-amber-500/30 text-amber-400' : 'border-blue-500/30 text-blue-400'}`}>
                      {ev.severity}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cluster Coverage */}
            <Card className="bg-card border-border border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-md font-headline flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  Cluster Coverage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {clusterCoverage.map((cluster, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs">
                      <span>{cluster.name} ({cluster.assets} Assets)</span>
                      <span className="font-bold">{cluster.stability.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mt-1">
                      <div className="bg-accent h-full transition-all" style={{ width: `${cluster.stability}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Uncertainty Analysis */}
        <Card className="bg-card border-border bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Bot className="h-4 w-4 text-accent" />
              AI Uncertainty Analysis
              <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={refreshAI} disabled={aiLoading}>
                <RefreshCw className={`h-3 w-3 ${aiLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground italic leading-relaxed">{aiLoading ? 'Analysing forecast uncertainty…' : aiInsight || 'Waiting for AI analysis…'}</p>
          </CardContent>
        </Card>

        {/* Forecast Accuracy History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Forecast Accuracy History</CardTitle>
            <CardDescription>Tracking prediction accuracy over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastAccuracyHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[75, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}