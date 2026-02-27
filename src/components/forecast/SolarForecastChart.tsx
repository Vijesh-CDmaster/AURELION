"use client"

import * as React from "react"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  Cell
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Cloud, Sun, CloudLightning } from "lucide-react"

const forecastData = [
  { time: "10:00", generation: 4200, shading: "none" },
  { time: "11:00", generation: 4500, shading: "none" },
  { time: "12:00", generation: 4800, shading: "none" },
  { time: "13:00", generation: 2100, shading: "high" }, // Cloud Event
  { time: "14:00", generation: 3800, shading: "medium" },
  { time: "15:00", generation: 4400, shading: "none" },
  { time: "16:00", generation: 4100, shading: "none" },
]

export function SolarForecastChart() {
  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-headline">Solar Forecasting: T-42 Cluster</CardTitle>
            <CardDescription>Probabilistic generation forecast for next 6 hours</CardDescription>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <Sun className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-500">Peak Performance</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="generation" radius={[4, 4, 0, 0]}>
                {forecastData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.shading === 'high' ? 'hsl(var(--accent))' : 'hsl(var(--primary))'} 
                    fillOpacity={entry.shading === 'none' ? 0.8 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-primary opacity-80" />
            <span>Optimal Generation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-accent" />
            <span>Predicted Shading Event</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}