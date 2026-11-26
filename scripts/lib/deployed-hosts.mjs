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
export function addressesAnsweredOn(vars = {}, routes) {
  const all = siteHosts(vars);
  if (!Array.isArray(routes) || !routes.length) return all;
  // #wwwcb: siteHosts() invents a www. form for every host. Keep an invented one only when the environment ROUTES it
  // (wrangler.jsonc routes: the deployment itself, not DNS, so a flaky lookup can never hide a real fault). A host
  // configured literally (APP_HOST etc.) is always kept, and a routed www. form still needs its rows.
  const configured = new Set(["APP_HOST", "PUBLIC_HOST", "PLATFORM_HOST"].map((k) => clean(vars[k])).filter(Boolean));
  const routed = new Set(routes.map(clean));
  return all.filter((h) => configured.has(h) || routed.has(h));
}

/** The addresses with no row among `registered` (host strings from shelter_hosts). */
export function missingHosts(addresses, registered) {
  const have = new Set(registered.map(clean));
  return addresses.filter((h) => !have.has(clean(h)));
}

const SPECIAL = /[.+?^${}()|[\]\\]/g;
const globToRegExp = (g) =>
  new RegExp(
    "^" + g.trim().replace(SPECIAL, (c) => "\\" + c).replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*") + "$",
    "i",
  );

/**
 * The addresses whose sign-in callback (https://<host>/auth/callback) no entry of Supabase's `uri_allow_list` admits (#aucbk).
 * `allowList` is the comma-separated string the Management API returns. An exact entry matches, and so does a glob entry
 * (`https://host/**`), because GoTrue treats it as matching. A miss is not refused by Supabase: it substitutes SITE_URL.
 */
export function missingCallbacks(addresses, allowList) {
  const entries = String(allowList ?? "").split(",").map((e) => e.trim()).filter(Boolean).map(globToRegExp);
  return addresses.filter((h) => !entries.some((re) => re.test(`https://${h}/auth/callback`)));
}

/**
 * Which host to flag is_primary for each shelter that has addresses and no primary one (#9l7xf).
 * `rows` = [{shelter_id, key, host, is_primary}] (one per shelter_hosts row of a shelter with a shelter_id).
 * The ONLY evidence the table cannot give, and the deployment can, is the website address: `publicHost`
 * (wrangler.jsonc PUBLIC_HOST). Created_at cannot decide it (production's rows tie to the microsecond), and a
 * www. form must never be chosen. So: a shelter is set only when `publicHost` is one of its own hosts;
 * every other shelter lacking a primary is returned in `undecided`, untouched, for a person to choose.
 */
export function choosePrimaries(rows, publicHost) {
  const want = clean(publicHost);
  const byShelter = new Map();
  for (const r of rows) {
    const s = byShelter.get(r.shelter_id) ?? { key: r.key, hosts: [], primary: false };
    s.hosts.push(clean(r.host));
    if (r.is_primary) s.primary = true;
    byShelter.set(r.shelter_id, s);
  }
  const set = [], undecided = [];
  for (const [shelter_id, s] of byShelter) {
    if (s.primary) continue;
    if (want && s.hosts.includes(want)) set.push({ shelter_id, key: s.key, host: want });
    else undecided.push({ shelter_id, key: s.key, hosts: s.hosts });
  }
  return { set, undecided };
}

/** Google project numbers this deployment knows by name (#gidty). A client id starts with its project number. */
const GOOGLE_PROJECTS = { "559913308840": "CooperJaidee's Google project", "1036347359893": "the shelter's Google project" };

/**
 * A readable name for the Google project a sign-in client id belongs to (#gidty). Never throws: an unknown
 * number is a thing to report, and a missing id says so. Takes the id only, never the secret.
 */
export function googleClientProject(clientId) {
  const id = typeof clientId === "string" ? clientId.trim() : "";
  if (!id) return "no client id set";
  const m = /^(\d+)-/.exec(id);
  if (!m) return "unrecognised client id shape";
  return GOOGLE_PROJECTS[m[1]] ?? `unrecognised project ${m[1]}`;
}
