/**
 * The Claude implementation of the LlmAdapter. The ONLY file allowed to
 * import the vendor SDK (scripts/check-llm-vendor-imports.mjs).
 *
 * Model: passed in from ASSISTANT_LLM_MODEL, else DEFAULT_CLAUDE_MODEL. Tool
 * choice stays "auto": the current models reject a forced tool_choice with a
 * 400, so the prompt, not the request, steers a call.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  LlmError,
  clampMaxTokens,
  type LlmAdapter,
  type LlmMessage,
  type LlmRequest,
  type LlmResponse,
  type LlmStop,
} from "./llm";

export const DEFAULT_CLAUDE_MODEL = "claude-opus-5-5";

export type ClaudeAdapterOptions = {
  apiKey: string | undefined;
  model?: string | undefined;
  /** The transport. Tests pass a fake; production leaves it to the SDK's own fetch. */
  fetch?: typeof fetch;
};

function toWire(messages: LlmMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content.map((p) => {
      if (p.type === "text") return { type: "text" as const, text: p.text };
      if (p.type === "tool_call") return { type: "tool_use" as const, id: p.id, name: p.name, input: p.input };
      return { type: "tool_result" as const, tool_use_id: p.callId, content: p.content, is_error: p.isError ?? false };
    }),
  }));
}

function stopOf(reason: string | null): LlmStop {
  if (reason === "tool_use") return "tool_calls";
  if (reason === "max_tokens") return "max_tokens";
  if (reason === "refusal") return "refused";
  return "end";
}

function translate(err: unknown): LlmError {
  if (err instanceof LlmError) return err;
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new LlmError("auth", "The model provider refused the key.", err.status ?? null);
  }
  if (err instanceof Anthropic.RateLimitError) return new LlmError("rate_limited", "The model provider is rate limiting.", 429);
  if (err instanceof Anthropic.BadRequestError) return new LlmError("bad_request", err.message, 400);
  if (err instanceof Anthropic.APIConnectionError) return new LlmError("unavailable", "The model provider could not be reached.");
  if (err instanceof Anthropic.APIError) {
    return new LlmError(err.status && err.status >= 500 ? "unavailable" : "unknown", err.message, err.status ?? null);
  }
  return new LlmError("unknown", err instanceof Error ? err.message : "Unknown model error.");
}

export function createClaudeAdapter(opts: ClaudeAdapterOptions): LlmAdapter {
  if (!opts.apiKey) throw new LlmError("not_configured", "ANTHROPIC_API_KEY is not set.");
  const model = opts.model?.trim() || DEFAULT_CLAUDE_MODEL;
  const client = new Anthropic({ apiKey: opts.apiKey, fetch: opts.fetch, maxRetries: 1 });

  return {
    provider: "claude",
    model,
    async complete(request: LlmRequest): Promise<LlmResponse> {
      let res: Anthropic.Message;
      try {
        res = await client.messages.create({
          model,
          max_tokens: clampMaxTokens(request.maxTokens),
          ...(request.system ? { system: request.system } : {}),
          messages: toWire(request.messages),
          ...(request.tools?.length
            ? {
                tools: request.tools.map((t) => ({
                  name: t.name,
                  description: t.description,
                  input_schema: t.inputSchema,
                })),
                tool_choice: { type: "auto" as const },
              }
            : {}),
        });
      } catch (err) {
        throw translate(err);
      }
      let text = "";
      const toolCalls: LlmResponse["toolCalls"] = [];
      for (const block of res.content) {
        if (block.type === "text") text += block.text;
        else if (block.type === "tool_use") {
          const input = block.input && typeof block.input === "object" ? (block.input as Record<string, unknown>) : {};
          toolCalls.push({ id: block.id, name: block.name, input });
        }
      }
      return {
        text,
        toolCalls,
        stop: stopOf(res.stop_reason),
        usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
        model: res.model,
      };
    },
  };
}
