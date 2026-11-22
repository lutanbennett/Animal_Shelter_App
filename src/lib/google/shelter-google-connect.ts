import { createAdminClient } from "@/lib/supabase/admin";
import { actingShelterId } from "@/lib/supabase/acting-shelter";
import { encryptSecret } from "./drive-credentials-crypto";
import { stageConsent } from "./shelter-drive-decide";
import { folderNameFor, missingScopes, type ConnectKind, type ConnectOutcome } from "./shelter-google-connect-decide";
// The same checks the connect scripts make, called as they stand (not copied): validate the shape, prove it against Google
// BEFORE anything is stored, and refuse the fallback shelter's own calendar.
import { validateInputs as validateDrive, verifyWithGoogle as verifyDrive } from "../../../scripts/lib/connect-shelter-drive.mjs";
import { validateInputs as validateCalendar, verifyWithGoogle as verifyCalendar, refuseFallbackCalendar } from "../../../scripts/lib/connect-shelter-calendar.mjs";

/**
 * Finishes a shelter's own Google connection (#drvcl): swaps the consent code for a token, proves it, and stores it encrypted on the
 * shelter being served. Writes shelter_drive_credentials / shelter_calendar_credentials, which no login can touch (0404, 0409), so
 * it uses the service role. THE CALLER MUST HAVE CHECKED perms.isAdmin: nothing here decides who may connect. It acts only on the
 * shelter the request is for (actingShelterId), never one a caller names. Not a permission; it grants no access to anyone.
 */

/** The platform's Web client "Shelter Drive and Calendar connect"; the variable names are registered in runtime-config.mjs. */
export function connectClient(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CONNECT_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CONNECT_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

type TokenReply = { access_token?: string; refresh_token?: string; scope?: string; error?: string };

async function exchange(code: string, origin: string, c: { clientId: string; clientSecret: string }): Promise<TokenReply & { ok: boolean }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: c.clientId, client_secret: c.clientSecret, redirect_uri: `${origin}/admin/google/callback`, grant_type: "authorization_code" }),
  });
  const body = (await res.json().catch(() => ({}))) as TokenReply;
  return { ...body, ok: res.ok };
}

export async function completeConnect(kind: ConnectKind, code: string, origin: string): Promise<ConnectOutcome> {
  const c = connectClient();
  if (!c) return { ok: false, reason: "not_set_up" };
  if (!process.env.DRIVE_CREDENTIALS_KEY) return { ok: false, reason: "no_key" };
  const shelterId = await actingShelterId();
  if (!shelterId) return { ok: false, reason: "store" };

  const tok = await exchange(code, origin, c);
  if (!tok.ok || !tok.access_token) {
    console.error(`google connect: code exchange refused (${tok.error ?? "no reason"})`);
    return { ok: false, reason: "google" };
  }
  if (missingScopes(kind, tok.scope).length) return { ok: false, reason: "scopes" };
  if (!tok.refresh_token) return { ok: false, reason: "no_refresh_token" };

  const db = createAdminClient({ shelterId });
  const { data: shelter } = await db.from("shelters").select("key, name, drive_root_folder_id").eq("id", shelterId).maybeSingle();
  if (!shelter) return { ok: false, reason: "store" };
  const shelterKey = shelter.key as string;
  const base = { clientId: c.clientId, clientSecret: c.clientSecret, refreshToken: tok.refresh_token };
  const auth = { Authorization: `Bearer ${tok.access_token}` };
  const now = new Date().toISOString();

  try {
    if (kind === "drive") {
      const { data: existing } = await db.from("shelter_drive_credentials").select("shelter_id, staged").eq("shelter_id", shelterId).maybeSingle();
      // A row that is already staged stays staged on a reconnect: the move has not happened, so the folder must not be repointed either.
      if (existing?.staged || stageConsent(!!existing, shelterKey)) {
        // The shelter already has files in the environment's account. Prove the token, store it STAGED, and touch nothing else: no folder is
        // made and drive_root_folder_id is not changed (that would repoint every read at an account that cannot see the files).
        // scripts/drive-move-to-shelter-account.mjs copies the files, remaps the ids and makes this row live in one statement (#rqv5c).
        const who = await fetch("https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)", { headers: auth });
        const email = ((await who.json().catch(() => ({}))) as { user?: { emailAddress?: string } }).user?.emailAddress;
        if (!who.ok || !email) return { ok: false, reason: "google" };
        const st = await db.from("shelter_drive_credentials").upsert({
          shelter_id: shelterId, oauth_client_id: c.clientId, oauth_client_secret_enc: await encryptSecret(c.clientSecret), refresh_token_enc: await encryptSecret(tok.refresh_token),
          drive_account_email: email, token_status: "ok", last_checked_at: now, last_error: null, dead_alerted_at: null, updated_at: now, staged: true,
        }, { onConflict: "shelter_id" });
        return st.error ? { ok: false, reason: "store" } : { ok: true, staged: true };
      }
      // Reuse the shelter's folder when this account can still open it; otherwise make one, so nobody is ever asked for a folder id.
      let folderId = (shelter.drive_root_folder_id as string | null) ?? null;
      let verified: { email: string } | null = null;
      if (folderId) verified = await verifyDrive({ ...base, folderId }).catch(() => null);
      if (!verified) {
        const made = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify({ name: folderNameFor(shelter.name as string | null), mimeType: "application/vnd.google-apps.folder" }),
        });
        const f = (await made.json().catch(() => ({}))) as { id?: string };
        if (!made.ok || !f.id) return { ok: false, reason: "google" };
        folderId = f.id;
        verified = await verifyDrive({ ...base, folderId });
      }
      if (validateDrive({ shelterKey, folderId, ...base }).length) return { ok: false, reason: "google" };
      const { data: prior } = await db.from("shelter_drive_credentials").select("shelter_id").eq("shelter_id", shelterId).maybeSingle();
      const up = await db.from("shelter_drive_credentials").upsert({
        shelter_id: shelterId, oauth_client_id: c.clientId, oauth_client_secret_enc: await encryptSecret(c.clientSecret), refresh_token_enc: await encryptSecret(tok.refresh_token),
        drive_account_email: verified.email, token_status: "ok", last_checked_at: now, last_error: null, dead_alerted_at: null, updated_at: now,
      }, { onConflict: "shelter_id" });
      if (up.error) return { ok: false, reason: "store" };
      const set = await db.from("shelters").update({ drive_root_folder_id: folderId }).eq("id", shelterId);
      // Credentials and folder go together or not at all (the script does it in one statement; this cannot): undo a row this press made.
      if (set.error) {
        if (!prior) await db.from("shelter_drive_credentials").delete().eq("shelter_id", shelterId);
        return { ok: false, reason: "store" };
      }
      return { ok: true };
    }

    // Calendar: the account's own primary calendar, whose id is the account's email address.
    const who = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: auth });
    const email = ((await who.json().catch(() => ({}))) as { email?: string }).email;
    if (!who.ok || !email) return { ok: false, reason: "google" };
    const input = { shelterKey, calendarId: email, accountEmail: email, ...base };
    if (validateCalendar(input).length) return { ok: false, reason: "google" };
    if (refuseFallbackCalendar(input, process.env.GOOGLE_CALENDAR_ID)) return { ok: false, reason: "fallback_calendar" };
    await verifyCalendar(input);
    const up = await db.from("shelter_calendar_credentials").upsert({
      shelter_id: shelterId, calendar_id: email, oauth_client_id: c.clientId, oauth_client_secret_enc: await encryptSecret(c.clientSecret), refresh_token_enc: await encryptSecret(tok.refresh_token),
      calendar_account_email: email, token_status: "ok", last_checked_at: now, last_error: null, dead_alerted_at: null, updated_at: now,
    }, { onConflict: "shelter_id" });
    if (up.error) return { ok: false, reason: up.error.code === "23505" ? "calendar_taken" : "store" };
    return { ok: true };
  } catch (err) {
    console.error(`google connect (${kind}) failed: ${err instanceof Error ? err.message : String(err)}`);
    return { ok: false, reason: "google" };
  }
}
