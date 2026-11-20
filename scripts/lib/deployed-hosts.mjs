// Which hosts an environment is deployed on, and which of them have no shelter_hosts row (#hostx).
// A host that is deployed but unregistered sends no shelter, 0392's policies then answer nothing, and
// every person is told their own account is missing. Pure functions; scripts/check-deployed-hosts.mjs does the I/O.

/** APP_HOST and PUBLIC_HOST each map a shelter. PLATFORM_HOST serves the operator console (/platform), which needs no shelter. */
export const SHELTER_HOST_VARS = ["APP_HOST", "PUBLIC_HOST"];

const clean = (v) => (typeof v === "string" ? v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") : "");

/** [{ var, host }] for each shelter-host var that is set for this environment, de-duplicated by host (first var wins). */
export function deployedHosts(vars = {}) {
  const seen = new Set();
  const out = [];
  for (const name of SHELTER_HOST_VARS) {
    const host = clean(vars[name]);
    if (host && !seen.has(host)) {
      seen.add(host);
      out.push({ var: name, host });
    }
  }
  return out;
}

/** The deployed hosts that are not among `registered` (host strings from shelter_hosts). */
export function missingHosts(deployed, registered) {
  const have = new Set(registered.map(clean));
  return deployed.filter((d) => !have.has(d.host));
}
