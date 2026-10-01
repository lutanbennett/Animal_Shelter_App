// age public-key encryption for database backups (scripts/backup.mjs), and
// the matching decrypt used by scripts/decrypt-backup.mjs.
//
// Why public-key: the machines that write backups (the Pi's cron job, the
// laptop) hold only the recipient's PUBLIC key, so they can produce a backup
// nobody on that machine can read. The private key (AGE-SECRET-KEY-1...) lives
// in the administrator's password manager and is used only to restore.
// Output is standard binary age format: `age -d -i key.txt x.dump.age` reads it.

import { Decrypter, Encrypter } from "age-encryption";

export const ENCRYPTED_SUFFIX = ".dump.age";

/** Tables whose rows are live sessions or one-time tokens: excluded from every dump. */
export const EXCLUDED_AUTH_TABLES = [
  "auth.refresh_tokens",
  "auth.sessions",
  "auth.mfa_*",
  "auth.one_time_tokens",
  "auth.flow_state",
];

/** pg_dump arguments for the exclusions above. */
export function excludeArgs() {
  return EXCLUDED_AUTH_TABLES.map((t) => `--exclude-table=${t}`);
}

/**
 * Recipient public keys from a comma/space-separated string. Refuses anything
 * that is not an `age1...` key, and above all a private key: pasting the wrong
 * half into an .env file must fail loudly rather than be copied to the Pi.
 */
export function parseRecipients(raw) {
  const items = String(raw ?? "").split(/[\s,]+/).filter(Boolean);
  if (items.length === 0) throw new Error("no age recipient given");
  for (const item of items) {
    if (/^AGE-SECRET-KEY/i.test(item)) {
      throw new Error("that is a PRIVATE age key. Only the public key (age1...) belongs on this machine; remove the private one.");
    }
    if (!/^age1[a-z0-9]+$/.test(item)) throw new Error(`"${item.slice(0, 12)}..." is not an age public key (it should start with age1).`);
  }
  return items;
}

/** Encrypt bytes for one or more recipients. Returns the ciphertext bytes. */
export async function encryptBackup(bytes, recipients) {
  const e = new Encrypter();
  for (const r of recipients) e.addRecipient(r);
  return e.encrypt(bytes);
}

/** Decrypt with an `AGE-SECRET-KEY-1...` identity string. */
export async function decryptBackup(bytes, identity) {
  const d = new Decrypter();
  d.addIdentity(identity.trim());
  return d.decrypt(bytes, "uint8array");
}
