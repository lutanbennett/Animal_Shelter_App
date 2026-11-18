import { createAdminClient } from "@/lib/supabase/admin";
import { redactSecrets } from "@/lib/status/run";
import { send, type Skipped } from "@/lib/status/alerts";
import { DriveCredentialsError } from "./drive-credentials-crypto";
import { credentialsFromRow, type DriveCredentialRow } from "./shelter-drive-credentials";

/**
 * Part 9 (#o2iyh): a dying Drive refresh token breaks a shelter's uploads with no sign until someone tries to add a photo.
 * This checks EVERY shelter's own token on the status-alert cron (15 minutes), records the answer in
 * shelter_drive_credentials (token_status, last_checked_at, last_error) and mails THAT shelter's admins once when it goes
 * dead (dead_alerted_at), and once when it recovers. Not a permission; it grants no access.
 *
 * A shelter with no row is not checked here: the fallback shelter's environment credentials are the existing "drive" tile.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";

type Row = DriveCredentialRow & { token_status: string; dead_alerted_at: string | null; last_error: string | null };

export type ShelterTokenResult = { shelterId: string; status: "ok" | "dead" | "unknown"; error: string | null; mailed: string[]; skipped: Skipped[] };

/** Does this credential still mint an access token? "unknown" = Google or the network failed, which is not the token's fault. */
async function probe(row: DriveCredentialRow): Promise<{ status: "ok" | "dead" | "unknown"; error: string | null }> {
  let creds;
  try {
    creds = await credentialsFromRow(row);
  } catch (err) {
    // An incomplete row or an undecryptable value cannot work, whatever Google thinks.
    return { status: "dead", error: err instanceof DriveCredentialsError ? err.message : String(err) };
  }
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: creds.clientId, client_secret: creds.clientSecret, refresh_token: creds.refreshToken, grant_type: "refresh_token" }),
    });
    if (res.ok) return { status: "ok", error: null };
    const body = (await res.json().catch(() => ({}))) as { error?: string; error_description?: string };
    const bad = ["invalid_grant", "invalid_client", "unauthorized_client"].includes(body.error ?? "");
    const why = `${body.error ?? res.status}${body.error_description ? `: ${body.error_description}` : ""}`;
    return { status: bad ? "dead" : "unknown", error: why };
  } catch (err) {
    return { status: "unknown", error: err instanceof Error ? err.message : String(err) };
  }
}

/** Sign-in emails of one shelter's admins (the Admin role is the flag roles.is_admin, 0277). */
async function adminEmailsOf(shelterId: string): Promise<string[]> {
  const db = createAdminClient({ shelterId });
  const { data, error } = await db
    .from("user_roles")
    .select("user_id, roles!inner(is_admin)")
    .eq("shelter_id", shelterId)
    .eq("roles.is_admin", true)
    .is("archived_at", null);
  if (error) throw new Error(`Could not list admins: ${error.message}`);
  const emails = await Promise.all((data ?? []).map(async ({ user_id }) => (await db.auth.admin.getUserById(user_id as string)).data.user?.email ?? null));
  return [...new Set(emails.filter((e): e is string => !!e))];
}

export async function checkShelterDriveTokens(origin: string): Promise<ShelterTokenResult[]> {
  const db = createAdminClient();
  const { data: rows, error } = await db
    .from("shelter_drive_credentials")
    .select("shelter_id, oauth_client_id, oauth_client_secret_enc, refresh_token_enc, token_status, dead_alerted_at, last_error");
  if (error) {
    console.error(`drive-tokens: cannot read the credentials table: ${redactSecrets(error.message)}`);
    return [];
  }
  const out: ShelterTokenResult[] = [];
  for (const row of (rows ?? []) as Row[]) {
    const r: ShelterTokenResult = { shelterId: row.shelter_id, status: "unknown", error: null, mailed: [], skipped: [] };
    const result = await probe(row);
    r.status = result.status;
    r.error = result.error ? redactSecrets(result.error) : null;
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { last_checked_at: now, updated_at: now };
    if (result.status !== "unknown") {
      patch.token_status = result.status;
      patch.last_error = r.error;
    }

    const name = ((await db.from("shelters").select("name").eq("id", row.shelter_id).maybeSingle()).data?.name as string | undefined) ?? "A shelter";
    const settingsUrl = `${origin}/admin`;
    if (result.status === "dead" && !row.dead_alerted_at) {
      const to = await adminEmailsOf(row.shelter_id).catch(() => []);
      const body = `${name}'s Google Drive connection has stopped working, so photo and file uploads will fail until it is reconnected.\n\nGoogle said: ${r.error}\n\nSettings: ${settingsUrl}\nYou get this once when it goes wrong, and once when it works again.`;
      const sent = to.length ? await send({ subject: `${name}: Google Drive is disconnected`, text: body, html: `<p>${body.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>` }, to, origin) : { sent: [], skipped: [], note: null };
      r.mailed = sent.sent;
      r.skipped = sent.skipped;
      if (sent.sent.length) patch.dead_alerted_at = now; // only a mail that reached someone closes the loop
    } else if (result.status === "ok" && row.dead_alerted_at) {
      const to = await adminEmailsOf(row.shelter_id).catch(() => []);
      const body = `${name}'s Google Drive connection is working again.\n\nSettings: ${settingsUrl}`;
      const sent = to.length ? await send({ subject: `${name}: Google Drive is connected again`, text: body, html: `<p>${body.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>` }, to, origin) : { sent: [], skipped: [], note: null };
      r.mailed = sent.sent;
      r.skipped = sent.skipped;
      if (sent.sent.length || !to.length) patch.dead_alerted_at = null;
    }
    const { error: upErr } = await db.from("shelter_drive_credentials").update(patch).eq("shelter_id", row.shelter_id);
    if (upErr) console.error(`drive-tokens: cannot record ${row.shelter_id}: ${redactSecrets(upErr.message)}`);
    out.push(r);
  }
  return out;
}
