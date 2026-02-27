"use client"

import { useEffect } from "react"
import { Shell } from "@/components/layout/Shell"
import { SolarForecastChart } from "@/components/forecast/SolarForecastChart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Cloud, MapPin, Sun, Target, BarChart3, Thermometer, Camera, AlertTriangle } from "lucide-react"
import { useGridStore } from "@/lib/grid-store"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export default function ForecastPage() {
  const { shadingEvents, clusterCoverage, forecastTelemetry, skyCameraTelemetry, initializeSystemData } = useGridStore()

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  const ft = forecastTelemetry
  const sc = skyCameraTelemetry
  const bandData = ft.forecastBands.map(b => ({
    t: `+${b.timeOffset}s`,
    predicted: Math.round(b.predicted),
    lower10: Math.round(b.lower10),
    upper90: Math.round(b.upper90),
    lower25: Math.round(b.lower25),
    upper75: Math.round(b.upper75),
  }))

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold mb-2 text-foreground">Probabilistic Solar Forecasting</h2>
            <p className="text-muted-foreground text-sm">
              Ineichen-Perez clear-sky model + Markov cloud tracking + 50-member Monte Carlo ensemble.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <Sun className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-500">
              {ft.currentIrradiance.toFixed(0)} / {ft.clearSkyIrradiance.toFixed(0)} W/m²
            </span>
          </div>
        </div>

        {/* ── Scoring KPIs ── */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">CRPS Score</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-primary">{ft.crps.toFixed(3)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">Continuous Ranked Probability Score (lower = better)</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Pinball Loss</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold">{ft.pinballLoss.toFixed(3)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">Quantile calibration metric</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Reliability</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-emerald-400">{(ft.reliabilityScore * 100).toFixed(1)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={ft.reliabilityScore * 100} className="h-1.5" />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Active Clouds</CardDescription>
              <CardTitle className="text-3xl font-headline font-bold text-accent">{ft.clouds.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[10px] text-muted-foreground">Tracked objects with Markov opacity transitions</div>
            </CardContent>
          </Card>
        </div>

        {/* ── Confidence bands chart + Transformer shading ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                30-Second Probabilistic Forecast (Confidence Intervals)
              </CardTitle>
              <CardDescription className="text-[10px]">
                50-member Monte Carlo ensemble → p10/p25/p75/p90 quantiles at 3s intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bandData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bandData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                      <XAxis dataKey="t" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Area type="monotone" dataKey="upper90" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.08} />
                      <Area type="monotone" dataKey="upper75" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.12} />
                      <Area type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                      <Area type="monotone" dataKey="lower25" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.12} />
                      <Area type="monotone" dataKey="lower10" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.08} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">
                  Collecting ensemble data...
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-accent" />
                Transformer Shading
              </CardTitle>
              <CardDescription className="text-[10px]">Per-transformer predicted irradiance & shading at +30s</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ft.transformers.length > 0 ? ft.transformers.map((t, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold">{t.name}</span>
                    <Badge variant="outline" className={`text-[8px] ${t.shadingFactor > 0.5 ? 'border-red-500/40 text-red-400' : t.shadingFactor > 0.2 ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400'}`}>
                      {t.shadingFactor > 0.5 ? 'HEAVY SHADE' : t.shadingFactor > 0.2 ? 'PARTIAL' : 'CLEAR'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Now: {(t.currentGenMW * 1000).toFixed(0)} kW</span>
                    <span>+30s shade: {(t.predicted30s * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={(1 - t.shadingFactor) * 100} className="h-1 mt-1" />
                </div>
              )) : (
                <div className="text-xs text-muted-foreground text-center py-4">No transformer data available yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Original content: generation chart + shading + coverage ── */}
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

        {/* ── Cloud tracking visual ── */}
        {ft.clouds.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Cloud className="h-4 w-4 text-accent" />
                Cloud Tracking (Markov Chain)
              </CardTitle>
              <CardDescription className="text-[10px]">Position & opacity tracked with 4-state transition matrix</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-40 w-full bg-gradient-to-b from-blue-900/20 to-transparent rounded-xl border border-border overflow-hidden">
                {ft.clouds.map((c, i) => (
                  <div key={i} className="absolute rounded-full bg-white/80 blur-sm" style={{
                    left: `${Math.max(0, Math.min(95, c.x * 10))}%`, top: `${Math.max(0, Math.min(85, c.y * 10))}%`,
                    width: `${c.size * 20 + 10}px`, height: `${c.size * 12 + 6}px`, opacity: c.opacity * 0.8,
                  }} />
                ))}
                {ft.transformers.map((t, i) => (
                  <div key={`t-${i}`} className="absolute h-2 w-2 bg-yellow-400 rounded-full" style={{
                    left: `${10 + i * 12}%`, bottom: '10%',
                  }} title={t.name} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Sky-Camera CV Pipeline Telemetry ── */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Camera className="h-4 w-4 text-accent" />
              Sky-Camera CV Pipeline
            </CardTitle>
            <CardDescription className="text-[10px]">
              Synthetic 64×64 sky image analysis — blob detection, optical depth, cloud velocity tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Frames</div>
                <div className="text-lg font-headline font-black text-primary">{sc.framesProcessed}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Proc. Time</div>
                <div className="text-lg font-headline font-black">{sc.avgProcessingMs.toFixed(1)}<span className="text-xs">ms</span></div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Cloud Frac.</div>
                <div className="text-lg font-headline font-black">{(sc.cloudFraction * 100).toFixed(0)}<span className="text-xs">%</span></div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Blobs</div>
                <div className="text-lg font-headline font-black text-accent">{sc.blobCount}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Opt. Depth</div>
                <div className="text-lg font-headline font-black">{sc.avgOpticalDepth.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Cloud Vel.</div>
                <div className="text-lg font-headline font-black">{sc.avgCloudVelocity.toFixed(1)}<span className="text-xs">m/s</span></div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Ramp Mag.</div>
                <div className="text-lg font-headline font-black">{(sc.rampMagnitude * 100).toFixed(0)}<span className="text-xs">%</span></div>
              </div>
              <div className={`p-3 rounded-lg border text-center ${sc.rampAlert ? 'bg-red-500/10 border-red-500/30' : 'bg-muted/20 border-border'}`}>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">Ramp Alert</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {sc.rampAlert && <AlertTriangle className="h-3 w-3 text-red-400" />}
                  <span className={`text-lg font-headline font-black ${sc.rampAlert ? 'text-red-400' : 'text-emerald-400'}`}>
                    {sc.rampAlert ? `${sc.rampLeadTimeSec.toFixed(0)}s` : 'CLEAR'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}