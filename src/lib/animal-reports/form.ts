/**
 * What the public report-an-animal form sends, and the one check the form and the server action run. Pure and
 * client-safe. The database (0372) has the final say; these catch the plain mistakes first.
 */

export const REPORT_KINDS = ["stray", "injured", "welfare", "lost"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];
export const REPORT_SPECIES = ["dog", "cat", "other", "unknown"] as const;
export type ReportSpecies = (typeof REPORT_SPECIES)[number];
export const REPORT_STATUSES = ["new", "in_progress", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const blankToNull = (v: string) => {
  const s = v.trim();
  return s ? s : null;
};

export type ReportFields = {
  kind: string;
  species: string;
  description: string;
  location: string;
  reporterName: string;
  reporterPhone: string;
  reporterEmail: string;
};
export type ReportProblem = "kind" | "species" | "description" | "location" | "contact" | "email" | "tooLong";

export type CleanReport = {
  kind: ReportKind;
  species: ReportSpecies;
  description: string;
  location: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  reporter_email: string | null;
};

export function checkReport(f: ReportFields): { ok: true; report: CleanReport } | { ok: false; problem: ReportProblem } {
  if (!REPORT_KINDS.includes(f.kind as ReportKind)) return { ok: false, problem: "kind" };
  if (!REPORT_SPECIES.includes(f.species as ReportSpecies)) return { ok: false, problem: "species" };
  const description = f.description.trim();
  if (!description) return { ok: false, problem: "description" };
  const location = f.location.trim();
  if (!location) return { ok: false, problem: "location" };
  const name = blankToNull(f.reporterName)?.replace(/\s+/g, " ") ?? null;
  const phone = blankToNull(f.reporterPhone);
  const email = blankToNull(f.reporterEmail);
  if (!phone && !email) return { ok: false, problem: "contact" };
  if (email && !EMAIL.test(email)) return { ok: false, problem: "email" };
  if (description.length > 2000 || location.length > 500 || (name?.length ?? 0) > 120 || (phone?.length ?? 0) > 40 || (email?.length ?? 0) > 200) {
    return { ok: false, problem: "tooLong" };
  }
  return {
    ok: true,
    report: {
      kind: f.kind as ReportKind,
      species: f.species as ReportSpecies,
      description,
      location,
      reporter_name: name,
      reporter_phone: phone,
      reporter_email: email,
    },
  };
}
