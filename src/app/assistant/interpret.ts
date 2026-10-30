"use server";

import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { loadAssistantContext } from "@/lib/assistant/data";
import { createLlm, LlmError } from "@/lib/assistant/llm";
import { interpretSentence, type InterpretResult } from "@/lib/assistant/interpret";

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
 * A sentence longer than MAX_REQUEST_CHARS is not sent: it bounds what one
 * turn can spend. A ceiling per person per day needs somewhere to count, and
 * is left for the release that turns a model on (decision file).
 */
const MAX_REQUEST_CHARS = 500;

export async function interpretRequest(input: {
  request: string;
  /** The asker's calendar date, YYYY-MM-DD: the server runs in UTC. */
  today: string;
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
      rows: {
        residents: context.residents,
        enclosures: context.enclosures.map((e) => ({ id: e.id, name: e.name, nameTh: e.name_th })),
        clinics: context.clinics,
        carers: context.carers,
        immunizationTypes: context.immunizationTypes,
      },
    });
  } catch (e) {
    console.error("assistant: the model turn failed —", e);
    return { ok: false, reason: "error" };
  }
}
