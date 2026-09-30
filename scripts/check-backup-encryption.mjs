// Offline check of the backup encryption (DB-1): no database, Drive or private
// key of the shelter's involved. Run: node scripts/check-backup-encryption.mjs
//   - encrypt -> decrypt round trip with a throwaway key, and that the
//     ciphertext neither contains the plaintext nor opens with another key
//   - several recipients each open it; a private key given as recipient is refused
//   - the session tables are excluded from the pg_dump arguments
//   - scripts/backup.mjs no longer writes a plaintext dump or prints the Drive link

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { generateIdentity, identityToRecipient } from "age-encryption";
import { decryptBackup, encryptBackup, ENCRYPTED_SUFFIX, excludeArgs, parseRecipients } from "./lib/backup-crypto.mjs";

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : ` — ${detail}`}`);
  if (!ok) failures++;
};

const keyA = await generateIdentity();
const keyB = await generateIdentity();
const pubA = await identityToRecipient(keyA);
const pubB = await identityToRecipient(keyB);
const plain = Buffer.concat([Buffer.from("PGDMP"), Buffer.from("password-hash-and-totp-secret ".repeat(5000))]);

const cipher = Buffer.from(await encryptBackup(plain, parseRecipients(pubA)));
check("ciphertext is age format", cipher.subarray(0, 21).toString() === "age-encryption.org/v1");
check("ciphertext does not contain the plaintext", !cipher.includes("password-hash-and-totp-secret"));
check("round trip returns identical bytes", Buffer.from(await decryptBackup(cipher, keyA)).equals(plain));
check("a different key cannot decrypt", await decryptBackup(cipher, keyB).then(() => false, () => true));

const both = Buffer.from(await encryptBackup(plain, parseRecipients(`${pubA}, ${pubB}`)));
check("either of two recipients can decrypt", (await decryptBackup(both, keyA)).length === plain.length && (await decryptBackup(both, keyB)).length === plain.length);

check("a private key is refused as recipient", (() => { try { parseRecipients(keyA); return false; } catch { return true; } })());
check("junk is refused as recipient", (() => { try { parseRecipients("hello"); return false; } catch { return true; } })());
check("an empty recipient is refused", (() => { try { parseRecipients(undefined); return false; } catch { return true; } })());

const ex = excludeArgs();
for (const t of ["auth.refresh_tokens", "auth.sessions", "auth.mfa_*"]) check(`pg_dump excludes ${t}`, ex.includes(`--exclude-table=${t}`));

const src = readFileSync(new URL("./backup.mjs", import.meta.url), "utf8");
check("backup.mjs never asks Drive for the web link", !/webViewLink|webContentLink/.test(src.replace(/\/\/.*$/gm, "")));
check("backup.mjs never writes a plaintext dump (--file=)", !src.includes("--file="));
check("dump name is the encrypted one", src.includes("${ENCRYPTED_SUFFIX}") && ENCRYPTED_SUFFIX === ".dump.age");

// Refuses to run with no recipient, before any database is touched.
const r = spawnSync(process.execPath, ["scripts/backup.mjs", "--local", "os-tmp-unused"], { encoding: "utf8", env: { ...process.env, BACKUP_AGE_RECIPIENT: "" } });
check("backup.mjs refuses without a recipient", r.status === 1 && /always encrypted/.test(r.stderr), r.stderr + r.stdout);

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
