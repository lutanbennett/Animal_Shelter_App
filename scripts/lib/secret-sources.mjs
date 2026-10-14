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

/** The refusal text, or null when nothing fell through or the operator said so. */
export function fallthroughRefusal({ envName, sources, overlayName, allowed }) {
  const names = localOnly(sources);
  if (!names.length || allowed) return null;
  return (
    `${envName} would push ${names.length} secret(s) that exist only in .env.local (the DEV values):\n  - ` +
    names.join("\n  - ") +
    `\nEither add them to ${overlayName}, or pass ${ALLOW_FLAG} if ${envName} really should use the dev values.`
  );
}
