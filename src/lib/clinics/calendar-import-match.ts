import { residentCodeFrom } from "@/lib/tags/links";

/**
 * Reading an event the Director typed into the shelter calendar: "<clinic> - <resident>[, <resident>...]".
 * Pure, so every rule is tested without a database or Google.
 *
 * THE RULE: anything short of exactly one clinic and exactly one live resident per name is NOT guessed.
 * It comes back as "confirm" with the best candidates, for a person to decide. A wrong resident on a
 * clinic visit is a medical record.
 */

export type ClinicRef = { id: string; name: string };
export type ResidentRef = { id: string; name: string; thaiName: string | null; code: string | null; status: string | null };

export type Parsed = { clinicText: string; residentTexts: string[] };

/** Why an event could not be imported on its own. */
export type ConfirmReason =
  | "all_day"
  | "no_time"
  | "no_dash"
  | "no_resident"
  | "unknown_clinic"
  | "ambiguous_clinic"
  | "unknown_resident"
  | "ambiguous_resident"
  | "not_live_resident";

export type ResidentMatch = { text: string; picked: ResidentRef | null; candidates: ResidentRef[]; problem: ConfirmReason | null };

export type Decision =
  | { kind: "import"; clinic: ClinicRef; residents: ResidentRef[] }
  | { kind: "confirm"; reason: ConfirmReason; clinic: ClinicRef | null; clinicCandidates: ClinicRef[]; matches: ResidentMatch[] };

const DASHES = /\s[-–—]\s/;

/** "Novel - Blackie, Mom" → clinic "Novel", residents ["Blackie", "Mom"]. Null when there is no spaced dash. */
export function parseTitle(summary: string | undefined): Parsed | null {
  const s = (summary ?? "").trim();
  const m = DASHES.exec(s);
  if (!m) return null;
  const clinicText = s.slice(0, m.index).trim();
  const residentTexts = s
    .slice(m.index + m[0].length)
    .split(/[,，、]/)
    .map((x) => x.trim())
    .filter(Boolean);
  return { clinicText, residentTexts };
}

/** Lower-case letters and digits only, so "Dr. Novel's" and "dr novels" compare equal. Thai letters are kept. */
export const normalise = (s: string): string => s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

const words = (s: string): string[] => s.normalize("NFKC").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** The clinic a typed name means: its whole name, or one whole word of it ("Novel" for "Novel Vet Clinic"). */
export function matchClinic(text: string, clinics: ClinicRef[]): { picked: ClinicRef | null; candidates: ClinicRef[]; problem: ConfirmReason | null } {
  const n = normalise(text);
  if (!n) return { picked: null, candidates: [], problem: "unknown_clinic" };
  const exact = clinics.filter((c) => normalise(c.name) === n);
  if (exact.length === 1) return { picked: exact[0], candidates: exact, problem: null };
  if (exact.length > 1) return { picked: null, candidates: exact, problem: "ambiguous_clinic" };
  const wanted = words(text);
  const byWord = clinics.filter((c) => {
    const w = words(c.name);
    return wanted.every((x) => w.includes(x));
  });
  if (byWord.length === 1) return { picked: byWord[0], candidates: byWord, problem: null };
  if (byWord.length > 1) return { picked: null, candidates: byWord, problem: "ambiguous_clinic" };
  const near = clinics.filter((c) => withinTypo(normalise(c.name), n) || words(c.name).some((w) => withinTypo(w, n)));
  return { picked: null, candidates: near, problem: "unknown_clinic" };
}

/** One edit apart or less (a dropped, added or changed letter) and long enough that this means something. */
function withinTypo(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  const [long, short] = a.length > b.length ? [a, b] : [b, a];
  return long.slice(i + 1) === short.slice(i);
}

const isLive = (r: ResidentRef) => r.status !== "Deceased" && r.status !== "Adopted";

/** One typed resident: an R-code, or a name / Thai name. A name that fits two live residents is never picked. */
export function matchResident(text: string, residents: ResidentRef[]): ResidentMatch {
  const code = residentCodeFrom(text);
  if (code && /^R-\d+$/i.test(code)) {
    const hit = residents.filter((r) => r.code?.toUpperCase() === code.toUpperCase());
    if (hit.length === 1) return isLive(hit[0]) ? { text, picked: hit[0], candidates: hit, problem: null } : { text, picked: null, candidates: hit, problem: "not_live_resident" };
    return { text, picked: null, candidates: hit, problem: hit.length ? "ambiguous_resident" : "unknown_resident" };
  }
  const n = normalise(text);
  if (!n) return { text, picked: null, candidates: [], problem: "unknown_resident" };
  const named = residents.filter((r) => normalise(r.name) === n || (r.thaiName ? normalise(r.thaiName) === n : false));
  const live = named.filter(isLive);
  if (live.length === 1) return { text, picked: live[0], candidates: live, problem: null };
  if (live.length > 1) return { text, picked: null, candidates: live, problem: "ambiguous_resident" };
  if (named.length > 0) return { text, picked: null, candidates: named, problem: "not_live_resident" };
  const near = residents.filter(isLive).filter((r) => {
    const a = normalise(r.name);
    return withinTypo(a, n) || (n.length >= 3 && (a.startsWith(n) || n.startsWith(a)));
  });
  return { text, picked: null, candidates: near.slice(0, 6), problem: "unknown_resident" };
}

/**
 * What to do with a new event. `hasTime` is false for an all-day event. Clinic and resident problems are
 * both reported, so the confirm list can show everything wrong at once.
 */
export function decideImport(
  event: { summary?: string; hasTime: boolean },
  clinics: ClinicRef[],
  residents: ResidentRef[],
): Decision {
  const none = (reason: ConfirmReason, extra: Partial<Extract<Decision, { kind: "confirm" }>> = {}): Decision => ({
    kind: "confirm",
    reason,
    clinic: null,
    clinicCandidates: [],
    matches: [],
    ...extra,
  });
  if (!event.hasTime) return none("all_day");
  const parsed = parseTitle(event.summary);
  if (!parsed) return none("no_dash");
  const clinic = matchClinic(parsed.clinicText, clinics);
  if (parsed.residentTexts.length === 0) return none("no_resident", { clinic: clinic.picked, clinicCandidates: clinic.candidates });
  const matches = parsed.residentTexts.map((t) => matchResident(t, residents));
  const bad = matches.find((m) => m.problem);
  const reason = clinic.problem ?? bad?.problem ?? null;
  if (reason || !clinic.picked) {
    return { kind: "confirm", reason: reason ?? "unknown_clinic", clinic: clinic.picked, clinicCandidates: clinic.candidates, matches };
  }
  // The same resident named twice would book two visits at one time.
  const ids = new Set(matches.map((m) => m.picked!.id));
  return { kind: "import", clinic: clinic.picked, residents: [...ids].map((id) => matches.find((m) => m.picked!.id === id)!.picked!) };
}

/** The event title the app uses for a visit (calendar-event.ts): "<clinic> - <resident>". */
export const standardTitle = (clinicName: string, residentName: string) => `${clinicName} - ${residentName}`;
