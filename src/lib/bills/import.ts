import { parseCsv, decodeUtf8Csv } from "@/lib/csv-read";
import { parseBahtAmount } from "@/lib/format";
import { coversMonthDate } from "@/lib/bills/utility";
import { tailoringOf, type BillKind, type KindRoute } from "@/lib/bills/kinds";

/**
 * Bulk bills from a strict templated CSV (docs/decisions/2026-11-12-bill-import-csv.md). Pure and client-safe: the page and the
 * server actions load the shelter's own names and photos and hand them in; this decides, row by row, what is good and why
 * the rest are not. Nothing here is fuzzy: a name is matched exactly or the row is rejected.
 */

/** The template's columns, in the order the downloaded file has them. The file may reorder them, but not add, drop or rename. */
export const BILL_IMPORT_COLUMNS = ["destination", "kind", "place", "account", "amount", "date", "covers_month", "photo_filename"] as const;
type Column = (typeof BILL_IMPORT_COLUMNS)[number];

export const BILL_IMPORT_MAX_ROWS = 500;
export const BILL_IMPORT_MAX_BYTES = 1_000_000;

/** The two destinations this import files. Maintenance, delivery and clinic bills need a parent record and are not covered. */
export type ImportRoute = Extract<KindRoute, "utility" | "general">;

export type ImportPlace = { id: string; name: string };
/** The account's name as typed in the file: the supplier, then a space and the reference when it has one. */
export type ImportAccount = { id: string; label: string; premisesId: string | null };
/** One uploaded photo still waiting in the Bills inbox (attachments with owner_type = bill_inbox). */
export type ImportPhoto = { id: string; fileName: string };

export type ImportCatalogue = {
  kinds: readonly BillKind[];
  places: readonly ImportPlace[];
  accounts: readonly ImportAccount[];
  photos: readonly ImportPhoto[];
  /** Whether this login may file a bill of this destination: the question the destination's own action asks. */
  mayFile: (route: ImportRoute) => boolean;
};

export function accountLabel(supplier: string, ref: string | null): string {
  return ref && ref.trim() ? supplier + " " + ref.trim() : supplier;
}

/** A row that will be written. */
export type GoodRow = {
  line: number;
  route: ImportRoute;
  kindId: string;
  kindLabel: string;
  placeId: string | null;
  placeName: string;
  accountId: string | null;
  accountName: string;
  amount: number;
  date: string;
  coversMonth: string | null;
  photoId: string | null;
  photoName: string;
};

export type RejectCode =
  | "destinationUnknown"
  | "kindMissing"
  | "kindUnknown"
  | "kindArchived"
  | "kindNotHere"
  | "kindWrongDestination"
  | "kindNoPlace"
  | "kindNoAccount"
  | "notAllowed"
  | "placeUnknown"
  | "placeMany"
  | "accountUnknown"
  | "accountMany"
  | "accountElsewhere"
  | "amountMissing"
  | "amountInvalid"
  | "dateInvalid"
  | "monthMissing"
  | "monthInvalid"
  | "monthNotUtility"
  | "photoNone"
  | "photoMany"
  | "photoUsedAbove"
  | "wrongCellCount"
  | "writeFailed";

export type Reject = { line: number; code: RejectCode; detail: string; cells: string[] };

export type FileFault =
  | { code: "notUtf8" | "utf16" | "empty" | "unterminatedQuote" | "tooBig" | "noFile" }
  | { code: "badHeader"; detail: string }
  | { code: "tooManyRows"; detail: string };

export type ImportParsed = { ok: true; good: GoodRow[]; rejects: Reject[]; header: string[]; total: number } | { ok: false; fault: FileFault };

/** "2026-11-11" as a real calendar date, or null. */
export function strictDate(raw: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? raw : null;
}

/** Bytes of an uploaded file to checked rows. A fault here rejects the whole file; a fault in a row rejects only that row. */
export function parseBillImport(bytes: Uint8Array, cat: ImportCatalogue): ImportParsed {
  if (bytes.length > BILL_IMPORT_MAX_BYTES) return { ok: false, fault: { code: "tooBig" } };
  const decoded = decodeUtf8Csv(bytes);
  if (!decoded.ok) return { ok: false, fault: { code: decoded.reason === "not-utf8" ? "notUtf8" : decoded.reason } };
  const parsed = parseCsv(decoded.text);
  if (!parsed.ok) return { ok: false, fault: { code: "unterminatedQuote" } };
  return checkBillRows(parsed.rows, cat);
}

export function checkBillRows(rows: string[][], cat: ImportCatalogue): ImportParsed {
  if (rows.length === 0) return { ok: false, fault: { code: "empty" } };
  const header = rows[0].map((h) => h.trim());
  const wanted: readonly string[] = BILL_IMPORT_COLUMNS;
  const missing = wanted.filter((c) => !header.includes(c));
  const extra = header.filter((h) => !wanted.includes(h));
  const dupes = header.filter((h, i) => header.indexOf(h) !== i);
  if (missing.length || extra.length || dupes.length) {
    const bits = [
      missing.length ? "missing: " + missing.join(", ") : "",
      extra.length ? "not in the template: " + extra.map((e) => e || "(blank)").join(", ") : "",
      dupes.length ? "repeated: " + dupes.join(", ") : "",
    ].filter(Boolean);
    return { ok: false, fault: { code: "badHeader", detail: bits.join("; ") } };
  }
  const body = rows.slice(1);
  if (body.length > BILL_IMPORT_MAX_ROWS) return { ok: false, fault: { code: "tooManyRows", detail: String(BILL_IMPORT_MAX_ROWS) } };

  const at = (cells: string[], c: Column) => (cells[header.indexOf(c)] ?? "").trim();
  const byName = <T,>(items: readonly T[], name: (t: T) => string, want: string) => items.filter((i) => name(i) === want);
  const photoUsed = new Map<string, number>(); // photo id -> the file line that claimed it

  const good: GoodRow[] = [];
  const rejects: Reject[] = [];
  body.forEach((cells, i) => {
    const line = i + 2; // the file's own line number, header being line 1
    const reject = (code: RejectCode, detail = "") => {
      rejects.push({ line, code, detail, cells });
    };
    if (cells.length !== header.length) return reject("wrongCellCount", String(cells.length));

    const dest = at(cells, "destination");
    if (dest !== "utility" && dest !== "general") return reject("destinationUnknown", dest);
    const route: ImportRoute = dest;

    const kindName = at(cells, "kind");
    if (!kindName) return reject("kindMissing");
    const kinds = byName(cat.kinds, (k) => k.label, kindName);
    if (kinds.length === 0) return reject("kindUnknown", kindName);
    const kind = kinds.find((k) => !k.archived);
    if (!kind) return reject("kindArchived", kindName);
    const form = tailoringOf(kind, cat.kinds);
    if (form.route !== "utility" && form.route !== "general") return reject("kindNotHere", kindName);
    if (form.route !== route) return reject("kindWrongDestination", kindName + "|" + form.route);
    // Per-row rights: the activity of THIS row's destination, the one its own action and the database ask.
    if (!cat.mayFile(route)) return reject("notAllowed", route);

    const placeName = at(cells, "place");
    const accountName = at(cells, "account");
    if (placeName && !form.premises) return reject("kindNoPlace", kindName);
    if (accountName && !form.account) return reject("kindNoAccount", kindName);
    let placeId: string | null = null;
    if (placeName) {
      const found = byName(cat.places, (p) => p.name, placeName);
      if (found.length === 0) return reject("placeUnknown", placeName);
      if (found.length > 1) return reject("placeMany", placeName);
      placeId = found[0].id;
    }
    let accountId: string | null = null;
    if (accountName) {
      const found = byName(cat.accounts, (a) => a.label, accountName);
      if (found.length === 0) return reject("accountUnknown", accountName);
      if (found.length > 1) return reject("accountMany", accountName);
      if (placeId && found[0].premisesId && found[0].premisesId !== placeId) return reject("accountElsewhere", accountName);
      accountId = found[0].id;
    }

    const rawAmount = at(cells, "amount");
    if (!rawAmount) return reject("amountMissing");
    const amount = /^\d+(\.\d{1,2})?$/.test(rawAmount) ? parseBahtAmount(rawAmount) : { ok: false as const };
    if (!amount.ok || amount.value == null) return reject("amountInvalid", rawAmount);

    const date = strictDate(at(cells, "date"));
    if (!date) return reject("dateInvalid", at(cells, "date"));

    const rawMonth = at(cells, "covers_month");
    let coversMonth: string | null = null;
    if (route === "utility") {
      if (!rawMonth) return reject("monthMissing");
      // Only "2026-11"; coversMonthDate also takes a full day, which the template does not.
      coversMonth = /^\d{4}-\d{2}$/.test(rawMonth) ? coversMonthDate(rawMonth) : null;
      if (!coversMonth) return reject("monthInvalid", rawMonth);
    } else if (rawMonth) return reject("monthNotUtility", rawMonth);

    const photoName = at(cells, "photo_filename");
    let photoId: string | null = null;
    if (photoName) {
      const found = cat.photos.filter((p) => p.fileName === photoName);
      if (found.length === 0) return reject("photoNone", photoName);
      if (found.length > 1) return reject("photoMany", photoName);
      const claimed = photoUsed.get(found[0].id);
      if (claimed) return reject("photoUsedAbove", photoName + "|" + claimed);
      photoId = found[0].id;
    }

    if (photoId) photoUsed.set(photoId, line);
    good.push({ line, route, kindId: kind.id, kindLabel: kind.label, placeId, placeName, accountId, accountName, amount: amount.value, date, coversMonth, photoId, photoName });
  });
  return { ok: true, good, rejects, header, total: body.length };
}

/** The rejected rows as CSV rows: the file's own line number, its columns, then why. */
export function rejectsAsRows(header: string[], rejects: Reject[], reason: (r: Reject) => string, reasonHeading: string, lineHeading: string): string[][] {
  return [[lineHeading, ...header, reasonHeading], ...rejects.map((r) => [String(r.line), ...header.map((_, i) => r.cells[i] ?? ""), reason(r)])];
}

/** The template: the columns and two worked examples from the shelter's own names (or blanks when it has none yet). */
export function templateRows(cat: Pick<ImportCatalogue, "kinds" | "places">): string[][] {
  const util = cat.kinds.find((k) => !k.archived && tailoringOf(k, cat.kinds).route === "utility");
  const gen = cat.kinds.find((k) => !k.archived && tailoringOf(k, cat.kinds).route === "general");
  const place = cat.places[0]?.name ?? "";
  return [
    [...BILL_IMPORT_COLUMNS],
    ["utility", util?.label ?? "", place, "", "4820.50", "2026-11-03", "2026-10", "IMG_0412.jpg"],
    ["general", gen?.label ?? "", place, "", "640.00", "2026-11-06", "", ""],
  ];
}
