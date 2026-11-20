#!/usr/bin/env node
// Fails when a script that writes to Google Drive is not accounted for in docs/platform-files-registry.json (#shfil).
// Reads files only; no network. Part of `npm run lint`. Optional --root <dir> checks another tree (the test does).
import { findProblems, readRegistry } from "./lib/platform-files.mjs";
import { exitWith } from "./lib/exit.mjs";

const i = process.argv.indexOf("--root");
const root = i > -1 ? process.argv[i + 1] : ".";
const problems = findProblems(readRegistry(root), root);
if (problems.length) {
  console.error("NOT CLEAN: platform files registry\n" + problems.map((p) => "  - " + p).join("\n"));
  await exitWith(1);
} else {
  console.log("platform-files: every Drive-writing script is declared in docs/platform-files-registry.json");
  await exitWith(0);
}
