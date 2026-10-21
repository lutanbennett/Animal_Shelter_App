/**
 * Donors (the `supporters` table, 0244) and what the form sends to make one.
 * Pure and client-safe: the form and the server action check with the same function.
 */

export type SupporterFields = { name: string; email: string; phone: string; line: string; note: string };

export type SupporterRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  line: string | null;
  note: string | null;
  archived_at: string | null;
};

export const SUPPORTER_COLUMNS = "id, name, email, phone, line, note, archived_at";

export type SupporterProblem = "name" | "email";

type CleanSupporter = { name: string; email: string | null; phone: string | null; line: string | null; note: string | null };

const trimmed = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t ? t : null;
};

export function checkSupporter(f: SupporterFields): { ok: true; supporter: CleanSupporter } | { ok: false; problem: SupporterProblem } {
  const name = trimmed(f.name);
  if (!name) return { ok: false, problem: "name" };
  const email = trimmed(f.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, problem: "email" };
  return { ok: true, supporter: { name, email, phone: trimmed(f.phone), line: trimmed(f.line), note: trimmed(f.note) } };
}
