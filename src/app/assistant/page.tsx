import { Shell } from "@/components/layout/Shell"
import { AIAssistantTool } from "@/components/ai/AIAssistantTool"

export default function AssistantPage() {
  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-headline font-bold mb-2 text-foreground">AI Grid Assistant</h2>
          <p className="text-muted-foreground">Leverage generative AI to analyze complex events, predict stability threats, and optimize VPP configurations.</p>
        </div>
        <AIAssistantTool />
      </div>
    </Shell>
  )
}