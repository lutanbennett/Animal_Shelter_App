/**
 * Reading a CSV file (RFC 4180), the counterpart of toCsv() in csv.ts. The app's first import uses it; a residents or
 * donations import would too. Pure and client-safe: it knows nothing about what the columns mean.
 */

export type CsvDecoded = { ok: true; text: string } | { ok: false; reason: "not-utf8" | "utf16" | "empty" };

/**
 * Bytes to text. UTF-8 only: a leading byte-order mark (what Excel adds to "CSV UTF-8") is accepted and stripped, and
 * anything that is not valid UTF-8 (old Thai Windows CP874, Latin-1) or is UTF-16 is refused rather than guessed, because
 * a wrong guess turns Thai names to rubbish.
 */
export function decodeUtf8Csv(bytes: Uint8Array): CsvDecoded {
  if (bytes.length === 0) return { ok: false, reason: "empty" };
  if ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff)) return { ok: false, reason: "utf16" };
  try {
    const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    const stripped = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    return stripped.trim() === "" ? { ok: false, reason: "empty" } : { ok: true, text: stripped };
  } catch {
    return { ok: false, reason: "not-utf8" };
  }
}

export type CsvParsed = { ok: true; rows: string[][] } | { ok: false; reason: "unterminated-quote" };

/** Splits CSV text into rows of fields: quoted fields may hold commas, quotes ("") and line breaks. Blank lines are skipped. */
export function parseCsv(text: string): CsvParsed {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let touched = false; // anything seen on this line, so a blank line is not a row
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"' && field === "") {
      quoted = true;
      touched = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
      touched = true;
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      if (touched) {
        row.push(field);
        rows.push(row);
      }
      row = [];
      field = "";
      touched = false;
    } else {
      field += c;
      touched = true;
    }
  }
  if (quoted) return { ok: false, reason: "unterminated-quote" };
  if (touched) {
    row.push(field);
    rows.push(row);
  }
  return { ok: true, rows };
}
