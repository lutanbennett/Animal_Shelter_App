#!/usr/bin/env node
// Sends ONE password-reset email from a project's Supabase Auth, to prove its SMTP settings before the
// site it belongs to is live (docs/uat-finalisation.md, Part 4). It is the same request the app's
// "Forgot password?" makes, sent straight to Supabase, so the website does not need to be up.
//
//   node scripts/send-reset-email.mjs <email> [--env uat|test]
//
// Only a project src/lib/app-env.ts calls "dev" or "uat": production's mail is proved on production.
// Prints no key. The mail's link points at the project's Site URL and works once that site is live.
import { loadEnv, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";
import { WRITABLE_APP_ENVS } from "./lib/drive-map.mjs";
import { appEnvForSupabaseUrl } from "../src/lib/app-env.ts";

const argv = process.argv.slice(2);
const i = argv.indexOf("--env");
const envName = i > -1 ? argv[i + 1] : "uat";
const email = argv.find((a, n) => !a.startsWith("--") && argv[n - 1] !== "--env");

async function main() {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Give the email address to send to.");
  if (envName === "production") throw new Error("Refusing --env production.");
  const env = loadEnv(envName);
  const appEnv = appEnvForSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (!WRITABLE_APP_ENVS.has(appEnv)) {
    throw new Error(`Refusing: ${projectRef(env)} is "${appEnv}" by src/lib/app-env.ts. Only dev and uat. Nothing was sent.`);
  }
  const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Supabase ${projectRef(env)}: HTTP ${r.status} ${t.slice(0, 300)}`);
  console.log(`Supabase ${projectRef(env)} (${appEnv}): HTTP ${r.status}, sent. Check the inbox and Resend > Emails.`);
  return 0;
}

await exitWith(await main().catch((e) => { console.error(e.message); return 1; }));
