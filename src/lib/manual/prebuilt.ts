/**
 * Where the prebuilt full manual lives: one PDF per language, in `.manual-pdf/`
 * under the app's working directory. NOT under public/ (that is served to
 * anyone, and the manual is signed-in only). Written by
 * scripts/build-manual-pdf.mjs at deploy time; read by /manual/pdf, which keeps
 * its own sign-in check. docs/decisions/2026-11-05-manual-pdf-prebuilt.md.
 */
export const PREBUILT_DIR = ".manual-pdf";

export function prebuiltName(locale: string): string {
  // The locale is "en" or "th", but it is used in a file name, so never trust it further.
  return `${locale.replace(/[^a-z-]/gi, "")}.pdf`;
}
