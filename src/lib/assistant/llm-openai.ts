/**
 * The OpenAI-compatible implementation of the LlmAdapter: the chat-completions
 * shape that Ollama, llama.cpp's server and vLLM all speak. Plain `fetch`, no
 * vendor SDK, so nothing is added to the Worker bundle.
 *
 * Differences from the Claude implementation, handled here and nowhere else:
 *   - tool arguments arrive as a JSON STRING, which a small model often gets
 *     wrong. Unparseable arguments raise LlmError("bad_response") rather than
 *     being guessed at; a parsed value that is not an object does the same.
 *   - there is no thinking block, and the system prompt is a first message.
 *   - stop reasons are finish_reason: stop / tool_calls / length / content_filter.
 *   - not streamed: one JSON reply. Streaming would not shorten a CPU model's
 *     wait for its first word, which is the slow part.
 *   - tool_choice "auto" is sent only when tools are, as in the Claude path.
 *
 * Timeout: a CPU model reads the whole prompt (all the tool definitions)
 * before it says anything, so the default is generous, 180 s, and
 * ASSISTANT_LLM_TIMEOUT_MS overrides it. No retry: a retry of a slow call
 * doubles the wait, and the keyword parser answers meanwhile.
 */
import {
  LlmError,
  clampMaxTokens,
  type LlmAdapter,
  type LlmMessage,
  type LlmRequest,
  type LlmResponse,
  type LlmStop,
} from "./llm";

export const DEFAULT_OPENAI_BASE_URL = "http://localhost:11434/v1";
export const DEFAULT_OPENAI_TIMEOUT_MS = 180_000;

export type OpenAiAdapterOptions = {
  /** Up to and including "/v1". Defaults to Ollama's local address. */
  baseUrl?: string | undefined;
  /** Required: there is no sensible default model to pull on someone's behalf. */
  model: string | undefined;
  /** Most local servers need none. Sent as a Bearer token when set. */
  apiKey?: string | undefined;
  timeoutMs?: number | string | undefined;
  /** The transport. Tests pass a fake. */
  fetch?: typeof fetch;
};

type WireToolCall = { id?: string; type?: string; function?: { name?: string; arguments?: unknown } };
type WireMessage = Record<string, unknown>;

function toWire(system: string | undefined, messages: LlmMessage[]): WireMessage[] {
  const out: WireMessage[] = [];
  if (system) out.push({ role: "system", content: system });
  for (const m of messages) {
    const text = m.content.filter((p) => p.type === "text").map((p) => (p.type === "text" ? p.text : "")).join("\n");
    if (m.role === "assistant") {
      const calls = m.content.flatMap((p) =>
        p.type === "tool_call"
          ? [{ id: p.id, type: "function", function: { name: p.name, arguments: JSON.stringify(p.input) } }]
          : [],
      );
      out.push({ role: "assistant", content: text || null, ...(calls.length ? { tool_calls: calls } : {}) });
      continue;
    }
    // Tool results are their own "tool" messages in this shape; they go first so
    // they follow the assistant message that asked for them.
    for (const p of m.content) {
      if (p.type === "tool_result") {
        out.push({ role: "tool", tool_call_id: p.callId, content: p.isError ? `Error: ${p.content}` : p.content });
      }
    }
    if (text) out.push({ role: "user", content: text });
  }
  return out;
}

function stopOf(reason: unknown, hasCalls: boolean): LlmStop {
  if (reason === "tool_calls" || (hasCalls && reason !== "length")) return "tool_calls";
  if (reason === "length") return "max_tokens";
  if (reason === "content_filter") return "refused";
  return "end";
}

function parseArguments(call: WireToolCall, index: number): Record<string, unknown> {
  const raw = call.function?.arguments;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>; // some servers send an object
  if (typeof raw !== "string" || raw.trim() === "") {
    if (raw === undefined || raw === "") return {};
    throw new LlmError("bad_response", `The model's tool call ${index + 1} had no usable arguments.`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new LlmError("bad_response", `The model's tool call ${index + 1} (${call.function?.name ?? "unnamed"}) was not valid JSON.`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new LlmError("bad_response", `The model's tool call ${index + 1} arguments were not an object.`);
  }
  return parsed as Record<string, unknown>;
}

export function createOpenAiAdapter(opts: OpenAiAdapterOptions): LlmAdapter {
  const model = opts.model?.trim();
  if (!model) {
    throw new LlmError("not_configured", "ASSISTANT_LLM_MODEL is not set; name the model the local server has pulled.");
  }
  const baseUrl = (opts.baseUrl?.trim() || DEFAULT_OPENAI_BASE_URL).replace(/\/+$/, "");
  const asked = Number(opts.timeoutMs);
  const timeoutMs = Number.isFinite(asked) && asked >= 1000 ? Math.floor(asked) : DEFAULT_OPENAI_TIMEOUT_MS;
  const doFetch = opts.fetch ?? fetch;

  return {
    provider: "openai-compatible",
    model,
    async complete(request: LlmRequest): Promise<LlmResponse> {
      const body = {
        model,
        max_tokens: clampMaxTokens(request.maxTokens),
        stream: false,
        messages: toWire(request.system, request.messages),
        ...(request.tools?.length
          ? {
              tools: request.tools.map((t) => ({
                type: "function",
                function: { name: t.name, description: t.description, parameters: t.inputSchema },
              })),
              tool_choice: "auto",
            }
          : {}),
      };
      let res: Response;
      try {
        res = await doFetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(opts.apiKey ? { authorization: `Bearer ${opts.apiKey}` } : {}),
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        if (name === "TimeoutError" || name === "AbortError") {
          throw new LlmError("timeout", `The local model did not answer within ${Math.round(timeoutMs / 1000)} seconds.`);
        }
        throw new LlmError(
          "unavailable",
          `The local model server could not be reached at ${baseUrl}. Is it running? (Ollama: open a terminal and run "ollama serve".)`,
        );
      }
      if (!res.ok) {
        let detail = "";
        try {
          detail = (await res.text()).slice(0, 300);
        } catch {
          /* no body */
        }
        if (res.status === 401 || res.status === 403) throw new LlmError("auth", "The model server refused the key.", res.status);
        if (res.status === 429) throw new LlmError("rate_limited", "The model server is busy.", 429);
        if (res.status === 404) {
          throw new LlmError("bad_request", `The model server does not know "${model}" (or this address). Has it been pulled? ${detail}`.trim(), 404);
        }
        if (res.status >= 500) throw new LlmError("unavailable", `The model server failed. ${detail}`.trim(), res.status);
        throw new LlmError("bad_request", detail || `The model server answered ${res.status}.`, res.status);
      }
      let json: {
        model?: string;
        choices?: { message?: { content?: unknown; tool_calls?: WireToolCall[] }; finish_reason?: unknown }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      try {
        json = await res.json();
      } catch {
        throw new LlmError("bad_response", "The model server's reply was not JSON.");
      }
      const choice = json.choices?.[0];
      if (!choice?.message) throw new LlmError("bad_response", "The model server's reply had no message.");

      const text = typeof choice.message.content === "string" ? choice.message.content : "";
      const toolCalls = (choice.message.tool_calls ?? []).map((c, i) => ({
        id: c.id || `call_${i + 1}`, // some servers omit ids
        name: c.function?.name ?? "",
        input: parseArguments(c, i),
      }));
      if (toolCalls.some((c) => !c.name)) throw new LlmError("bad_response", "The model's tool call had no name.");
      return {
        text,
        toolCalls,
        stop: stopOf(choice.finish_reason, toolCalls.length > 0),
        usage: { inputTokens: json.usage?.prompt_tokens ?? 0, outputTokens: json.usage?.completion_tokens ?? 0 },
        model: json.model || model,
      };
    },
  };
}
