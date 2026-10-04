/**
 * The resident ID is written "R-0055" (the column default, 0045). People type
 * it with the hyphen dropped or a space in its place — "R0055", "r 0055" — so
 * the list search turns that into the stored form before matching. Anything
 * else (a name, bare digits, a longer fragment) is returned untouched; bare
 * digits already match inside the code. Dry run 2026-10-03, F-13.
 */
export function residentCodeTerm(term: string): string {
  const m = /^r[\s-]*(\d+)$/i.exec(term.trim());
  return m ? `R-${m[1]}` : term;
}
