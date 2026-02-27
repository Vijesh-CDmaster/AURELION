import { Shell } from "@/components/layout/Shell"
import { VPPConfigPanel } from "@/components/vpp/VPPConfigPanel"

export default function VPPPage() {
  return (
    <Shell>
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-headline font-bold mb-2 text-foreground">VPP Control Center</h2>
          <p className="text-muted-foreground">Manage Virtual Power Plant behavior, bidirectional charging limits, and response latency parameters across all aggregated edge assets.</p>
        </div>
        <VPPConfigPanel />
      </div>
    </Shell>
  )
}