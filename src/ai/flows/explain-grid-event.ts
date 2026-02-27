'use server';
/**
 * @fileOverview An AI assistant that analyzes complex grid data and events to provide
 * human-understandable explanations, identify root causes, and suggest proactive measures.
 *
 * - explainGridEvent - A function that handles the grid event explanation process.
 * - ExplainGridEventInput - The input type for the explainGridEvent function.
 * - ExplainGridEventOutput - The return type for the explainGridEvent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainGridEventInputSchema = z.object({
  gridEventDescription: z
    .string()
    .describe(
      'A natural language description of the observed grid event (e.g., "sudden frequency dip", "VPP under-response").'
    ),
  gridTelemetryData: z
    .string()
    .describe(
      'Raw or summarized grid telemetry data pertinent to the event (e.g., frequency logs, power flow, voltage data, timestamped values).'
    ),
  vppResponseLog: z
    .string()
    .describe(
      'Logs detailing the Virtual Power Plant (VPP) actions and responses during the event (e.g., aggregated control signals, dispatch commands).'
    ),
  forecastData: z
    .string()
    .describe(
      'Relevant forecasting data available before or during the event (e.g., solar, wind, load forecasts, cloud shading predictions).'
    ),
});
export type ExplainGridEventInput = z.infer<typeof ExplainGridEventInputSchema>;

const ExplainGridEventOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A comprehensive, human-understandable explanation of the grid event.'),
  rootCause: z.string().describe('A concise identification of the primary root cause of the event.'),
  suggestedActions: z
    .array(z.string())
    .describe('A list of actionable suggestions for grid stability, prevention, or future improvements.'),
});
export type ExplainGridEventOutput = z.infer<typeof ExplainGridEventOutputSchema>;

export async function explainGridEvent(
  input: ExplainGridEventInput
): Promise<ExplainGridEventOutput> {
  return explainGridEventFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainGridEventPrompt',
  input: {schema: ExplainGridEventInputSchema},
  output: {schema: ExplainGridEventOutputSchema},
  prompt: `You are an expert grid operator assistant specializing in power system analysis and Virtual Power Plant (VPP) operations. Your task is to analyze grid events and provide clear, human-understandable explanations, identify root causes, and suggest proactive measures.

Analyze the following information to explain the grid event, determine its root cause, and propose solutions:

Grid Event Description: {{{gridEventDescription}}}

Grid Telemetry Data:
{{{gridTelemetryData}}}

VPP Response Log:
{{{vppResponseLog}}}

Forecast Data:
{{{forecastData}}}

Provide a detailed explanation of what happened, identify the most probable root cause(s), and list concrete, actionable suggestions to improve grid stability or prevent similar events in the future. Focus on clarity and actionable insights.`,
});

const explainGridEventFlow = ai.defineFlow(
  {
    name: 'explainGridEventFlow',
    inputSchema: ExplainGridEventInputSchema,
    outputSchema: ExplainGridEventOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
