// Finds the release notes a release range may owe. A PR that cannot honestly tick the test plan's
// "Release notes" line writes `n/a: <why>` (docs/decisions/2026-10-11-release-note-truth-rule.md),
// and when the why is "a step is still open" the note is owed to the PR that closes the step.
// Nothing remembers that, so three notes went missing in a row (0275, 0276, 0279).
// docs/decisions/2026-10-28-release-note-guard.md. Pure functions; git lives in the callers.

// The template's own sentence also contains "`n/a: <why ...>`"; a ticked line carries it verbatim.
const TEMPLATE_ECHO = /If not, `?n\/a: <why[^>]*>`?/gi;
const LABEL = /^\s*[-*]\s*\[[ xX]\]\s*\*\*Release notes\.?\*\*/i;

// Wording of a reason that points at something still to happen. Deliberately generous: a false
// candidate costs a reader one line, a missed one is the fault this exists to stop.
const DEFERRAL =
  /\b(not yet|until|once|outstanding|still (open|needs|to)|manual step|hand[- ]?edit|deploy(ed|ment)?|production|carried|carries|next release|cut pr|the cut|withheld|truth rule|closes?|closing|pending|after the|migration|apply|applied|\d{4}\b)/i;

/** @returns {{ reason: string, deferred: boolean } | null}  null when the plan is ticked or has no such line */
export function releaseNoteAnswer(planText) {
  for (const raw of planText.split(/\r?\n/)) {
    if (!LABEL.test(raw)) continue;
    const body = raw.replace(LABEL, "").replace(TEMPLATE_ECHO, "");
    const m = /n\/a\b:?\s*(.*)$/i.exec(body);
    if (!m) return null;
    const reason = m[1].replace(/^[`\s—-]+|[`\s]+$/g, "").trim();
    if (reason.length < 3) return null;
    return { reason, deferred: DEFERRAL.test(reason) };
  }
  return null;
}

/** plans: [{ file, text }] -> { candidates, others } each [{ file, reason }] */
export function scanPlans(plans) {
  const candidates = [];
  const others = [];
  for (const { file, text } of plans) {
    if (/cut-release-/.test(file)) continue; // a cut's own plan is always `n/a` (release-procedure.md)
    const a = releaseNoteAnswer(text);
    if (!a) continue;
    (a.deferred ? candidates : others).push({ file, reason: a.reason });
  }
  return { candidates, others };
}

export const short = (s, n = 220) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
