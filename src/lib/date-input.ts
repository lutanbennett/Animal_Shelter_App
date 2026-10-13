// The text a person types into a date box is DD/MM/YYYY; the value the app
// stores and submits is ISO YYYY-MM-DD. These two functions are the only place
// the two meet, so the day/month order is decided here and nowhere else.

/** "13/10/2026" → "2026-10-13"; "" when it is not a real calendar day. */
export function dmyToIso(text: string): string {
  const m = /^\s*(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{4})\s*$/.exec(text);
  if (!m) return "";
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return "";
  return `${m[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "2026-10-13" → "13/10/2026"; "" for anything that is not ISO. */
export function isoToDmy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** Adds the slashes as digits are typed: "1310" → "13/10", "13102026" → "13/10/2026". */
export function autoSlash(text: string): string {
  if (/[^\d/]/.test(text)) return text; // typed separators of another kind are parsed on blur
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (text.endsWith("/") && digits.length < 8 && (digits.length === 2 || digits.length === 4)) return text;
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean);
  return parts.join("/");
}

/** "14:05" → "14:05"; "905" → "09:05"; "" when not a real 24-hour time. */
export function normalizeTime(text: string): string {
  const t = text.trim();
  const m = /^(\d{1,2})[:.]?(\d{2})$/.exec(t);
  if (!m) return "";
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return "";
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}
