// Optional run-time values: set when present in the environment's values file,
// harmless when not. One list for both servers, because two lists drifted: the
// Cloudflare pair reached the Worker (scripts/deploy.mjs) but not the Pi
// (scripts/pi/write-env.mjs), so the Pi — which serves the pages — showed the
// visitor count as "Not set up" with both values configured
// (docs/decisions/2026-10-10-one-optional-secrets-list.md).
//
// - BACKUP_DRIVE_FOLDER_ID: where the Weekly backup tile looks (scripts/backup.mjs).
// - ORIGIN_KEY: the Worker sends it to the Pi; the WAF rule and the Pi's app
//   (src/proxy.ts) both check it (docs/pi-hosting.md).
// - CLOUDFLARE_ANALYTICS_TOKEN, CLOUDFLARE_ZONE_ID: the visitor count on
//   Settings → System status (src/lib/status/usage.ts), grey until both are set.
export const OPTIONAL_SECRETS = ["BACKUP_DRIVE_FOLDER_ID", "ORIGIN_KEY", "CLOUDFLARE_ANALYTICS_TOKEN", "CLOUDFLARE_ZONE_ID"];

// Secrets only the Worker needs. None now: ORIGIN_KEY left this list because
// the Pi's app checks it too (src/lib/origin-key.ts).
export const WORKER_ONLY_SECRETS = [];

/** The optional values the Pi's .env.production.local carries. */
export const PI_OPTIONAL_SECRETS = OPTIONAL_SECRETS.filter((k) => !WORKER_ONLY_SECRETS.includes(k));
