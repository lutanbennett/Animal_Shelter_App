/**
 * What the Drive token check concludes when it cannot even build a credential, and what the "dead" mail says (#dalrt).
 * No imports, so a test can load it. Not a permission; it grants no access.
 *
 * Rule: can we tell? No -> "unknown", no mail, log loudly. Is THEIR connection broken? -> mail, plain words, no raw error.
 * A missing or wrong DRIVE_CREDENTIALS_KEY is our fault and says nothing about the token; the next run with the key present
 * answers for real. Only an error that says the shelter's own stored connection is bad (fault "theirs") is mailable.
 */

export type CredentialVerdict = { status: "dead" | "unknown"; error: string };

export function classifyCredentialError(err: unknown): CredentialVerdict {
  const message = err instanceof Error ? err.message : String(err);
  const fault = (err as { fault?: string } | null)?.fault;
  return { status: fault === "theirs" ? "dead" : "unknown", error: message };
}

/** Plain words for a shelter Admin: what happened to them, what to do. The technical reason is logged and shown on the status page, never mailed. */
export function deadAlertBody(name: string, settingsUrl: string): string {
  return `${name}'s Google Drive connection has stopped working, so photo and file uploads will fail until it is reconnected.\n\nTo fix it, open Settings and reconnect your Google account: ${settingsUrl}\n\nYou get this once when it goes wrong, and once when it works again.`;
}
