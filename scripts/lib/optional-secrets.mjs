// Optional run-time values: set when present in the environment's values file,
// harmless when not. One list for both servers, because two lists drifted: the
// Cloudflare pair reached the Worker (scripts/deploy.mjs) but not the Pi
// (scripts/pi/write-env.mjs), so the Pi — which serves the pages — showed the
// visitor count as "Not set up" with both values configured
// (docs/decisions/2026-10-10-one-optional-secrets-list.md).
//
// - BACKUP_DRIVE_FOLDER_ID: where the Weekly backup tile looks (scripts/backup.mjs).
// - ORIGIN_KEY: the Worker sends it to the Pi; the WAF rule checks it
//   (docs/pi-hosting.md). Worker only — see WORKER_ONLY_SECRETS.
// - CLOUDFLARE_ANALYTICS_TOKEN, CLOUDFLARE_ZONE_ID: the visitor count on
//   Settings → System status (src/lib/status/usage.ts), grey until both are set.
export const OPTIONAL_SECRETS = ["BACKUP_DRIVE_FOLDER_ID", "ORIGIN_KEY", "CLOUDFLARE_ANALYTICS_TOKEN", "CLOUDFLARE_ZONE_ID"];

// ORIGIN_KEY is what the Worker attaches on its way to the Pi; the Pi never
// sends or checks it (the WAF does, in front of the tunnel). Its one other
// reader, the Pi origin tile (src/lib/status/health.ts), also needs
// ORIGIN_HOST, which the Pi does not get — so on the Pi it would be a copy of
// a secret that nothing uses.
export const WORKER_ONLY_SECRETS = ["ORIGIN_KEY"];

/** The optional values the Pi's .env.production.local carries. */
export const PI_OPTIONAL_SECRETS = OPTIONAL_SECRETS.filter((k) => !WORKER_ONLY_SECRETS.includes(k));
