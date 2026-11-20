// Which addresses an environment answers on, and which of them have no shelter_hosts row (#hostx).
// A host that is deployed but unregistered sends no shelter, 0392's policies then answer nothing, and
// every person is told their own account is missing. Pure functions; scripts/check-deployed-hosts.mjs does the I/O.
import { siteHosts } from "../../src/lib/site-hosts.ts";

const clean = (v) => (typeof v === "string" ? v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "") : "");

/**
 * The addresses this environment answers on: wrangler.jsonc `vars` run through siteHosts(), the function
 * next.config.ts trusts for allowedOrigins, so it includes the www. form of each host and the check cannot disagree
 * with the app. worker/shelter.mjs looks a host up literally, so every one of these needs its own row.
 * Also the list a second assertion (the Supabase redirect allow-list, #aucbk) should loop over.
 */
export function addressesAnsweredOn(vars = {}) {
  return siteHosts(vars);
}

/** The addresses with no row among `registered` (host strings from shelter_hosts). */
export function missingHosts(addresses, registered) {
  const have = new Set(registered.map(clean));
  return addresses.filter((h) => !have.has(clean(h)));
}
