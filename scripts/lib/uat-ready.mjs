// The logic of scripts/check-uat-ready.mjs, kept free of file and process access so
// scripts/check-uat-ready.test.mjs can feed it fixtures. It returns findings and
// never a secret value: every comparison is done here and only its verdict leaves.
import { PI_REQUIRED, PI_FORBIDDEN } from "./runtime-config.mjs";
import { actionsKeyProblem } from "./actions-key.mjs";

export const UAT_PROJECT_REF = "fsjagxmxjosauwmxwype";
// The calendar pair. UAT must have NO calendar: each key must be present with an EMPTY value. A key left
// out of the file is not "off": loadEnv layers .env.deploy.uat over .env.local, so the deploy would push
// .env.local's value (Test's calendar) to the UAT Worker. Found on the 2026-11-08 deploy.
export const CALENDAR_NAMES = ["GOOGLE_CALENDAR_ID", "GOOGLE_CALENDAR_REFRESH_TOKEN"];
// The Drive account's credentials, shared by every environment, so they must equal .env.local's.
export const SHARED_OAUTH_NAMES = ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"];

/** Parse KEY=value lines the way scripts/lib/env.mjs does. */
export function parseDotEnv(text) {
  const out = {};
  for (const line of String(text ?? "").split(/\r?\n/)) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  return out;
}

const set = (v) => typeof v === "string" && v !== "";

/**
 * @param {{uat: object, production: object|null, local: object|null, shell: object}} input
 *   uat = parsed .env.deploy.uat; production = parsed .env.deploy.production (null if absent);
 *   local = parsed .env.local (null if absent); shell = process.env.
 * @returns {{level: "fail"|"warn"|"ok", text: string}[]}
 */
export function uatReadiness({ uat, production, local, shell }) {
  const out = [];
  const add = (level, text) => out.push({ level, text });

  // 1. Required set, read from the one list. The Pi's clone has no .env.local, so nothing falls through.
  const missing = PI_REQUIRED.filter((n) => !set(uat[n]));
  if (missing.length) add("fail", `.env.deploy.uat is missing: ${missing.join(", ")} (the UAT clone on the Pi has no .env.local, so nothing falls through to it)`);
  else add("ok", `every Pi-required key is present (${PI_REQUIRED.length})`);

  const ak = set(uat.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) ? actionsKeyProblem(uat.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) : "not set";
  if (ak) add("fail", `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: ${ak}`);
  else add("ok", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY is usable");

  // 2. Must name UAT's own project.
  const url = uat.NEXT_PUBLIC_SUPABASE_URL;
  if (!set(url)) add("fail", "NEXT_PUBLIC_SUPABASE_URL is not set");
  else {
    let host = "";
    try { host = new URL(url).hostname; } catch { /* reported below */ }
    if (host.split(".")[0] === UAT_PROJECT_REF) add("ok", `NEXT_PUBLIC_SUPABASE_URL names UAT's own project (${UAT_PROJECT_REF})`);
    else add("fail", `NEXT_PUBLIC_SUPABASE_URL does not name ${UAT_PROJECT_REF}: UAT would be pointed at ${host ? `"${host.split(".")[0]}"` : "an unreadable address"}, which is dev or production`);
  }

  // 3. Drive root must be UAT's own.
  const root = uat.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (set(root)) {
    const clash = [["production's file", production?.GOOGLE_DRIVE_ROOT_FOLDER_ID], [".env.local (Test)", local?.GOOGLE_DRIVE_ROOT_FOLDER_ID]]
      .filter(([, v]) => set(v) && v === root).map(([n]) => n);
    if (clash.length) add("fail", `GOOGLE_DRIVE_ROOT_FOLDER_ID is the same as ${clash.join(" and ")}: UAT would write into another environment's Drive tree`);
    else add("ok", "GOOGLE_DRIVE_ROOT_FOLDER_ID differs from production's and Test's" + (production || local ? "" : " (nothing to compare against here)"));
  }

  // 3b. The shared Drive credentials must be the shared ones. On 2026-11-08 the new sign-in client's
  // secret was pasted over GOOGLE_OAUTH_CLIENT_SECRET and every Drive call failed with invalid_client.
  if (local) {
    const differ = SHARED_OAUTH_NAMES.filter((n) => set(local[n]) && set(uat[n]) && uat[n] !== local[n]);
    if (differ.length) add("fail", `${differ.join(", ")} differ${differ.length === 1 ? "s" : ""} from .env.local's: these are the shared Drive account's and must be copied exactly, or Drive fails with invalid_client. (The Supabase sign-in client's secret goes in GOOGLE_SIGNIN_CLIENT_SECRET, never here.)`);
    else add("ok", "the three GOOGLE_OAUTH_* values match .env.local's");
  }

  // 4. UAT has no calendar: both keys present and EMPTY.
  const calSet = CALENDAR_NAMES.filter((n) => set(uat[n]));
  const calMissing = CALENDAR_NAMES.filter((n) => !(n in uat));
  if (calSet.length) add("fail", `${calSet.join(" and ")} must be EMPTY in UAT's file (${calSet.length === 1 ? "it has" : "they have"} a value): UAT must not write vet visits to any calendar, not production's and not Test's`);
  if (calMissing.length) add("fail", `${calMissing.join(" and ")} must be in UAT's file with nothing after the "=". Left out, the deploy takes ${calMissing.length === 1 ? "it" : "them"} from .env.local, which is Test's calendar`);
  if (!calSet.length && !calMissing.length) add("ok", "calendar switched off: both keys present and empty");

  // 5. The Supabase token: here, not on the Pi. Names come from the list, so a rename follows.
  for (const n of PI_FORBIDDEN) {
    if (!set(uat[n])) add("fail", `${n} is absent from this copy of .env.deploy.uat, but UAT's project is in a second Supabase account and migrations cannot reach it without that account's token`);
    else add("warn", `${n} is present here, as it must be. The Pi's copy of .env.deploy.uat must NOT have it: setup-uat.sh refuses to run if it does`);
    if (set(shell[n])) add("warn", `${n} is exported in this shell and beats BOTH files: run UAT commands as "env -u ${n} node ..." and read the project ref the runner prints`);
  }

  // 6. ORIGIN_KEY: same value as production's. Verdict only.
  const ok = uat.ORIGIN_KEY;
  if (!set(ok)) add("fail", "ORIGIN_KEY is not set (it must be the same value as production's: the Worker sends it, the Pi checks it)");
  else if (!production || !set(production.ORIGIN_KEY)) add("warn", "ORIGIN_KEY is set, but there is no production value here to compare it with (run this in the main checkout)");
  else if (ok === production.ORIGIN_KEY) add("ok", "ORIGIN_KEY matches production's");
  else add("fail", "ORIGIN_KEY differs from production's: the Pi would refuse the Worker's requests, or the reverse");

  return out;
}
