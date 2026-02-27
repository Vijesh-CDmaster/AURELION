'use server';
/**
 * @fileOverview An AI agent that analyzes grid data and threats to suggest proactive measures and VPP configuration adjustments.
 *
 * - suggestStabilityMeasures - A function that handles the process of suggesting stability measures.
 * - SuggestStabilityMeasuresInput - The input type for the suggestStabilityMeasures function.
 * - SuggestStabilityMeasuresOutput - The return type for the suggestStabilityMeasures function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastedCloudShadingEventSchema = z.object({
  time: z.string().describe('The estimated time of the cloud shading event.'),
  severity: z.string().describe('The severity of the cloud shading event (e.g., "high", "medium", "low").'),
  transformerId: z.string().describe('The ID of the transformer affected by the event.'),
});

const VPPConfigurationSchema = z.object({
  bidirectionalChargingEnabled: z.boolean().describe('Whether bidirectional charging is currently enabled for VPP devices.'),
  responseThreshold: z.number().describe('The frequency deviation threshold that triggers VPP response, in Hz.'),
  capacityReservedPercent: z.number().describe('The percentage of total VPP capacity reserved for frequency response.'),
  geographicalConcentration: z.string().optional().describe('Describes the geographical concentration of VPP assets (e.g., "urban", "rural", "distributed").'),
});

const SuggestStabilityMeasuresInputSchema = z.object({
  threatDescription: z.string().describe('A detailed description of the identified grid instability threat.'),
  currentFrequencyDeviation: z.number().describe('The current grid frequency deviation from nominal, in Hz.'),
  responseLatency: z.number().describe('The current system response latency to grid events, in milliseconds.'),
  forecastedCloudShadingEvents: z.array(ForecastedCloudShadingEventSchema).describe('A list of forecasted cloud shading events that could impact solar generation.'),
  vppConfiguration: VPPConfigurationSchema.describe('The current configuration parameters of the Virtual Power Plant.'),
});
export type SuggestStabilityMeasuresInput = z.infer<typeof SuggestStabilityMeasuresInputSchema>;

const RecommendedVPPAdjustmentsSchema = z.object({
  bidirectionalChargingEnabled: z.boolean().optional().describe('Suggested change for whether bidirectional charging should be enabled.'),
  responseThreshold: z.number().optional().describe('Suggested new frequency deviation threshold for VPP response, in Hz.'),
  capacityReservedPercent: z.number().optional().describe('Suggested new percentage of total VPP capacity to be reserved for frequency response.'),
});

const SuggestStabilityMeasuresOutputSchema = z.object({
  suggestedMeasures: z.array(z.string()).describe('A list of specific, actionable proactive measures to maintain grid stability.'),
  recommendedVPPAdjustments: RecommendedVPPAdjustmentsSchema.describe('Specific configuration adjustments recommended for the Virtual Power Plant.'),
  explanation: z.string().describe('A detailed explanation for the suggested measures and VPP adjustments, including reasoning.'),
});
export type SuggestStabilityMeasuresOutput = z.infer<typeof SuggestStabilityMeasuresOutputSchema>;

export async function suggestStabilityMeasures(input: SuggestStabilityMeasuresInput): Promise<SuggestStabilityMeasuresOutput> {
  return suggestStabilityMeasuresFlow(input);
}

const suggestStabilityMeasuresPrompt = ai.definePrompt({
  name: 'suggestStabilityMeasuresPrompt',
  input: { schema: SuggestStabilityMeasuresInputSchema },
  output: { schema: SuggestStabilityMeasuresOutputSchema },
  prompt: `You are an expert grid operator AI assistant focused on maintaining grid stability. Your task is to analyze potential grid instability threats and suggest specific proactive measures, along with Virtual Power Plant (VPP) configuration adjustments, to prevent issues and ensure grid resilience.

Analyze the following information:

Identified Threat: {{{threatDescription}}}
Current Grid Frequency Deviation: {{{currentFrequencyDeviation}}} Hz
System Response Latency: {{{responseLatency}}} ms

Forecasted Cloud Shading Events:
{{#if forecastedCloudShadingEvents}}
{{#each forecastedCloudShadingEvents}}
- Time: {{{time}}}, Severity: {{{severity}}}, Transformer ID: {{{transformerId}}}
{{/each}}
{{else}}
No forecasted cloud shading events.
{{/if}}

Current VPP Configuration:
- Bidirectional Charging Enabled: {{{vppConfiguration.bidirectionalChargingEnabled}}}
- Response Threshold: {{{vppConfiguration.responseThreshold}}} Hz
- Capacity Reserved: {{{vppConfiguration.capacityReservedPercent}}}%
{{#if vppConfiguration.geographicalConcentration}}
- Geographical Concentration: {{{vppConfiguration.geographicalConcentration}}}
{{/if}}

Based on this data, provide:
1. A list of specific, actionable proactive measures to maintain grid stability.
2. Recommended adjustments to the VPP configuration. Only suggest changes to 'bidirectionalChargingEnabled', 'responseThreshold', and 'capacityReservedPercent' if necessary. If no change is needed for a specific parameter, do not include it in the adjustments.
3. A detailed explanation for your suggestions, outlining the reasoning behind each measure and VPP adjustment.

Ensure your output adheres strictly to the provided JSON schema for suggestedMeasures, recommendedVPPAdjustments, and explanation.`,
});

const suggestStabilityMeasuresFlow = ai.defineFlow(
  {
    name: 'suggestStabilityMeasuresFlow',
    inputSchema: SuggestStabilityMeasuresInputSchema,
    outputSchema: SuggestStabilityMeasuresOutputSchema,
  },
  async (input) => {
    const { output } = await suggestStabilityMeasuresPrompt(input);
    return output!;
  }
);
