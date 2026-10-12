// The one list of run-time configuration. Four hand-kept lists used to say
// which names reach which machine (scripts/deploy.mjs, scripts/lib/optional-secrets.mjs,
// scripts/pi/write-env.mjs, src/lib/status/run.ts) and they drifted: the
// 2026-10-10 visitor-count fault was the Cloudflare pair reaching the Worker
// but not the Pi, which rendered a grey "Not set up" tile
// (docs/decisions/2026-10-10-one-optional-secrets-list.md). Add a name HERE and
// every consumer picks it up; scripts/check-runtime-config.mjs (part of
// `npm run lint`) fails if a consumer keeps a literal copy or .env.example
// disagrees.
//
// Imported by src/lib/status/run.ts too, so this file must stay free of Node
// imports (the Worker bundles it).
//
// Fields
//   name      the environment variable.
//   where     worker | pi | both | tools. The machine that needs the value at run
//             time. `tools` = read only by dev-machine scripts (migrations, backup).
//             `worker` stays a real option though nothing uses it today: ORIGIN_KEY
//             was the last Worker-only value and left when the Pi's app began to
//             check it too (src/lib/origin-key.ts). The next one has a home here.
//   secret    true: uploaded as a Worker secret (`deploy.mjs --secrets`).
//   scrub     true: stripped from status-tile error text (src/lib/status/run.ts).
//   required  true: deploy / write-env refuse to run without it. false: carried
//             when present in the environment's values file, harmless when not.
//   build     true: `next build` inlines it, so deploy.mjs puts it in the build shell.
//   source    env (default): the environment's values file. wrangler: a var in wrangler.jsonc.
//   own       set when another module owns the value's validation and handling
//             (actions-key.mjs); the generic derivations skip it.
//   purpose   one line, for people.
export const RUNTIME_CONFIG = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", where: "both", secret: false, scrub: false, required: true, build: true, purpose: "The environment's Supabase project URL; inlined into the build." },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", where: "both", secret: false, scrub: false, required: true, build: true, purpose: "Supabase anon key; inlined into the build." },
  { name: "SUPABASE_SERVICE_ROLE_KEY", where: "both", secret: true, scrub: true, required: true, purpose: "Server-side Supabase key that bypasses row security." },
  { name: "GOOGLE_OAUTH_CLIENT_ID", where: "both", secret: true, scrub: false, required: true, purpose: "Google OAuth client for Drive." },
  { name: "GOOGLE_OAUTH_CLIENT_SECRET", where: "both", secret: true, scrub: true, required: true, purpose: "Google OAuth client secret for Drive." },
  { name: "GOOGLE_OAUTH_REFRESH_TOKEN", where: "both", secret: true, scrub: true, required: true, purpose: "Long-lived Drive token for the shelter's Google account." },
  { name: "GOOGLE_DRIVE_ROOT_FOLDER_ID", where: "both", secret: true, scrub: false, required: true, purpose: "Drive folder the app writes into." },
  { name: "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY", where: "both", secret: false, scrub: false, required: true, own: "scripts/lib/actions-key.mjs", purpose: "One Server Actions key per environment, built into both servers so a form one renders the other accepts." },
  { name: "BACKUP_DRIVE_FOLDER_ID", where: "both", secret: true, scrub: false, required: false, purpose: "Where the Weekly backup tile looks (scripts/backup.mjs), when not Backups/ under the root." },
  { name: "ORIGIN_KEY", where: "both", secret: true, scrub: true, required: false, purpose: "The Worker sends it to the Pi; the WAF rule and the Pi's app check it (src/lib/origin-key.ts)." },
  { name: "CLOUDFLARE_ANALYTICS_TOKEN", where: "both", secret: true, scrub: true, required: false, purpose: "Visitor count on Settings → System status; grey until the zone id is set too." },
  { name: "CLOUDFLARE_ZONE_ID", where: "both", secret: true, scrub: false, required: false, purpose: "Zone the visitor count reads." },
  { name: "PUBLIC_SITE", where: "pi", secret: false, scrub: false, required: false, source: "wrangler", purpose: "Worker var from wrangler.jsonc, copied so the Pi renders what the Worker would (src/lib/public-site.ts)." },
  { name: "SUPABASE_ACCESS_TOKEN", where: "tools", secret: false, scrub: true, required: false, purpose: "Management API token for migrations and deploys." },
  { name: "SUPABASE_DB_PASSWORD", where: "tools", secret: false, scrub: true, required: false, purpose: "Database password for scripts/backup.mjs." },
  { name: "BACKUP_AGE_RECIPIENT", where: "tools", secret: false, scrub: false, required: false, purpose: "The administrator's age public key; backup.mjs refuses to run without it." },
];

const names = (pred) => RUNTIME_CONFIG.filter(pred).map((c) => c.name);
const onWorker = (c) => c.where === "worker" || c.where === "both";
const onPi = (c) => c.where === "pi" || c.where === "both";
const fromEnv = (c) => (c.source ?? "env") === "env" && !c.own;

/** Inlined by `next build`, so deploy.mjs must have them in the build shell. */
export const WORKER_BUILD_VARS = names((c) => onWorker(c) && c.build && fromEnv(c));
/** Required Worker secrets: `deploy.mjs --secrets` refuses without them. */
export const WORKER_REQUIRED_SECRETS = names((c) => onWorker(c) && c.secret && c.required && fromEnv(c));
/** Optional Worker secrets: pushed when present in the values file. */
export const WORKER_OPTIONAL_SECRETS = names((c) => onWorker(c) && c.secret && !c.required && fromEnv(c));
/** Values the Pi's .env.production.local must have: write-env refuses without them. */
export const PI_REQUIRED = names((c) => onPi(c) && c.required && fromEnv(c));
/** Values the Pi's file carries when present in the values file. */
export const PI_OPTIONAL = names((c) => onPi(c) && !c.required && fromEnv(c));
/** wrangler.jsonc vars the Pi's file copies. */
export const PI_WRANGLER_VARS = names((c) => onPi(c) && c.source === "wrangler");
/** Names to strip out of status-tile error text. */
export const SCRUB_NAMES = names((c) => c.scrub);
