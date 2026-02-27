'use server';
/**
 * @fileOverview Analyzes current grid data and forecasts to identify potential
 * near-term grid stability threats.
 *
 * Uses the Featherless AI (OpenAI-compatible) endpoint.
 */

import { chatCompletionJSON } from '@/ai/featherless';

// ────────── Types ──────────

export interface ForecastEvent {
  type: 'cloud_shading' | 'load_increase' | 'frequency_dip' | 'other';
  description: string;
  leadTimeMinutes: number;
  impactEstimate: string;
}

export interface IdentifiedThreat {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigationActions: string[];
}

export interface IdentifyGridThreatsInput {
  currentGridStatus: string;
  forecasts: ForecastEvent[];
}

export interface IdentifyGridThreatsOutput {
  threats: IdentifiedThreat[];
  overallAssessment: string;
}

// ────────── Flow ──────────

const SYSTEM_PROMPT = `You are an expert grid operator and stability analyst. Analyse the provided current grid data and forecasts to proactively identify near-term grid stability threats and suggest mitigation actions.

You MUST respond with pure JSON matching this schema (no markdown fences):
{
  "threats": [
    {
      "description": "<threat description>",
      "severity": "low|medium|high|critical",
      "mitigationActions": ["<action1>", "<action2>"]
    }
  ],
  "overallAssessment": "<overall stability assessment>"
}`;

export async function identifyGridThreats(
  input: IdentifyGridThreatsInput
): Promise<IdentifyGridThreatsOutput> {
  const forecastBlock = input.forecasts.length
    ? input.forecasts
        .map(
          (f) =>
            `- Type: ${f.type}\n  Description: ${f.description}\n  Lead Time: ${f.leadTimeMinutes} minutes\n  Impact Estimate: ${f.impactEstimate}`
        )
        .join('\n')
    : 'No significant forecast events.';

  const userPrompt = `### Current Grid Status:
${input.currentGridStatus}

### Forecast Events:
${forecastBlock}

Based on the above information, identify any potential grid stability threats. For each threat, provide a description, its severity (low, medium, high, critical), and concrete mitigation actions. Finally, provide an overall assessment of the grid's stability.`;

  return chatCompletionJSON<IdentifyGridThreatsOutput>([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]);
}
