// Is a process running out of THIS checkout's node_modules? `npm ci` deletes the
// whole tree first, and Windows will not let it unlink a file a running process
// holds open (the SWC binary of a `next dev` / `next start`). The failure left
// the main checkout with 37 entries on 2026-11-05 (docs/decisions/2026-11-05-guarded-install-refuses.md).
//
// The tree lock (tree-lock.mjs) cannot see these: a server only READS the tree,
// so it takes no lock. This is a separate, read-only look at the process table.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const norm = (s) =>
  String(s ?? "")
    .replaceAll("/", "\\")
    .replace(/\\+/g, "\\")
    .replace("\\.bin\\..\\", "\\")
    .toLowerCase();

/** Pure: which rows of a process table run out of `root`'s node_modules? */
export function pickHolders(table, root, selfPid = process.pid) {
  const needle = norm(root).replace(/\\$/, "") + "\\node_modules\\";
  return table
    .filter((p) => p.ProcessId !== selfPid)
    .filter((p) => norm(p.ExecutablePath).startsWith(needle) || (/^node(\.exe)?$/i.test(p.Name ?? "") && norm(p.CommandLine).includes(needle)))
    .map((p) => ({
      pid: p.ProcessId,
      name: p.Name,
      cmd: p.CommandLine ?? "",
      port: /(?:--port[ =]|\s-p\s+)(\d+)/.exec(p.CommandLine ?? "")?.[1] ?? null,
    }));
}

/** The process table, or null when it could not be read (never "empty"). */
export function readProcessTable() {
  const fixture = process.env.LIVE_SERVERS_TABLE_FILE; // lets the failure be rehearsed
  const r = fixture
    ? { status: 0, stdout: readFileSync(fixture, "utf8") }
    : spawnSync(
        "powershell",
        ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Property ProcessId,Name,CommandLine,ExecutablePath | Select-Object ProcessId,Name,CommandLine,ExecutablePath | ConvertTo-Json -Compress"],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
      );
  if (r.status !== 0 || !r.stdout) return null;
  try {
    // eslint-disable-next-line no-control-regex
    return [].concat(JSON.parse(r.stdout.replace(/[\u0000-\u001f\u007f]/g, " ")));
  } catch {
    return null;
  }
}

/** Throws a plain-English message if anything is running from `root`'s node_modules, or if we cannot tell. */
export function refuseIfServerRunning(root) {
  if (process.platform !== "win32") return; // only Windows refuses to unlink an open file
  const table = readProcessTable();
  if (!table) {
    throw new Error(
      "I could not read the list of running programs, so I cannot tell whether a server is using this folder.\n" +
        "  I am stopping rather than guessing: a wrong guess leaves the folder without its packages.\n" +
        "  Close any `next dev` / `next start` window running from it, then try again.",
    );
  }
  const found = pickHolders(table, root);
  if (found.length === 0) return;
  const lines = found.map((h) => `    pid ${h.pid}${h.port ? `, port ${h.port}` : ""}: ${h.cmd.slice(0, 160)}`).join("\n");
  throw new Error(
    `a server is still running from ${root}, so I have NOT touched anything.\n` +
      `  Installing now would delete the packages and then fail, leaving the folder unable to build.\n${lines}\n` +
      `  Stop it, then run this again:  taskkill /F /PID ${found.map((h) => h.pid).join(" /PID ")}`,
  );
}
