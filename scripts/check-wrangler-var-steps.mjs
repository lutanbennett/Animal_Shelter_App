#!/usr/bin/env node
/**
 * Names the release step that makes each changed wrangler.jsonc var live (#flrwh).
 *
 *   node scripts/check-wrangler-var-steps.mjs --base <previous release's deployed SHA>
 *
 * Run at release time, before any deploy (docs/release-procedure.md, section 3). A var
 * the Pi reads (runtime-config `where: "pi"`/"both", `source: "wrangler"`) is copied into
 * the Pi's env file by write-env.mjs at the Pi BUILD, and the Pi serves every page, so it
 * goes live at the Pi build, not at the Worker deploy. Any guard a release puts on such a
 * change (a read-back, a confirmation) must come before the first Pi build that carries it.
 *
 * Exit 0: the list was printed (it names steps; it does not judge them). Exit 1: no --base,
 * or a file could not be read. Not in CI: a PR does not know the last deployed SHA.
 * docs/decisions/2026-11-26-website-lock-order.md
 */
import { execFileSync } from "node:child_process";
import { readWranglerConfig } from "./lib/wrangler.mjs";
import { RUNTIME_CONFIG } from "./lib/runtime-config.mjs";
import { changedVars, applyingStep } from "./lib/wrangler-var-steps.mjs";
import { exitWith } from "./lib/exit.mjs";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const i = process.argv.indexOf("--base");
const base = i > 0 ? process.argv[i + 1] : undefined;

const STEP_TEXT = {
  "pi-build": "the Pi BUILD (write-env.mjs) — before the Worker deploy",
  both: "the Pi build AND the Worker deploy — whichever runs first, which is the Pi build",
  "worker-deploy": "the Worker deploy",
};

let code = 0;
if (!base) {
  console.error("check-wrangler-var-steps: give --base <the previous release's deployed SHA> (release-procedure section 2).");
  code = 1;
} else {
  try {
    // execFileSync passes the argument untouched, so Git Bash's path rewriting of `rev:path` does not apply.
    const old = execFileSync("git", ["show", `${base}:wrangler.jsonc`], { encoding: "utf8" });
    const tmp = join(mkdtempSync(join(tmpdir(), "wvs-")), "wrangler.jsonc");
    writeFileSync(tmp, old);
    const changes = changedVars(readWranglerConfig(tmp), readWranglerConfig());
    if (changes.length === 0) {
      console.log(`No wrangler.jsonc var changed since ${base}.`);
    } else {
      console.log(`wrangler.jsonc vars changed since ${base}, and the step that makes each live:`);
      let early = 0;
      for (const c of changes) {
        const step = applyingStep(c.name, RUNTIME_CONFIG);
        if (step !== "worker-deploy") early++;
        console.log(`  ${c.env} ${c.name}: ${JSON.stringify(c.before)} -> ${JSON.stringify(c.after)}  applied at ${STEP_TEXT[step]}`);
      }
      if (early) {
        console.log(`\n${early} change(s) go live at the Pi build. Any read-back or confirmation guarding them must be done`);
        console.log("BEFORE the first Pi build of this release, not before the Worker deploy.");
      }
    }
  } catch (e) {
    console.error(`check-wrangler-var-steps: ${e.message}`);
    code = 1;
  }
}
await exitWith(code);
