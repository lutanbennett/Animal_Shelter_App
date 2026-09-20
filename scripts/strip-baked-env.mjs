// Empties the env-file snapshot that `opennextjs-cloudflare build` writes
// into the Worker bundle, so a deploy never ships the contents of .env.local.
//
// The adapter copies EVERY variable from .env / .env.production / .env.local
// into .open-next/cloudflare/next-env.mjs and the Worker uses them as a
// fallback (`process.env[key] ??= ...`) for anything not set as a Cloudflare
// secret/var. Convenient for `npm run preview`, but for a real deploy it
// means dev credentials — and things like SUPABASE_ACCESS_TOKEN or
// DEV_TEST_USER_PASSWORD that the app never reads — get uploaded to
// Cloudflare. NEXT_PUBLIC_* values are inlined by `next build` separately
// and don't depend on this file.
//
// Runs between build and deploy in `npm run deploy`. After this, every
// runtime secret MUST be set on Cloudflare (`wrangler secret put ...`) or the
// Worker fails loudly at runtime — which is the intended failure mode.
//
// Usage: node scripts/strip-baked-env.mjs
import fs from "node:fs";
import path from "node:path";

const target = path.resolve(".open-next", "cloudflare", "next-env.mjs");

if (!fs.existsSync(target)) {
  console.error(`strip-baked-env: ${target} not found — run the OpenNext build first.`);
  process.exit(1);
}

const before = fs.readFileSync(target, "utf8");
const keys = [...before.matchAll(/"([A-Z0-9_]+)":/g)].map((m) => m[1]);

fs.writeFileSync(
  target,
  "export const production = {};\nexport const development = {};\nexport const test = {};\n",
);

console.log(
  `strip-baked-env: removed ${new Set(keys).size} env var(s) from the Worker bundle` +
    (keys.length ? ` (${[...new Set(keys)].join(", ")})` : ""),
);
