import type { Env, AICallOptions, AICallResponse } from '../types';
import { TOOL_SCHEMAS } from '../routes/ai-chat';

// OpenAI API call with function calling support
export async function callOpenAI(env: Env, options: AICallOptions): Promise<AICallResponse> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const model = 'gpt-4o';
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: options.systemPrompt },
      ...options.messages,
    ],
    max_tokens: 2048,
    temperature: 0.7,
  };

  if (options.enableTools && TOOL_SCHEMAS.length > 0) {
    body.tools = TOOL_SCHEMAS;
    body.tool_choice = 'auto';
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{
      message: { content?: string; tool_calls?: AICallResponse['tool_calls'] };
    }>;
    usage?: { total_tokens: number };
  };
  const choice = data.choices?.[0]?.message;

  return {
    content: choice?.content || '',
    tool_calls: choice?.tool_calls,
    tokensUsed: data.usage?.total_tokens,
    model,
    provider: 'openai',
  };
}

// Google Gemini API call
export async function callGemini(env: Env, options: AICallOptions): Promise<AICallResponse> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = 'gemini-pro';
  const contents = options.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    model,
    provider: 'gemini',
  };
}

// Anthropic Claude API call
export async function callAnthropic(env: Env, options: AICallOptions): Promise<AICallResponse> {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const model = 'claude-3-5-sonnet-20241022';
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: options.systemPrompt,
      messages: options.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role === 'tool' ? 'user' : m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };

  return {
    content: data.content?.[0]?.text || '',
    model,
    provider: 'anthropic',
  };
}

// Provider fallback chain: primary -> OpenAI -> Gemini -> Anthropic
export async function callAIWithFallback(
  env: Env,
  options: AICallOptions
): Promise<AICallResponse> {
  const providers: Array<{ name: string; fn: (env: Env, opts: AICallOptions) => Promise<AICallResponse> }> = [
    { name: 'openai', fn: callOpenAI },
    { name: 'gemini', fn: callGemini },
    { name: 'anthropic', fn: callAnthropic },
  ];

  // Reorder based on primary provider preference
  const primary = env.AI_PRIMARY_PROVIDER;
  if (primary && primary !== 'openai') {
    const idx = providers.findIndex((p) => p.name === primary);
    if (idx > 0) {
      const [prov] = providers.splice(idx, 1);
      providers.unshift(prov);
    }
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      const result = await provider.fn(env, options);
      return { ...result, provider: provider.name };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Provider ${provider.name} failed:`, lastError.message);
      continue;
    }
  }

  throw lastError || new Error('All AI providers failed');
}

// Generate embedding using OpenAI
export async function generateQueryEmbedding(env: Env, text: string): Promise<number[] | null> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };
    return data.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}
