import { createAdminClient } from "@/lib/supabase/admin";
import { todayIso } from "@/lib/format";
import { buildCalendarEvent } from "./calendar-event";

/**
 * Vet visits into the shelter's Google Calendar, one event per visit
 * (docs/decisions/2026-10-16-vet-calendar-one-event-per-visit.md).
 *
 * THE RULE THIS FILE EXISTS TO KEEP: Google can never lose or block a booking. Every caller saves the
 * visit first and calls this afterwards, never inside the same transaction, and nothing here throws.
 * A failure is written on the visit (`calendar_error`) and the visit stays out of date, so the Worker's
 * 15-minute sweep (src/app/api/calendar/sweep/route.ts) tries again, and so does the Retry button.
 *
 * Rebuilt from the database, never edited by difference: a visit's event is whatever the visit says
 * now. The database trigger of 0207 marks a visit out of date whenever it changes, by any route (the
 * booking function, the edit form, an audit undo), so a path nobody remembered still gets picked up.
 *
 * Talks to the Calendar REST API with plain fetch for the same reason drive.ts does. It has its own
 * refresh token so a calendar fault can never stop photo uploads.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars";
/** How many visits one sweep handles; the rest wait for the next. */
const SWEEP_BATCH = 40;

export function calendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN &&
      process.env.GOOGLE_CALENDAR_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );
}

let cached: { value: string; expiresAt: number } | null = null;

export async function errorText(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } | string; error_description?: string };
    if (typeof body.error === "string") return body.error_description ?? body.error;
    return body.error?.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

async function accessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) return cached.value;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN ?? "",
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Calendar token refresh failed (${res.status}): ${await errorText(res)}`);
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Calendar token refresh returned no access token.");
  cached = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000 };
  return data.access_token;
}

export async function calendarFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const id = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID ?? "");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await accessToken()}`);
  if (init.body) headers.set("Content-Type", "application/json; charset=UTF-8");
  return fetch(`${CALENDAR_API}/${id}${path}`, { ...init, headers, signal: AbortSignal.timeout(10_000) });
}

type Row = {
  id: string;
  resident_id: string;
  appointment_date: string;
  status: string;
  archived_at: string | null;
  calendar_event_id: string | null;
  calendar_synced_at: string | null;
  calendar_out_of_date_at: string | null;
  residents: { name: string } | null;
  clinics: { name: string } | null;
};

const COLUMNS =
  "id, resident_id, appointment_date, status, archived_at, calendar_event_id, calendar_synced_at, calendar_out_of_date_at, residents(name), clinics(name)";

export type SyncOutcome = "created" | "updated" | "deleted" | "unchanged" | "failed" | "off";

/** Whether this visit should have an event: still booked, not archived, today or later at the shelter. */
function wantsEvent(row: Row): boolean {
  if (row.status !== "scheduled" || row.archived_at) return false;
  const bangkokDay = todayIso(new Date(row.appointment_date).getTime());
  return bangkokDay >= todayIso() && Boolean(row.residents && row.clinics);
}

function isPending(r: Pick<Row, "calendar_synced_at" | "calendar_out_of_date_at">): boolean {
  return !r.calendar_synced_at || (r.calendar_out_of_date_at !== null && r.calendar_out_of_date_at > r.calendar_synced_at);
}

/** What the app records after its own write, so the poll can tell its own change from the Director's. */
async function stamp(res: Response): Promise<Record<string, string | null>> {
  try {
    const e = (await res.json()) as { id?: string; etag?: string; updated?: string };
    return { calendar_etag: e.etag ?? null, calendar_event_updated_at: e.updated ?? null };
  } catch {
    return {};
  }
}

async function syncRow(row: Row, origin: string | null): Promise<SyncOutcome> {
  const db = createAdminClient();
  // Stamped with the moment we started, so a change made while Google was answering stays "out of date".
  const startedAt = new Date().toISOString();
  const write = (patch: Record<string, string | null>) =>
    db.from("clinic_visits").update(patch).eq("id", row.id);
  try {
    if (!wantsEvent(row)) {
      if (!row.calendar_event_id) {
        await write({ calendar_synced_at: startedAt, calendar_error: null });
        return "unchanged";
      }
      const res = await calendarFetch(`/events/${encodeURIComponent(row.calendar_event_id)}`, { method: "DELETE" });
      // Already gone (404/410) is the outcome we wanted.
      if (!res.ok && res.status !== 404 && res.status !== 410) {
        throw new Error(`Calendar delete failed (${res.status}): ${await errorText(res)}`);
      }
      await write({ calendar_event_id: null, calendar_synced_at: startedAt, calendar_error: null });
      return "deleted";
    }
    const event = buildCalendarEvent(
      {
        id: row.id,
        residentId: row.resident_id,
        residentName: row.residents!.name,
        clinicName: row.clinics!.name,
        appointmentDate: row.appointment_date,
      },
      origin,
    );
    if (!event) throw new Error("The visit's date could not be read.");
    if (row.calendar_event_id) {
      const res = await calendarFetch(`/events/${encodeURIComponent(row.calendar_event_id)}`, {
        method: "PATCH",
        body: JSON.stringify(event),
      });
      if (res.ok) {
        await write({ calendar_synced_at: startedAt, calendar_error: null });
        return "updated";
      }
      // Someone deleted the event by hand: make it again rather than fail for good.
      if (res.status !== 404 && res.status !== 410) {
        throw new Error(`Calendar update failed (${res.status}): ${await errorText(res)}`);
      }
    }
    const res = await calendarFetch("/events", { method: "POST", body: JSON.stringify(event) });
    if (!res.ok) throw new Error(`Calendar create failed (${res.status}): ${await errorText(res)}`);
    const created = (await res.json()) as { id?: string; etag?: string; updated?: string };
    if (!created.id) throw new Error("Calendar create returned no event id.");
    await write({
      calendar_event_id: created.id,
      calendar_synced_at: startedAt,
      calendar_error: null,
      calendar_etag: created.etag ?? null,
      calendar_event_updated_at: created.updated ?? null,
    });
    return "created";
  } catch (err) {
    const message = (err instanceof Error ? err.message : String(err)).slice(0, 500);
    await write({ calendar_error: message }).then(undefined, () => undefined);
    return "failed";
  }
}

/** Sync one visit now. Never throws; "off" when the calendar is not set up (nothing is marked, so switching it on picks everything up). */
export async function syncVisitToCalendar(visitId: string, origin: string | null): Promise<SyncOutcome> {
  if (!calendarConfigured()) return "off";
  try {
    const { data } = await createAdminClient()
      .from("clinic_visits")
      .select(COLUMNS)
      .eq("id", visitId)
      .limit(1)
      .returns<Row[]>();
    return data?.[0] ? await syncRow(data[0], origin) : "unchanged";
  } catch {
    return "failed";
  }
}

export type SweepResult = { configured: boolean; synced: number; failed: number; remaining: number };

/**
 * Sync everything out of date: visits changed since their event last matched, plus upcoming booked
 * visits never sent (the one-off back-fill when the calendar is switched on; past visits are left
 * alone). Called straight after a booking or edit, and by the Worker's cron as the safety net.
 */
export async function syncPendingVisits(origin: string | null, limit = SWEEP_BATCH): Promise<SweepResult> {
  if (!calendarConfigured()) return { configured: false, synced: 0, failed: 0, remaining: 0 };
  const db = createAdminClient();
  try {
    const todayStart = new Date(`${todayIso()}T00:00:00+07:00`).toISOString();
    const [stale, neverSent] = await Promise.all([
      db
        .from("clinic_visits")
        .select(COLUMNS)
        .not("calendar_out_of_date_at", "is", null)
        .order("calendar_out_of_date_at")
        .limit(500)
        .returns<Row[]>(),
      db
        .from("clinic_visits")
        .select(COLUMNS)
        .is("calendar_synced_at", null)
        .is("calendar_event_id", null)
        .eq("status", "scheduled")
        .is("archived_at", null)
        .gte("appointment_date", todayStart)
        .limit(500)
        .returns<Row[]>(),
    ]);
    const byId = new Map<string, Row>();
    for (const r of [...(stale.data ?? []), ...(neverSent.data ?? [])]) byId.set(r.id, r);
    const pending = [...byId.values()].filter(isPending);
    let synced = 0;
    let failed = 0;
    for (const row of pending.slice(0, limit)) {
      const outcome = await syncRow(row, origin);
      if (outcome === "failed") failed += 1;
      else synced += 1;
    }
    return { configured: true, synced, failed, remaining: Math.max(0, pending.length - limit) };
  } catch {
    return { configured: true, synced: 0, failed: 1, remaining: 0 };
  }
}

export type CalendarStatus =
  | { state: "off" }
  | { state: "fail"; error: string; unsynced: number }
  | { state: "ok"; unsynced: number };

/** For the System status tile: does the token work, can the calendar be reached, how many visits are waiting. */
export async function checkCalendar(): Promise<CalendarStatus> {
  if (!calendarConfigured()) return { state: "off" };
  const { data } = await createAdminClient()
    .from("clinic_visits")
    .select("calendar_synced_at, calendar_out_of_date_at")
    .not("calendar_out_of_date_at", "is", null)
    .limit(1000)
    .returns<{ calendar_synced_at: string | null; calendar_out_of_date_at: string }[]>();
  const unsynced = (data ?? []).filter(isPending).length;
  try {
    // calendar.events does not allow reading the calendar itself, only its events: list one.
    const res = await calendarFetch("/events?maxResults=1");
    if (!res.ok) return { state: "fail", error: `Calendar answered ${res.status}: ${await errorText(res)}`, unsynced };
    return { state: "ok", unsynced };
  } catch (err) {
    return { state: "fail", error: err instanceof Error ? err.message : String(err), unsynced };
  }
}
