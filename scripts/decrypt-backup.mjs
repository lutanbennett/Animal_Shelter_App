// Decrypt a backup made by scripts/backup.mjs, for a restore or a rehearsal.
//
//   node scripts/decrypt-backup.mjs lannacare-production-<ts>.dump.age --identity C:\path\to\key.txt
//   node scripts/decrypt-backup.mjs <file>.dump.age --identity key.txt --out restore.dump
//
// The identity file is the administrator's PRIVATE age key (the AGE-SECRET-KEY-1...
// line, as `age-keygen -o` writes it). It is read from a file, never from an
// argument or an environment variable, so it does not land in shell history or
// a process listing. Keep that file off the Pi and out of the repo; delete the
// decrypted .dump when the restore is done. The standard tool does the same:
//   age -d -i key.txt -o restore.dump <file>.dump.age

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { decryptBackup, ENCRYPTED_SUFFIX } from "./lib/backup-crypto.mjs";

const args = process.argv.slice(2);
const input = args.find((a, i) => !a.startsWith("--") && !["--identity", "--out"].includes(args[i - 1]));
const identityFile = valueOf("--identity");
const out = valueOf("--out") ?? (input?.endsWith(ENCRYPTED_SUFFIX) ? input.slice(0, -".age".length) : `${input}.dump`);

if (!input || !identityFile) fail("Usage: node scripts/decrypt-backup.mjs <file>.dump.age --identity <private-key-file> [--out <file>]");
if (!existsSync(input)) fail(`${input} not found.`);
if (!existsSync(identityFile)) fail(`${identityFile} not found.`);
if (existsSync(out)) fail(`${out} already exists; not overwriting it.`);

const identity = readFileSync(identityFile, "utf8").split(/\r?\n/).find((l) => l.startsWith("AGE-SECRET-KEY-"));
if (!identity) fail(`${identityFile} has no AGE-SECRET-KEY-1... line.`);

let plain;
try {
  plain = await decryptBackup(readFileSync(input), identity);
} catch (e) {
  fail(`Could not decrypt ${input}: ${e.message} (wrong key, or the file is damaged).`);
}
if (Buffer.from(plain.subarray(0, 5)).toString() !== "PGDMP") fail("Decrypted, but the result is not a pg_dump archive.");
writeFileSync(out, plain, { mode: 0o600 });
console.log(`Wrote ${out} (${(plain.length / 1024 / 1024).toFixed(2)} MB). It is PLAINTEXT: delete it when the restore is done.`);

function valueOf(flag) {
  const i = args.indexOf(flag);
  return i < 0 ? null : args[i + 1];
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
