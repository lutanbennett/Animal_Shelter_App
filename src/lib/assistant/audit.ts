import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Draft, Intent } from "./types";

/** Mirrors the assistant_action_status enum (0070). */
export type AssistantActionStatus = "confirmed" | "cancelled" | "unmatched";

export type AssistantActionLog = {
  /** Exactly as typed — not trimmed, cased or otherwise tidied (0070). */
  requestText: string;
  /** Null is the row worth reading: the sentence no parser could place. */
  intent: Intent | null;
  draft: Draft | null;
  status: AssistantActionStatus;
  /** 'ok', or the error the action returned, verbatim. */
  result: string | null;
  resultTable?: string | null;
  resultRowId?: string | null;
};

/**
 * Writes one `assistant_actions` row (0070) — the audit trail of what was
 * asked, and the corpus version 2 will be measured against.
 *
 * `user_id` is defaulted by the table to `auth.uid()`, so a row cannot be
 * written in someone else's name; this runs under the caller's session
 * like everything else the assistant does.
 *
 * It never throws and never returns an error. The table records what was
 * asked; it does not get a veto over what was done, and a person who has
 * just moved a resident should not be told the move failed because the
 * log did. A failure is left in the server log to be noticed there.
 */
export async function logAssistantAction(
  supabase: SupabaseClient,
  input: AssistantActionLog,
): Promise<void> {
  const { error } = await supabase.from("assistant_actions").insert({
    request_text: input.requestText,
    intent: input.intent,
    draft: input.draft,
    status: input.status,
    result: input.result,
    result_table: input.resultTable ?? null,
    result_row_id: input.resultRowId ?? null,
  });
  if (error) {
    console.error("assistant: could not write the audit row —", error.message);
  }
}
