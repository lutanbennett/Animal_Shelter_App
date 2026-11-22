// Where each value a deploy pushes came from, and which ones came only from the
// dev file. loadEnv() layers shell > .env.deploy.<env> > .env.local, so a name
// missing from the production file silently resolves to the DEV value. That is
// deliberate for the Google Drive set while Drive runs on the dev account, but
// it must be stated, not inherited (docs/decisions/2026-10-14-deploy-secrets-guard.md).
// Names and sources only — never a value.

/** "shell" | the overlay file's name | ".env.local" | null if unset anywhere. */
export function sourceOf(key, { shell, overlay, base }, overlayName) {
  if (shell[key]) return "shell";
  if (overlay[key]) return overlayName;
  if (base[key]) return ".env.local";
  return null;
}

/** [{ name, source }] for each name, in order. */
export function sourcesFor(names, layers, overlayName) {
  return names.map((name) => ({ name, source: sourceOf(name, layers, overlayName) }));
}

/** Names resolved only from .env.local — the dev values. */
export function localOnly(sources) {
  return sources.filter((s) => s.source === ".env.local").map((s) => s.name);
}

export const ALLOW_FLAG = "--allow-dev-fallthrough";

/**
 * The refusal text, or null when nothing fell through. The flag covers ONLY the stated-and-deliberate
 * names (`deliberate`); any other name resolving to the dev file is refused even with the flag, so a
 * --secrets deploy is safe or impossible rather than merely guarded.
 */
export function fallthroughRefusal({ envName, sources, overlayName, allowed, deliberate = [] }) {
  const names = localOnly(sources).filter((n) => !(allowed && deliberate.includes(n)));
  if (!names.length) return null;
  const flagNote = allowed
    ? `
${ALLOW_FLAG} covers only ${deliberate.join(", ")} (stated, deliberate, #rqv5c); it does not cover these.`
    : deliberate.some((n) => names.includes(n))
      ? `
Of these, ${deliberate.join(", ")} may be allowed with ${ALLOW_FLAG} while Drive runs on the dev account; add the rest to ${overlayName}.`
      : "";
  return (
    `${envName} would push ${names.length} secret(s) that exist only in .env.local (the DEV values):
  - ` +
    names.join(`
  - `) +
    `
Add them to ${overlayName}.` + flagNote
  );
}

/**
 * The --secrets plan, one line per name: where it resolves from and why, then every
 * registry name that will NOT be pushed with the reason. Names and sources only.
 * `deliberate` = names whose fall-through to .env.local is stated and owned elsewhere.
 */
export function planLines({ sources, required, notPushed, unsetOptional, deliberate, overlayName }) {
  const lines = sources.map((s) => {
    let why = required.includes(s.name) ? "required" : "optional, set";
    if (s.source === ".env.local") {
      why += deliberate.includes(s.name)
        ? "; DEV value, deliberate while Drive runs on the dev account (#rqv5c ends it)"
        : "; DEV value from .env.local";
    }
    return `  push  ${s.name} <- ${s.source} (${why})`;
  });
  for (const n of unsetOptional) lines.push(`  skip  ${n} (optional, not set in ${overlayName} or .env.local)`);
  for (const n of notPushed) lines.push(`  skip  ${n.name} (${n.reason})`);
  return lines;
}
