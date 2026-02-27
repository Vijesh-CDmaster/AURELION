'use server';
/**
 * @fileOverview This flow analyzes current grid data and forecasts to identify potential near-term grid stability threats.
 *
 * - identifyGridThreats - A function that handles the grid threat identification process.
 * - IdentifyGridThreatsInput - The input type for the identifyGridThreats function.
 * - IdentifyGridThreatsOutput - The return type for the identifyGridThreats function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ForecastEventSchema = z.object({
  type: z
    .enum(['cloud_shading', 'load_increase', 'frequency_dip', 'other'])
    .describe('The type of forecast event.'),
  description: z.string().describe('A detailed description of the event.'),
  leadTimeMinutes: z
    .number()
    .describe('How many minutes until the event is expected to impact the grid.'),
  impactEstimate: z
    .string()
    .describe('Estimated impact on power generation or demand (e.g., "-50MW solar", "+100MW load").'),
});

const IdentifiedThreatSchema = z.object({
  description: z.string().describe('A clear description of the identified threat.'),
  severity: z
    .enum(['low', 'medium', 'high', 'critical'])
    .describe('The severity level of the threat.'),
  mitigationActions: z
    .array(z.string())
    .describe('A list of suggested actions to mitigate the threat.'),
});

const IdentifyGridThreatsInputSchema = z.object({
  currentGridStatus: z
    .string()
    .describe('A summary of the current grid status, including frequency deviation, load, and generation.'),
  forecasts: z
    .array(ForecastEventSchema)
    .describe('A list of upcoming forecast events, such as cloud-shading or load changes.'),
});
export type IdentifyGridThreatsInput = z.infer<typeof IdentifyGridThreatsInputSchema>;

const IdentifyGridThreatsOutputSchema = z.object({
  threats: z
    .array(IdentifiedThreatSchema)
    .describe('A list of identified near-term grid stability threats.'),
  overallAssessment: z
    .string()
    .describe('An overall assessment of the grid stability based on current data and forecasts.'),
});
export type IdentifyGridThreatsOutput = z.infer<typeof IdentifyGridThreatsOutputSchema>;

export async function identifyGridThreats(
  input: IdentifyGridThreatsInput
): Promise<IdentifyGridThreatsOutput> {
  return identifyGridThreatsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyGridThreatsPrompt',
  input: { schema: IdentifyGridThreatsInputSchema },
  output: { schema: IdentifyGridThreatsOutputSchema },
  prompt: `You are an expert grid operator and stability analyst. Your task is to analyze the provided current grid data and forecasts to proactively identify any near-term grid stability threats and suggest mitigation actions.

### Current Grid Status:
{{{currentGridStatus}}}

### Forecast Events:
{{#if forecasts}}
{{#each forecasts}}
- Type: {{{type}}}
  Description: {{{description}}}
  Lead Time: {{{leadTimeMinutes}}} minutes
  Impact Estimate: {{{impactEstimate}}}
{{/each}}
{{else}}
No significant forecast events.
{{/if}}

Based on the above information, identify any potential grid stability threats. For each threat, provide a description, its severity (low, medium, high, critical), and concrete mitigation actions. Finally, provide an overall assessment of the grid's stability.
`,
});

const identifyGridThreatsFlow = ai.defineFlow(
  {
    name: 'identifyGridThreatsFlow',
    inputSchema: IdentifyGridThreatsInputSchema,
    outputSchema: IdentifyGridThreatsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
