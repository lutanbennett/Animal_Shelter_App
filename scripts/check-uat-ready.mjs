#!/usr/bin/env node
/**
 * Proves UAT's configuration before anyone starts the finalisation list
 * (docs/uat-finalisation.md, step 1). Read-only; a tool to run, not a gate, and wired into nothing.
 *
 *   node scripts/check-uat-ready.mjs
 *
 * Run it in the MAIN checkout (C:\Development\Animal_Shelter_App): worktree.mjs copies only
 * .env.local, so a worktree has no .env.deploy.uat; this then says so and stops.
 *
 * Prints key names, comparisons and verdicts. Never a value, not even truncated.
 * Exit 0 when nothing failed (warnings are reminders), 1 when something failed, and 0 with
 * a plain message when there is no .env.deploy.uat to look at.
 */
import { existsSync, readFileSync } from "node:fs";
import { parseDotEnv, uatReadiness } from "./lib/uat-ready.mjs";
import { exitWith } from "./lib/exit.mjs";

const read = (f) => (existsSync(f) ? parseDotEnv(readFileSync(f, "utf8")) : null);

if (!existsSync(".env.deploy.uat")) {
  console.log("No .env.deploy.uat here, so there is nothing to check. Run this in the main checkout (C:\\Development\\Animal_Shelter_App).");
  await exitWith(0);
} else {
  const findings = uatReadiness({
    uat: read(".env.deploy.uat"),
    production: read(".env.deploy.production"),
    local: read(".env.local"),
    shell: process.env,
  });
  const tag = { ok: "ok  ", warn: "WARN", fail: "FAIL" };
  for (const f of findings) console.log(`${tag[f.level]} ${f.text}`);
  const failed = findings.filter((f) => f.level === "fail").length;
  console.log(failed ? `\nNOT READY: ${failed} failed.` : "\nReady: no failures. Read the warnings once; they are reminders for the Pi.");
  await exitWith(failed ? 1 : 0);
}
