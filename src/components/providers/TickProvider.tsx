"use client"

import { useEffect, useRef } from "react"
import { useGridStore } from "@/lib/grid-store"

/**
 * Global Tick Provider
 *
 * Mounted once in the app layout. Ensures:
 *  1. Engines are initialised on first render
 *  2. A 2-second tick loop drives ALL four engines globally
 *     (physics, MARL, forecast, defense) regardless of which page is active
 *
 * Because the store is Zustand (module-level singleton), every page that
 * calls `useGridStore()` will automatically see the latest state pushed
 * by this interval — no per-page tick logic needed.
 */
export function TickProvider({ children }: { children: React.ReactNode }) {
  const initializeSystemData = useGridStore((s) => s.initializeSystemData)
  const tick = useGridStore((s) => s.tick)
  const dbSync = useGridStore((s) => s._dbSyncAfterTick)
  const bootedRef = useRef(false)

  // Boot engines once
  useEffect(() => {
    if (!bootedRef.current) {
      initializeSystemData()
      bootedRef.current = true
    }
  }, [initializeSystemData])

  // Global 2-second tick + DB persistence
  useEffect(() => {
    const id = setInterval(() => { tick(); dbSync(); }, 2000)
    return () => clearInterval(id)
  }, [tick, dbSync])

  return <>{children}</>
}
