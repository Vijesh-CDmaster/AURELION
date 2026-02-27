"use client"

import * as React from "react"
import { StatusGrid } from "./StatusGrid"
import { FrequencyChart } from "./FrequencyChart"
import { EventInjector } from "../simulator/EventInjector"
import { VPPConfigPanel } from "../vpp/VPPConfigPanel"
import { useGridStore } from "@/lib/grid-store"

export function GridDashboard() {
  const { addHistoryPoint, frequency } = useGridStore()

  // Simulate real-time data drift
  React.useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const drift = (Math.random() * 0.02 - 0.01)
      const newValue = frequency === 50 ? 50 + drift : frequency + drift
      addHistoryPoint({ time, value: newValue })
    }, 2000)
    return () => clearInterval(interval)
  }, [addHistoryPoint, frequency])

  return (
    <div className="space-y-6">
      <StatusGrid />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FrequencyChart />
        </div>
        <div>
          <EventInjector />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <VPPConfigPanel />
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-center items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center glow-accent">
            <span className="text-accent font-bold">AI</span>
          </div>
          <h3 className="text-xl font-headline font-semibold">Proactive Insight Ready</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            The Sentinel AI has detected a potential cloud shading event at Transformer T-42 in 12 minutes.
          </p>
          <button className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
            Review AI Mitigation Strategy
          </button>
        </div>
      </div>
    </div>
  )
}