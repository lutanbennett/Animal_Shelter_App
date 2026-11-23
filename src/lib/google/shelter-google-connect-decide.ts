/**
 * The pure half of a shelter connecting its own Google Drive or Calendar from Settings (#drvcl). No imports, so a test loads it.
 * Not a permission: it builds addresses and reads Google's answers; who may press the button is decided by the caller (Admin only).
 *
 * Two flows, not one (docs/decisions/2026-11-22-shelter-google-connect-screen.md): each asks for its own narrow scope, may be run
 * by a different Google account, and a refusal in one cannot undo the other.
 */

export type ConnectKind = "drive" | "calendar";

export const CONNECT_PATH = "/admin/google/callback";
export const CONNECT_START_PATH = "/admin/google/start";
export const CONNECT_COOKIE = "google_connect";

/** Drive: only files the app itself creates (non-sensitive, so no "unverified app" wall; #dscop option A). Calendar: only calendars the app itself creates (#calsc; no "unverified
 *  app" wall if Google classes it non-sensitive, which Lutan confirms in the console); `email` names the account. */
export const SCOPES: Record<ConnectKind, string[]> = {
  drive: ["https://www.googleapis.com/auth/drive.file"],
  calendar: ["https://www.googleapis.com/auth/calendar.app.created", "https://www.googleapis.com/auth/userinfo.email"],
};

export function isConnectKind(v: unknown): v is ConnectKind {
  return v === "drive" || v === "calendar";
}

export function consentUrl(p: { clientId: string; origin: string; kind: ConnectKind; state: string }): string {
  const q = new URLSearchParams({
    client_id: p.clientId,
    redirect_uri: `${p.origin}${CONNECT_PATH}`,
    response_type: "code",
    scope: SCOPES[p.kind].join(" "),
    access_type: "offline", // a refresh token, which is the whole point
    prompt: "consent", // Google only returns a refresh token on a consent screen
    include_granted_scopes: "false",
    state: p.state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

/** The cookie holds `<state>.<kind>`; the return must carry the same state. Returns the kind, or null on any mismatch. */
export function readStateCookie(cookie: string | undefined, stateParam: string | null): ConnectKind | null {
  if (!cookie || !stateParam) return null;
  const i = cookie.lastIndexOf(".");
  if (i < 1) return null;
  const state = cookie.slice(0, i);
  const kind = cookie.slice(i + 1);
  if (state !== stateParam || state.length < 20 || !isConnectKind(kind)) return null;
  return kind;
}

/** The scopes Google says were granted must include every one asked for: a person can untick a box on the consent screen. */
export function missingScopes(kind: ConnectKind, granted: string | undefined): string[] {
  const have = new Set((granted ?? "").split(/\s+/));
  return SCOPES[kind].filter((s) => !have.has(s));
}

export type ConnectOutcome =
  | { ok: true; staged?: boolean }
  | { ok: false; reason: "not_set_up" | "cancelled" | "state" | "scopes" | "no_refresh_token" | "google" | "fallback_calendar" | "calendar_taken" | "no_key" | "store" };

/** Name of the calendar the app creates in a shelter's own Google account (#calsc). */
export function calendarNameFor(shelterName: string | null | undefined): string {
  const n = (shelterName ?? "").replace(/[\u0000-\u001f]/g, " ").trim();
  return n ? `${n} vet visits (animal shelter app)` : "Vet visits (animal shelter app)";
}

/** Folder name for a shelter's own Drive: the shelter's own name, so a director recognises it in her Drive. */
export function folderNameFor(shelterName: string | null | undefined): string {
  const n = (shelterName ?? "").replace(/[\/\u0000-\u001f]/g, " ").trim();
  return n ? `${n} (animal shelter app)` : "Animal shelter app";
}
