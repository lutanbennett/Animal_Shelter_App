import assert from "node:assert/strict";
import test from "node:test";
import { pickHolders } from "./lib/live-servers.mjs";

const MINE = "C:\\Development\\Animal_Shelter_App";
const table = [
  { ProcessId: 10, Name: "node.exe", CommandLine: `"node"   "${MINE}\\node_modules\\.bin\\\\..\\next\\dist\\bin\\next" start -p 3100`, ExecutablePath: "C:\\Program Files\\nodejs\\node.exe" },
  { ProcessId: 11, Name: "node.exe", CommandLine: `"C:\\Program Files\\nodejs\\node.exe" ${MINE}\\node_modules\\next\\dist\\server\\lib\\start-server.js`, ExecutablePath: "C:\\Program Files\\nodejs\\node.exe" },
  { ProcessId: 12, Name: "node.exe", CommandLine: `"node" "C:\\Development\\Animal_Shelter_other\\node_modules\\next\\dist\\bin\\next" dev --port 3005`, ExecutablePath: "C:\\Program Files\\nodejs\\node.exe" },
  { ProcessId: 13, Name: "workerd.exe", CommandLine: "workerd serve", ExecutablePath: `${MINE}\\node_modules\\@cloudflare\\workerd-windows-64\\bin\\workerd.exe` },
  { ProcessId: 14, Name: "bash.exe", CommandLine: `bash -c "cd ${MINE}"`, ExecutablePath: "C:\\Program Files\\Git\\usr\\bin\\bash.exe" },
  { ProcessId: 15, Name: "node.exe", CommandLine: `node ${MINE}_Backlog\\node_modules\\x.js`, ExecutablePath: "C:\\Program Files\\nodejs\\node.exe" },
];

test("finds the servers running from this checkout, with the port where the command line has one", () => {
  const got = pickHolders(table, MINE, 999);
  assert.deepEqual(got.map((h) => h.pid), [10, 11, 13]);
  assert.equal(got[0].port, "3100");
  assert.equal(got[1].port, null);
});

test("a neighbouring checkout's server, a shell naming the folder, and a sibling with the same prefix do not count", () => {
  const pids = pickHolders(table, MINE, 999).map((h) => h.pid);
  for (const p of [12, 14, 15]) assert.ok(!pids.includes(p));
});

test("works whichever way the root is spelled, and never reports itself", () => {
  assert.equal(pickHolders(table, "C:/Development/Animal_Shelter_App/", 999).length, 3);
  assert.deepEqual(pickHolders(table, MINE, 10).map((h) => h.pid), [11, 13]);
});
