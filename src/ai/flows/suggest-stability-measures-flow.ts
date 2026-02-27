'use server';
/**
 * @fileOverview Analyzes grid data and threats to suggest proactive measures
 * and VPP configuration adjustments.
 *
 * Uses the Featherless AI (OpenAI-compatible) endpoint.
 */

import { chatCompletionJSON } from '@/ai/featherless';

// ────────── Types ──────────

export interface ForecastedCloudShadingEvent {
  time: string;
  severity: string;
  transformerId: string;
}

export interface VPPConfiguration {
  bidirectionalChargingEnabled: boolean;
  responseThreshold: number;
  capacityReservedPercent: number;
  geographicalConcentration?: string;
}

export interface SuggestStabilityMeasuresInput {
  threatDescription: string;
  currentFrequencyDeviation: number;
  responseLatency: number;
  forecastedCloudShadingEvents: ForecastedCloudShadingEvent[];
  vppConfiguration: VPPConfiguration;
}

export interface RecommendedVPPAdjustments {
  bidirectionalChargingEnabled?: boolean;
  responseThreshold?: number;
  capacityReservedPercent?: number;
}

export interface SuggestStabilityMeasuresOutput {
  suggestedMeasures: string[];
  recommendedVPPAdjustments: RecommendedVPPAdjustments;
  explanation: string;
}

// ────────── Flow ──────────

const SYSTEM_PROMPT = `You are an expert grid operator AI assistant focused on maintaining grid stability. Analyse potential grid instability threats and suggest specific proactive measures, along with Virtual Power Plant (VPP) configuration adjustments, to prevent issues and ensure grid resilience.

You MUST respond with pure JSON matching this schema (no markdown fences):
{
  "suggestedMeasures": ["<measure1>", "<measure2>", ...],
  "recommendedVPPAdjustments": {
    "bidirectionalChargingEnabled": true|false,   // optional
    "responseThreshold": <number>,                // optional
    "capacityReservedPercent": <number>           // optional
  },
  "explanation": "<detailed reasoning>"
}
Only include a field in recommendedVPPAdjustments if you are suggesting a change.`;

export async function suggestStabilityMeasures(
  input: SuggestStabilityMeasuresInput
): Promise<SuggestStabilityMeasuresOutput> {
  const shadingBlock = input.forecastedCloudShadingEvents.length
    ? input.forecastedCloudShadingEvents
        .map((e) => `- Time: ${e.time}, Severity: ${e.severity}, Transformer ID: ${e.transformerId}`)
        .join('\n')
    : 'No forecasted cloud shading events.';

  const userPrompt = `Analyse the following information:

Identified Threat: ${input.threatDescription}
Current Grid Frequency Deviation: ${input.currentFrequencyDeviation} Hz
System Response Latency: ${input.responseLatency} ms

Forecasted Cloud Shading Events:
${shadingBlock}

Current VPP Configuration:
- Bidirectional Charging Enabled: ${input.vppConfiguration.bidirectionalChargingEnabled}
- Response Threshold: ${input.vppConfiguration.responseThreshold} Hz
- Capacity Reserved: ${input.vppConfiguration.capacityReservedPercent}%
${input.vppConfiguration.geographicalConcentration ? `- Geographical Concentration: ${input.vppConfiguration.geographicalConcentration}` : ''}

Based on this data, provide:
1. A list of specific, actionable proactive measures to maintain grid stability.
2. Recommended adjustments to the VPP configuration. Only suggest changes if necessary.
3. A detailed explanation for your suggestions, outlining the reasoning behind each measure and VPP adjustment.`;

  return chatCompletionJSON<SuggestStabilityMeasuresOutput>([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]);
}
