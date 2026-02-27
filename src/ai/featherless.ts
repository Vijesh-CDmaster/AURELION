/**
 * Featherless AI client — OpenAI-compatible chat completions API.
 * Model: deepseek-ai/DeepSeek-V3-0324
 */

const FEATHERLESS_URL = 'https://api.featherless.ai/v1/chat/completions';
const FEATHERLESS_MODEL = 'deepseek-ai/DeepSeek-V3-0324';

function getApiKey(): string {
  const key = process.env.FEATHERLESS_API_KEY;
  if (!key) throw new Error('FEATHERLESS_API_KEY is not set in environment variables');
  return key;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Send a chat completion request to Featherless AI and return the raw text response.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(FEATHERLESS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: FEATHERLESS_MODEL,
      messages,
      temperature: options?.temperature ?? 0.4,
      max_tokens: options?.maxTokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Featherless API error ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Unexpected Featherless API response shape');
  }
  return content;
}

/**
 * Send a chat completion and parse the response as JSON matching a given shape.
 * Automatically strips markdown code fences if the model wraps its output.
 */
export async function chatCompletionJSON<T>(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const raw = await chatCompletion(messages, options);

  // Strip ```json ... ``` wrappers that LLMs sometimes produce
  const cleaned = raw
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Failed to parse AI JSON response: ${cleaned.slice(0, 300)}`);
  }
}
