/**
 * The assistant's one door to a language model (assistant v2, stream 2).
 *
 * Provider-neutral on purpose: nothing in this file names a vendor, and no
 * vendor type may appear in a signature here. `llm-claude.ts` is the Claude
 * implementation; a later stream adds an OpenAI-compatible one (a self-hosted
 * model is the direction) behind the same interface and the same env switch.
 * `scripts/check-llm-vendor-imports.mjs` fails the build if anything outside
 * the adapter files imports a vendor SDK.
 *
 * Environment (read here and in `llm-claude.ts`, nowhere else):
 *   ASSISTANT_LLM_PROVIDER  which implementation; "claude" (default).
 *   ASSISTANT_LLM_MODEL     the model id, in ONE place so swapping is config.
 *   ASSISTANT_LLM_BASE_URL  openai-compatible only: the server's address, up to /v1.
 *   ASSISTANT_LLM_TIMEOUT_MS  openai-compatible only: how long to wait (default 180000).
 *   ASSISTANT_LLM_API_KEY   openai-compatible only, optional.
 *   ANTHROPIC_API_KEY       the Claude implementation's key (a metered one:
 *                           the only paid thing in assistant v2).
 *
 * Spend guard: the adapter caps the OUTPUT of every call (`maxTokens`,
 * default 1024, never above MAX_TOKENS_CEILING whatever the caller asks).
 * A request ceiling per person or per day needs an identity and a clock, so
 * it belongs in the route (stream 3), not here.
 */

export type LlmJsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
};

/** A tool the model may call. `inputSchema` is plain JSON Schema. */
export type LlmToolDef = {
  name: string;
  description: string;
  inputSchema: LlmJsonSchema;
};

export type LlmToolCall = { id: string; name: string; input: Record<string, unknown> };

export type LlmPart =
  | { type: "text"; text: string }
  | { type: "tool_call"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; callId: string; content: string; isError?: boolean };

export type LlmMessage = { role: "user" | "assistant"; content: LlmPart[] };

export type LlmRequest = {
  system?: string;
  messages: LlmMessage[];
  tools?: LlmToolDef[];
  /** Output cap for this call. Clamped to MAX_TOKENS_CEILING. */
  maxTokens?: number;
};

export type LlmStop = "end" | "tool_calls" | "max_tokens" | "refused";

export type LlmResponse = {
  text: string;
  toolCalls: LlmToolCall[];
  stop: LlmStop;
  usage: { inputTokens: number; outputTokens: number };
  /** The model that actually answered, for the audit row. */
  model: string;
};

export type LlmErrorKind =
  | "not_configured"
  | "auth"
  | "rate_limited"
  | "bad_request"
  | "unavailable"
  | "unknown";

/** Every failure an implementation raises, so callers never see a vendor class. */
export class LlmError extends Error {
  readonly kind: LlmErrorKind;
  readonly status: number | null;
  constructor(kind: LlmErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = "LlmError";
    this.kind = kind;
    this.status = status;
  }
}

export interface LlmAdapter {
  readonly provider: string;
  readonly model: string;
  complete(request: LlmRequest): Promise<LlmResponse>;
}

export const DEFAULT_MAX_TOKENS = 1024;
export const MAX_TOKENS_CEILING = 4096;

export function clampMaxTokens(asked: number | undefined): number {
  if (asked === undefined || !Number.isFinite(asked) || asked < 1) return DEFAULT_MAX_TOKENS;
  return Math.min(Math.floor(asked), MAX_TOKENS_CEILING);
}

/** The adapter the environment asks for. Throws LlmError("not_configured") when it cannot build one. */
export async function createLlm(): Promise<LlmAdapter> {
  const provider = (process.env.ASSISTANT_LLM_PROVIDER ?? "claude").trim().toLowerCase();
  if (provider === "claude") {
    const { createClaudeAdapter } = await import("./llm-claude");
    return createClaudeAdapter({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ASSISTANT_LLM_MODEL,
    });
  }
  if (provider === "openai-compatible" || provider === "openai" || provider === "ollama") {
    const { createOpenAiAdapter } = await import("./llm-openai");
    return createOpenAiAdapter({
      baseUrl: process.env.ASSISTANT_LLM_BASE_URL,
      model: process.env.ASSISTANT_LLM_MODEL,
      apiKey: process.env.ASSISTANT_LLM_API_KEY,
      timeoutMs: process.env.ASSISTANT_LLM_TIMEOUT_MS,
    });
  }
  throw new LlmError("not_configured", `ASSISTANT_LLM_PROVIDER "${provider}" is not an implementation this build has.`);
}
