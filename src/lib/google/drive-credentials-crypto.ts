/**
 * Encryption for the Google secrets stored in shelter_drive_credentials (0404). AES-256-GCM through WebCrypto, so it runs
 * the same on the Worker, on Node and in the scripts. The key is DRIVE_CREDENTIALS_KEY (32 random bytes, base64), a Worker
 * secret held outside the database: a dump of the table yields ciphertext only. No imports, so a script or a test can load it.
 *
 * Format: "v1:<iv>:<ciphertext+tag>", both base64. A fresh random 12-byte iv per value.
 */

export class DriveCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DriveCredentialsError";
  }
}

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function importKey(keyB64: string | undefined): Promise<CryptoKey> {
  if (!keyB64) {
    throw new DriveCredentialsError(
      "DRIVE_CREDENTIALS_KEY is not set, so a shelter's stored Google credentials cannot be read or written. Set it as a secret in this environment.",
    );
  }
  let raw: Uint8Array;
  try {
    raw = unb64(keyB64.trim());
  } catch {
    throw new DriveCredentialsError("DRIVE_CREDENTIALS_KEY is not valid base64.");
  }
  if (raw.length !== 32) {
    throw new DriveCredentialsError(`DRIVE_CREDENTIALS_KEY must be 32 bytes (base64 of 32 random bytes); it is ${raw.length}.`);
  }
  return crypto.subtle.importKey("raw", raw as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(plain: string, keyB64: string | undefined = process.env.DRIVE_CREDENTIALS_KEY): Promise<string> {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)));
  return `v1:${b64(iv)}:${b64(ct)}`;
}

export async function decryptSecret(stored: string, keyB64: string | undefined = process.env.DRIVE_CREDENTIALS_KEY): Promise<string> {
  const key = await importKey(keyB64);
  const [v, iv, ct] = stored.split(":");
  if (v !== "v1" || !iv || !ct) throw new DriveCredentialsError("A stored Google credential is not in the expected format.");
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) as BufferSource }, key, unb64(ct) as BufferSource);
    return new TextDecoder().decode(plain);
  } catch {
    throw new DriveCredentialsError("A stored Google credential could not be decrypted: wrong DRIVE_CREDENTIALS_KEY, or the value was altered.");
  }
}
