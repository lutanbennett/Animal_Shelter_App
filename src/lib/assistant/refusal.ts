/**
 * Tells a database refusal apart from a sentence the app wrote. The shared
 * write helpers (recordWeight, moveResidentToEnclosure, …) hand back
 * `{ error: error.message }` for anything they have no wording for, so a
 * policy refusal arrives as Postgres's own text. runWrite() asks this once,
 * for every assistant write, so no tool can show it.
 */
const REFUSED = /row-level security|permission denied|\b42501\b|violates .*polic/i;
const DATABASE_SHAPED =
  /violates (check|unique|foreign)|duplicate key|\bnull value in column\b|\brelation "|\bcolumn "|\b(23\d{3}|PGRST\d+)\b|\bnew row for relation\b/i;

export function databaseText(message: string): "refused" | "other" | null {
  if (REFUSED.test(message)) return "refused";
  if (DATABASE_SHAPED.test(message)) return "other";
  return null;
}
