// Which Cloudflare zones a cache purge covers, for each environment, and which hosts each zone serves.
//
// WHY THIS IS ITS OWN FILE (#cjpzn, 2026-11-27). Production answers on FOUR hosts, in TWO zones:
// lannacareforanimals.org and www. in one, cooperjaidee.org and www. in the other. Until this file the
// purge knew one production zone, so a release purged three of the four hosts it had just deployed
// and said nothing about the fourth. The host list is now written out in full here AND checked against
// wrangler.jsonc's routes (`unmappedHosts`), so a fifth host bound to the Worker fails the check
// instead of going unpurged the same way.
//
// A purge is zone-wide, so every host in a zone is cleared by one call; `hosts` is what the script
// re-checks afterwards and names in its output.

export const PURGE_ZONES = {
  production: [
    { zoneVar: "CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS", hosts: ["lannacareforanimals.org", "www.lannacareforanimals.org"] },
    { zoneVar: "CLOUDFLARE_ZONE_ID_COOPERJAIDEE", hosts: ["cooperjaidee.org", "www.cooperjaidee.org"] },
  ],
  // Test and UAT are ONE zone (lannacare.org). The named environment's host is re-checked first.
  uat: [{ zoneVar: "CLOUDFLARE_ZONE_ID", hosts: ["uat.lannacare.org", "test.lannacare.org", "cooperjaidee-uat.lannacare.org", "cooperjaidee-test.lannacare.org"] }],
  test: [{ zoneVar: "CLOUDFLARE_ZONE_ID", hosts: ["test.lannacare.org", "uat.lannacare.org", "cooperjaidee-test.lannacare.org", "cooperjaidee-uat.lannacare.org"] }],
};

/**
 * The zones to purge, each with its id from `env` or null when its variable is absent.
 * A null zone is SKIPPED LOUDLY by the caller and named as not purged; it is never dropped here.
 */
export function purgeTargets(envName, env) {
  const zones = PURGE_ZONES[envName];
  if (!zones) throw new Error(`no purge zones for environment "${envName}"`);
  return zones.map(({ zoneVar, hosts }) => ({ zoneVar, hosts, zone: env[zoneVar] || null }));
}

/** Hosts the Worker answers on for `envName` that no purge zone covers. Must be empty. */
export function unmappedHosts(envName, routeHostList) {
  const covered = new Set((PURGE_ZONES[envName] ?? []).flatMap((z) => z.hosts));
  return routeHostList.filter((h) => !covered.has(h));
}
