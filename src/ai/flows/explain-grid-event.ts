'use server';
/**
 * @fileOverview Analyzes complex grid data / events to provide human-understandable
 * explanations, identify root causes, and suggest proactive measures.
 *
 * Uses the Featherless AI (OpenAI-compatible) endpoint.
 */

import { chatCompletionJSON } from '@/ai/featherless';

// ────────── Types ──────────

export interface ExplainGridEventInput {
  gridEventDescription: string;
  gridTelemetryData: string;
  vppResponseLog: string;
  forecastData: string;
}

export interface ExplainGridEventOutput {
  explanation: string;
  rootCause: string;
  suggestedActions: string[];
}

// ────────── Flow ──────────

const SYSTEM_PROMPT = `You are an expert grid operator assistant specialising in power system analysis and Virtual Power Plant (VPP) operations. You analyse grid events and provide clear, human-understandable explanations, identify root causes, and suggest proactive measures.

You MUST respond with pure JSON matching this schema (no markdown fences):
{
  "explanation": "<comprehensive explanation>",
  "rootCause": "<primary root cause>",
  "suggestedActions": ["<action1>", "<action2>", ...]
}`;

export async function explainGridEvent(
  input: ExplainGridEventInput
): Promise<ExplainGridEventOutput> {
  const userPrompt = `Analyse the following information to explain the grid event, determine its root cause, and propose solutions.

Grid Event Description: ${input.gridEventDescription}

Grid Telemetry Data:
${input.gridTelemetryData}

VPP Response Log:
${input.vppResponseLog}

Forecast Data:
${input.forecastData}

Provide a detailed explanation of what happened, identify the most probable root cause(s), and list concrete, actionable suggestions to improve grid stability or prevent similar events in the future. Focus on clarity and actionable insights.`;

  return chatCompletionJSON<ExplainGridEventOutput>([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ]);
}
