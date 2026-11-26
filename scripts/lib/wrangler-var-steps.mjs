// Which release step applies each changed wrangler.jsonc var (#flrwh,
// docs/decisions/2026-11-26-website-lock-order.md). Pure; scripts/check-wrangler-var-steps.mjs does the I/O.
//
// A var in wrangler.jsonc is not only the Worker's. scripts/pi/write-env.mjs copies every
// `where: "pi"`/`"both"` + `source: "wrangler"` var into the Pi's env file at BUILD time, and the Pi
// serves every page, so such a change goes live at the Pi build, before the Worker deploy. 0.49.2
// lifted the PUBLIC_SITE floor that way while the procedure guarded the Worker deploy.

/** { "<env>": { NAME: value } } for the top-level block ("(top)") and every env block. */
export function varsByEnv(config) {
  const out = { "(top)": { ...(config?.vars ?? {}) } };
  for (const [env, block] of Object.entries(config?.env ?? {})) out[env] = { ...(block?.vars ?? {}) };
  return out;
}

/** [{ env, name, before, after }] for every var added, removed or changed. */
export function changedVars(before, after) {
  const a = varsByEnv(before);
  const b = varsByEnv(after);
  const out = [];
  for (const env of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[env] ?? {};
    const y = b[env] ?? {};
    for (const name of new Set([...Object.keys(x), ...Object.keys(y)])) {
      if (JSON.stringify(x[name]) !== JSON.stringify(y[name])) out.push({ env, name, before: x[name], after: y[name] });
    }
  }
  return out;
}

/**
 * The step that makes a var live, read from its runtime-config entry's `where`.
 * "pi-build": the Pi build applies it (write-env.mjs), before the Worker deploy.
 * "both": the Pi build AND the Worker deploy, so the earlier of the two.
 * "worker-deploy": only the Worker deploy (also every var runtime-config does not list:
 * write-env copies only listed names).
 */
export function applyingStep(name, config) {
  const c = config.find((e) => e.name === name);
  if (!c || c.source !== "wrangler") return "worker-deploy";
  if (c.where === "pi") return "pi-build";
  if (c.where === "both") return "both";
  return "worker-deploy";
}
