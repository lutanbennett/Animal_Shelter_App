"use server";

import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { loadAssistantContext } from "@/lib/assistant/data";
import { createLlm, LlmError } from "@/lib/assistant/llm";
import { interpretSentence, stepTimeoutMs, type InterpretResult } from "@/lib/assistant/interpret";

/**
 * Assistant v2: ask the model to turn one sentence into a Draft.
 *
 * Runs under the caller's own session and card (`assistant.ask`), loads the
 * rows itself and never sends the model the lists: it reaches them through
 * the `lookup` tool. It writes nothing and it never throws. Every way it can
 * fail comes back as `{ ok: false }`, and the browser then falls back to the
 * keyword parser, so a slow, absent or confused model costs a person nothing
 * but the wait. The confirm card and the write server actions are untouched.
 *
 * Multi-turn (stream 4): `history` is the earlier sentences of this
 * conversation as the browser reports them, and `resume` hands back an
 * exchange that paused on a question, with the person's answer. Neither is
 * trusted: `interpretSentence` checks both against the rows this person can
 * see. Nothing is kept on the server between calls, so there is no memory
 * across conversations: closing the page forgets it.
 *
 * A sentence longer than MAX_REQUEST_CHARS is not sent: it bounds what one
 * turn can spend. A ceiling per person per day needs somewhere to count, and
 * is left for the release that turns a model on (decision file).
 *
 * How long one model step may take is `stepTimeoutMs`, which is where
 * ASSISTANT_LLM_TIMEOUT_MS reaches `interpretSentence` — it had no way to
 * before, so a configured timeout governed only the adapter while the step was
 * capped at a flat number here. A configured value can now shorten a step; it
 * cannot lengthen one past the request budget
 * (docs/decisions/2026-10-31-assistant-model-waits.md).
 */
const MAX_REQUEST_CHARS = 500;

export async function interpretRequest(input: {
  request: string;
  /** The asker's calendar date, YYYY-MM-DD: the server runs in UTC. */
  today: string;
  /** Earlier sentences of this conversation (`HistoryLine[]`), most recent last. */
  history?: unknown;
  /** A paused exchange (`InterpretResume`) and the person's answer to its question. */
  resume?: { state: unknown; answer: unknown };
}): Promise<InterpretResult> {
  try {
    const request = input.request;
    if (!request.trim() || request.length > MAX_REQUEST_CHARS) return { ok: false, reason: "no_draft" };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.today)) return { ok: false, reason: "no_draft" };

    const perms = await loadPermissions();
    if (!perms || !can(perms, "assistant.ask")) return { ok: false, reason: "not_configured" };

    let llm;
    try {
      llm = await createLlm();
    } catch (e) {
      if (e instanceof LlmError) return { ok: false, reason: "not_configured" };
      throw e;
    }

    const supabase = await createClient();
    const context = await loadAssistantContext(supabase, perms);
    if (!context.canAsk) return { ok: false, reason: "not_configured" };

    return await interpretSentence({
      llm,
      request,
      today: input.today,
      canWrite: context.canWrite,
      timeoutMs: stepTimeoutMs(process.env.ASSISTANT_LLM_TIMEOUT_MS),
      // The extra activity a tool declares in its own spec (`needs`), answered
      // from this caller's cards. A tool that asks for one the caller lacks is
      // not in the list the model is given, so it cannot be called at all.
      holds: (activity) => can(perms, activity, "edit"),
      history: input.history,
      resume: input.resume,
      rows: {
        residents: context.residents,
        enclosures: context.enclosures.map((e) => ({ id: e.id, name: e.name, nameTh: e.name_th })),
        zones: context.zones.map((z) => ({ id: z.id, name: z.name, nameTh: z.name_th })),
        clinics: context.clinics,
        carers: context.carers,
        immunizationTypes: context.immunizationTypes,
        medications: context.medications,
      },
    });
  } catch (e) {
    console.error("assistant: the model turn failed —", e);
    return { ok: false, reason: "error" };
  }
}
