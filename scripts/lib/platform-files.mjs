// The rule behind docs/platform-files-registry.json, kept import-free so the check and its test share it.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// A script that talks to Google Drive's write side (or opens the Drive client at all).
export const DRIVE_TOUCH = /googleapis\.com\/(upload\/)?drive|google\.drive\(|files\.(create|update|copy)/;

export function scriptFiles(root, dir = "scripts") {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(join(root, d))) {
      const rel = `${d}/${name}`;
      if (statSync(join(root, rel)).isDirectory()) walk(rel);
      else if (/\.(mjs|ts)$/.test(name) && !/\.test\./.test(name)) out.push(rel);
    }
  };
  walk(dir);
  return out;
}

const exists = (root, f) => {
  try { statSync(join(root, f)); return true; } catch { return false; }
};

/** Returns a list of problems; empty means the registry accounts for every Drive-touching script. */
export function findProblems(registry, root) {
  const problems = [];
  const platform = new Map((registry.platformPaths ?? []).map((p) => [p.writer, p]));
  const other = new Set((registry.otherDriveWriters ?? []).map((o) => o.file));
  for (const p of registry.platformPaths ?? []) {
    for (const k of ["path", "writer", "env", "reason"]) if (!p[k]) problems.push(`platformPaths entry ${JSON.stringify(p.path ?? p)} has no ${k}`);
  }
  for (const o of registry.otherDriveWriters ?? []) if (!o.reason) problems.push(`otherDriveWriters ${o.file} has no reason`);
  for (const f of scriptFiles(root)) {
    const text = readFileSync(join(root, f), "utf8");
    if (!DRIVE_TOUCH.test(text)) continue;
    if (!platform.has(f) && !other.has(f)) {
      problems.push(`${f} writes to Google Drive but is in neither platformPaths nor otherDriveWriters of docs/platform-files-registry.json. Declare whether its files are platform files (and where they live) or a shelter's own.`);
    }
  }
  for (const f of [...platform.keys(), ...other]) {
    if (!exists(root, f)) problems.push(`${f} is in the registry but does not exist`);
  }
  // A declared platform writer must not read a shelter's root: that is the fault the registry exists to stop.
  // backup.mjs is the one named residue, recorded in its entry; #shfil does not re-point it.
  for (const [f, p] of platform) {
    if (p.env === "BACKUP_DRIVE_FOLDER_ID" || !exists(root, f)) continue;
    const code = readFileSync(join(root, f), "utf8")
      .split("\n")
      .filter((l) => !/^\s*\/\//.test(l))
      .join("\n");
    if (/env\.GOOGLE_DRIVE_ROOT_FOLDER_ID/.test(code)) problems.push(`${f} is a platform writer but reads GOOGLE_DRIVE_ROOT_FOLDER_ID (a shelter's root)`);
    if (!code.includes(p.env)) problems.push(`${f} is declared to write to ${p.env} but never reads it`);
  }
  return problems;
}

export function readRegistry(root) {
  return JSON.parse(readFileSync(join(root, "docs/platform-files-registry.json"), "utf8"));
}
