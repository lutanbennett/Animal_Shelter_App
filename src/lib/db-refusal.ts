import { databaseFailure, unexpectedFailure, type ActionRefusal } from "@/lib/action-result";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * A database refusal in the reader's language (#3nuwy; shape 1 of
 * docs/decisions/2026-11-03-sql-refusal-english-count.md, built in
 * docs/decisions/2026-11-08-db-refusal-keys-mechanism.md).
 *
 * A converted function raises a stable KEY as its message
 * (`raise exception 'label.not_translatable' using errcode = '22023',
 * detail = json_build_object('table', p_table)::text`). PostgREST hands that
 * back as error.message and error.details. This finds the key in the
 * dictionary's `refusals` block and fills in the parameters from details.
 *
 * Three outcomes, all of them safe:
 *   - a key the dictionary knows: its sentence, in the reader's language;
 *   - something shaped like a key that the dictionary does NOT know: the
 *     generic "something went wrong + reference", with the raw error in the
 *     server log under that reference. A missed key widens to the generic
 *     message; it never shows the key, and never shows a narrower sentence;
 *   - anything else (an unconverted English sentence, a constraint error):
 *     databaseFailure()'s rules, unchanged.
 *
 * EVERY LATER GROUP USES THIS. Call it where a converted rpc's error is
 * handled: `if (error) return dbRefusal("<where>", error, t);` and add the
 * function's keys to `refusals` in en.ts and th.ts.
 * scripts/check-sql-refusal-keys.mjs fails if a raised key has no entry.
 */

/** What a refusal key looks like: dotted lower-case words, at least two parts. Never contains `%` or a space. */
export const REFUSAL_KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;

export type RefusalParams = Record<string, string>;

type DbError = { code?: string; message?: string; details?: string | null };

/** The detail JSON as strings. Anything unreadable is an empty set of parameters, never a throw. */
export function refusalParams(details: string | null | undefined): RefusalParams {
  if (!details) return {};
  try {
    const parsed: unknown = JSON.parse(details);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, v == null ? "" : String(v)]));
  } catch {
    return {};
  }
}

export function dbRefusal(where: string, error: DbError, t: Dictionary): ActionRefusal {
  const message = error.message ?? "";
  if (REFUSAL_KEY.test(message)) {
    const words = t.refusals as Record<string, (p: RefusalParams) => string>;
    if (Object.hasOwn(words, message)) {
      return { ok: false, error: words[message](refusalParams(error.details)) };
    }
    return unexpectedFailure(where, error, t.common.somethingWentWrong);
  }
  return databaseFailure(where, error, {
    alreadyExists: t.common.alreadyExists,
    notAllowed: t.common.notAllowed,
    notAccepted: t.common.notAccepted,
    somethingWentWrong: t.common.somethingWentWrong,
  });
}
