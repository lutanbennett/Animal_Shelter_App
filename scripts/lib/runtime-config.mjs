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
//   neverOnPi true: no env file on a Pi may contain it; write-env.mjs and setup.sh
//             refuse to run if one does (scripts/pi/check-no-forbidden.mjs).
//   required  true: deploy / write-env refuse to run without it. false: carried
//             when present in the environment's values file, harmless when not.
//   build     true: `next build` inlines it, so deploy.mjs puts it in the build shell.
//   source    env (default): the environment's values file. wrangler: a var in wrangler.jsonc.
//   own       set when another module owns the value's validation and handling
//             (actions-key.mjs); the generic derivations skip it.
//   routed    "required": a Worker var (source wrangler) that EVERY environment answering on a
//             route must set in wrangler.jsonc, because a Worker consumer needs it on each
//             request; scripts/lib/site-hosts-problems.mjs fails when one lacks it. Absent =
//             the setting is legitimately optional per environment (test and uat set no
//             PLATFORM_HOST, and that is correct).
//   distinct  true: no two environments may share the value (a shared database address points
//             one site at another environment's data). Only meaningful with source wrangler.
//   needs     with routed: what reads it, so the failure message says why it matters.
//   purpose   one line, for people.
export const RUNTIME_CONFIG = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", where: "both", secret: false, scrub: false, required: true, build: true, purpose: "The environment's Supabase project URL; inlined into the build." },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", where: "both", secret: false, scrub: false, required: true, build: true, purpose: "Supabase anon key; inlined into the build." },
  { name: "SUPABASE_SERVICE_ROLE_KEY", where: "both", secret: true, scrub: true, required: true, purpose: "Server-side Supabase key that bypasses row security." },
  { name: "GOOGLE_OAUTH_CLIENT_ID", where: "both", secret: true, scrub: false, required: true, purpose: "Google OAuth client for Drive." },
  { name: "GOOGLE_OAUTH_CLIENT_SECRET", where: "both", secret: true, scrub: true, required: true, purpose: "Google OAuth client secret for Drive." },
  { name: "GOOGLE_OAUTH_REFRESH_TOKEN", where: "both", secret: true, scrub: true, required: true, purpose: "Long-lived Drive token for the shelter's Google account." },
  { name: "DRIVE_CREDENTIALS_KEY", where: "both", secret: true, scrub: true, required: false, purpose: "Base64 of 32 random bytes: decrypts each shelter's own stored Google credentials (shelter_drive_credentials, src/lib/google/drive-credentials-crypto.ts). Needed before any shelter but Lanna is connected; unset, Lanna still uses the GOOGLE_OAUTH_* variables." },
  { name: "GOOGLE_DRIVE_ROOT_FOLDER_ID", where: "both", secret: true, scrub: false, required: true, purpose: "Drive folder the app writes into." },
  { name: "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY", where: "both", secret: false, scrub: false, required: true, own: "scripts/lib/actions-key.mjs", purpose: "One Server Actions key per environment, built into both servers so a form one renders the other accepts." },
  { name: "GOOGLE_CALENDAR_REFRESH_TOKEN", where: "both", secret: true, scrub: true, required: false, purpose: "Its own long-lived token for the shelter calendar (calendar.events scope), apart from the Drive one so a calendar fault never stops photo uploads. Unset: visits are not sent to a calendar." },
  { name: "GOOGLE_CALENDAR_ID", where: "both", secret: true, scrub: false, required: false, purpose: "Which Google calendar vet visits are written to (src/lib/clinics/calendar-sync.ts); a changed value is how the move to the shelter's own account is made." },
  { name: "BACKUP_DRIVE_FOLDER_ID", where: "both", secret: true, scrub: false, required: false, purpose: "Where the Daily backup tile looks (scripts/backup.mjs), when not Backups/ under the root." },
  { name: "PLATFORM_DRIVE_FOLDER_ID", where: "both", secret: true, scrub: false, required: false, purpose: "The one Drive folder platform files live in (the home-screen icon library, scripts/sync-home-icons.mjs), on the platform's own Google account and never under a shelter's root. Unset: sync-home-icons.mjs refuses; there is no fallback to a shelter root (docs/platform-files-registry.json)." },
  { name: "GOOGLE_CONNECT_CLIENT_ID", where: "both", secret: true, scrub: false, required: false, purpose: "The platform's Web OAuth client 'Shelter Drive and Calendar connect' (project cooperjaidee): where a shelter Admin's Connect Google Drive / Calendar buttons in Settings send people (src/app/admin/google/). Unset: the buttons say it is not set up yet." },
  { name: "GOOGLE_CONNECT_CLIENT_SECRET", where: "both", secret: true, scrub: true, required: false, purpose: "Secret of the connect Web client above: swaps a consent code for a token on the server (src/lib/google/shelter-google-connect.ts)." },
  { name: "BACKUP_GOOGLE_OAUTH_CLIENT_ID", where: "both", secret: true, scrub: false, required: false, purpose: "The backup's own Google OAuth client (scripts/backup.mjs), apart from the app's so one dead authorisation cannot stop both photos and backups. Unset: backup.mjs refuses unless --shared-drive-token is passed." },
  { name: "BACKUP_GOOGLE_OAUTH_CLIENT_SECRET", where: "both", secret: true, scrub: true, required: false, purpose: "Secret of the backup's own Google OAuth client." },
  { name: "BACKUP_GOOGLE_OAUTH_REFRESH_TOKEN", where: "both", secret: true, scrub: true, required: false, purpose: "The backup's own long-lived Drive token, minted with google-oauth-setup.mjs --backup." },
  { name: "ORIGIN_KEY", where: "both", secret: true, scrub: true, required: false, purpose: "The Worker sends it to the Pi; the WAF rule and the Pi's app check it (src/lib/origin-key.ts)." },
  { name: "STATUS_READ_TOKEN", where: "both", secret: true, scrub: true, required: false, purpose: "Bearer token for the read-only GET /api/status/health feed Home Assistant polls (src/app/api/status/health/route.ts). Its own secret, rotated alone; never the service-role key. Unset: the feed refuses everyone." },
  { name: "CLOUDFLARE_ANALYTICS_TOKEN", where: "both", secret: true, scrub: true, required: false, purpose: "Visitor count on Settings → System status; grey until the zone id is set too." },
  { name: "CLOUDFLARE_WORKERS_DOMAIN_TOKEN", where: "both", secret: true, scrub: true, required: false, purpose: "Cloudflare API token holding Account → Workers Scripts → Edit only, for attaching and detaching a shelter's own web address to this environment's Worker (PUT/DELETE /accounts/{id}/workers/domains; docs/decisions/2026-11-26-host-attach-trial.md). 'both' because the Pi serves the pages whose actions would call it. Unset: no host can be attached from the app." },
  { name: "CLOUDFLARE_ACCOUNT_ID", where: "both", secret: true, scrub: false, required: false, purpose: "The Cloudflare account the domain attach above is made in. Not a credential (npx.cmd wrangler whoami prints it); kept beside the token so a rebuilt Worker gets both. Unset: no host can be attached from the app." },
  { name: "CLOUDFLARE_ZONE_ID", where: "both", secret: true, scrub: false, required: false, purpose: "Zone the visitor count reads." },
  { name: "ASSISTANT_LLM_PROVIDER", where: "both", secret: true, scrub: false, required: false, purpose: "Which assistant model implementation to use (src/lib/assistant/llm.ts); openai-compatible when unset, which is the only one there is. There is no vendor key anywhere in assistant v2: the model runs on the shelter's own machine (docs/decisions/2026-11-01-drop-anthropic-sdk.md)." },
  { name: "ASSISTANT_LLM_MODEL", where: "both", secret: true, scrub: false, required: false, purpose: "The assistant's model id, in one place so swapping a model is configuration (src/lib/assistant/llm-openai.ts). Unset: the model call is not configured and the keyword assistant carries on." },
  { name: "ASSISTANT_LLM_BASE_URL", where: "pi", secret: false, scrub: false, required: false, purpose: "Address of the self-hosted model server, up to and including /v1 (src/lib/assistant/llm-openai.ts). Used only when ASSISTANT_LLM_PROVIDER is openai-compatible; defaults to Ollama on this machine. Pi only: the Pi makes the model call, on the home network; the Worker, which renders only while the Pi is down, never reaches a home address (docs/decisions/2026-10-30-assistant-local-model-reachable.md)." },
  { name: "ASSISTANT_LLM_TIMEOUT_MS", where: "pi", secret: false, scrub: false, required: false, purpose: "How long to wait for the self-hosted model, in milliseconds (src/lib/assistant/llm-openai.ts); 180000 when unset, because a CPU model is slow to start." },
  { name: "ASSISTANT_LLM_API_KEY", where: "both", secret: true, scrub: true, required: false, purpose: "Optional bearer token for the self-hosted model server (src/lib/assistant/llm-openai.ts); most local servers need none." },
  { name: "PUBLIC_SITE", where: "pi", secret: false, scrub: false, required: false, source: "wrangler", purpose: "Worker var from wrangler.jsonc, copied so the Pi renders what the Worker would (src/lib/public-site.ts)." },
  { name: "APP_HOST", where: "pi", secret: false, scrub: false, required: false, build: false, source: "wrangler", purpose: "The staff app's hostname (src/lib/site-hosts.ts); wrangler.jsonc var, copied so the Pi serves what the Worker would." },
  { name: "PUBLIC_HOST", where: "pi", secret: false, scrub: false, required: false, build: false, source: "wrangler", purpose: "The public website's hostname (src/lib/site-hosts.ts); wrangler.jsonc var, copied to the Pi." },
  { name: "PLATFORM_HOST", where: "pi", secret: false, scrub: false, required: false, build: false, source: "wrangler", purpose: "The platform front door's hostname (src/lib/site-hosts.ts), which maps to no shelter; wrangler.jsonc var, copied to the Pi. Missing here until #plhbd, which is why every button on cooperjaidee.org was refused while every page rendered." },
  { name: "PLATFORM_SEARCH", where: "pi", secret: false, scrub: false, required: false, build: false, source: "wrangler", purpose: "The product site's own search switch (src/lib/public-site.ts isPlatformSearchOpen, #psreg): only the exact word open lets search engines in; absent or anything else is closed. wrangler.jsonc var, copied to the Pi, which renders /platform/about and robots.txt." },
  { name: "SUPABASE_URL", where: "worker", secret: false, scrub: false, required: false, source: "wrangler", routed: "required", distinct: true, needs: "its host lookup (worker/shelter.mjs resolveShelterSite)", purpose: "The environment's Supabase project URL as a Worker run-time var (the Worker cannot read the build-time NEXT_PUBLIC_ one). Without it the host lookup gives up, no shelter header is sent and every sign-in is refused (#uatsb, 2026-11-20). Also read by the translations cron, heartbeat and writer-runs." },
  { name: "LABEL_DRAFT_EMAIL", where: "worker", secret: true, scrub: false, required: false, purpose: "Address of the label drafter's machine login (worker/translations.mjs runLabelDrafts). A secret, not a wrangler.jsonc var: the repository is public and a var is committed in clear. Unset: the drafter does nothing and says so in one log line." },
  { name: "LABEL_DRAFT_PASSWORD", where: "worker", secret: true, scrub: true, required: false, purpose: "Password of that machine login, which holds only the Propose a Thai label card (0296). Unset: the label drafter does nothing." },
  { name: "SUPABASE_ANON_KEY", where: "worker", secret: true, scrub: false, required: false, purpose: "The project's public anon key as a Worker run-time value, for the label drafter's sign-in. NEXT_PUBLIC_SUPABASE_ANON_KEY is inlined into the build and is not a Worker binding, so it cannot serve. Public by design; a secret only so each environment's own value comes from its values file instead of being committed per environment." },
  { name: "SUPABASE_ACCESS_TOKEN", where: "tools", secret: false, scrub: true, required: false, neverOnPi: true, purpose: "Management API token for migrations and deploys." },
  { name: "SUPABASE_DB_URL", where: "tools", secret: false, scrub: true, required: false, purpose: "Session-pooler connection string with the password, for scripts/backup.mjs; set on the Pi so the backup never needs the Management API token." },
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
/** wrangler.jsonc vars the Worker itself needs at run time (any environment). */
export const WORKER_WRANGLER_VARS = names((c) => onWorker(c) && c.source === "wrangler");
/** Worker vars every environment with a route must set: [{ name, distinct, needs }]. */
export const WORKER_ROUTED_VARS = RUNTIME_CONFIG.filter((c) => onWorker(c) && c.source === "wrangler" && c.routed === "required").map((c) => ({ name: c.name, distinct: !!c.distinct, needs: c.needs ?? c.purpose }));
/** Names no env file on a Pi may hold. */
export const PI_FORBIDDEN = names((c) => c.neverOnPi);
/** Names to strip out of status-tile error text. */
export const SCRUB_NAMES = names((c) => c.scrub);

// ---------------------------------------------------------------------------
// Every name, per target, with the reason (docs/decisions/2026-11-23-deploy-secrets-registry.md).
// The lists above answer "what IS pushed". These answer "what is NOT, and why", so a name
// that reaches a machine by no list is a gap the check reports rather than a silence.
// Names and reasons only, never a value.

/**
 * How one name reaches one machine. target: "worker" | "pi".
 * role: secret-required | secret-optional | build-var | wrangler-var | own-module | not-here.
 */
export function classify(c, target) {
  const here = target === "worker" ? onWorker(c) : onPi(c);
  const label = target === "worker" ? "the Worker" : "the Pi";
  if (!here) return { role: "not-here", reason: `read only by ${c.where === "tools" ? "dev-machine scripts" : c.where === "pi" ? "the Pi" : "the Worker"}, never ${label}` };
  if (c.own) return { role: "own-module", reason: `built and checked by ${c.own}, not pushed as a secret` };
  if (c.source === "wrangler") return { role: "wrangler-var", reason: "a var committed in wrangler.jsonc, not a secret" };
  if (target === "worker") {
    if (c.secret) return { role: c.required ? "secret-required" : "secret-optional", reason: c.required ? "required: --secrets refuses without it" : "optional: pushed when set in the values file" };
    return { role: "build-var", reason: "inlined into the build, not a Worker secret" };
  }
  return { role: c.required ? "secret-required" : "secret-optional", reason: c.required ? "required: write-env refuses without it" : "optional: written when set in the values file" };
}

/** [{ name, worker: {role, reason}, pi: {role, reason} }] for every name. */
export const CLASSIFICATION = RUNTIME_CONFIG.map((c) => ({ name: c.name, worker: classify(c, "worker"), pi: classify(c, "pi") }));
/** Names a --secrets deploy never pushes, each with why. */
export const WORKER_NOT_PUSHED = CLASSIFICATION.filter((c) => !c.worker.role.startsWith("secret")).map((c) => ({ name: c.name, reason: c.worker.reason }));
/** Names the Pi's env file never carries as secrets, each with why. */
export const PI_NOT_APPLICABLE = CLASSIFICATION.filter((c) => !c.pi.role.startsWith("secret")).map((c) => ({ name: c.name, reason: c.pi.reason }));

/**
 * Worker `env.X` reads that are in neither this manifest nor wrangler.jsonc: tuning knobs the
 * code defaults when unset. Listed so a NEW read is a gap check-runtime-config reports.
 */
export const WORKER_DEFAULTED_KNOBS = ["TRANSLATE_MODEL", "TRANSLATE_ENGINE", "OLLAMA_URL", "RELEASE_MAIL_SENDER_NAME", "LABEL_DRAFT_BATCH"];

/** Why a Drive-set name resolving from .env.local is deliberate, not a fault (#rqv5c ends it). */
export const DELIBERATE_DEV_FALLTHROUGH = ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"];

// Wrangler's own name for the account id, which is ALSO a runtime secret above (the domain attach). One spelling,
// so scripts/deploy.mjs hands wrangler the same name the manifest registers (check-runtime-config forbids it spelling it).
export const CLOUDFLARE_ACCOUNT_VAR = "CLOUDFLARE_ACCOUNT_ID";
