/**
 * Residents a sentence mentions besides the one it is about (docs/decisions/2026-11-04-tags-assistant-notes.md).
 *
 * The model proposes them from its own `lookup`, the card shows them for the person to keep or remove, and only the
 * ones left on the card at Confirm are tagged in the saved note. The sentence is never matched to a resident here:
 * every id is checked against the rows this login can already see. Pure and client-safe.
 */
import type { AssistantResident } from "./data";

/** More than this on one note is a model that is guessing, not a sentence that names them. */
export const MAX_MENTIONS = 5;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids the model offered, reduced to residents this login can see, not the subject, one each, at most MAX_MENTIONS. */
export function cleanMentions(
  raw: unknown,
  subjectId: string | null,
  residents: readonly Pick<AssistantResident, "id">[],
): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(residents.map((r) => r.id.toLowerCase()));
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !UUID.test(item)) continue;
    const id = item.toLowerCase();
    if (id === subjectId?.toLowerCase() || !known.has(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length === MAX_MENTIONS) break;
  }
  return out;
}

/** The saved note: the stamped sentence, then each tagged name as the note boxes write it ("#Billy"). */
export function noteWithTags(stamped: string, names: readonly string[]): string {
  return names.length === 0 ? stamped : `${stamped} ${names.map((n) => `#${n}`).join(" ")}`;
}
