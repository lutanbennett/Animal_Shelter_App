import { createAdminClient } from "@/lib/supabase/admin";
import { adminEmails, send } from "@/lib/status/alerts";
import { decideChange } from "./calendar-change";
import { calendarConfigured, calendarFetch, errorText } from "./calendar-sync";

/**
 * The calendar's half of the two-way sync: the Worker's 15-minute cron asks Google only for what
 * changed since last time (events.list with a syncToken, kept in calendar_sync_state) and applies it.
 *
 *  - only events the app made are looked at (they are the visits' calendar_event_id);
 *  - a moved event sets the visit's time to the event's new start; end, title and description edits
 *    are ignored and put back by the app's next sync;
 *  - a deleted event cancels the visit (never deletes it), noted "Cancelled from Google Calendar",
 *    and the admins are told so a slip of the thumb is noticed;
 *  - a change that is the app's own (same etag as the one it recorded) is ignored;
 *  - changed in the app AND the calendar since the last sync: the app wins, the calendar is put back
 *    by the sweep, and the clash is left on the visit (calendar_error) for someone to look at;
 *  - a completed or already cancelled visit is not changed by a calendar edit.
 * Nothing here throws.
 */

export const CANCELLED_NOTE = "Cancelled from Google Calendar";

type GEvent = {
  id: string;
  status?: string;
  etag?: string;
  start?: { dateTime?: string; date?: string };
};

type Visit = {
  id: string;
  appointment_date: string;
  status: string;
  notes: string | null;
  calendar_etag: string | null;
  calendar_synced_at: string | null;
  calendar_out_of_date_at: string | null;
  residents: { name: string } | null;
  clinics: { name: string } | null;
};

export type PollResult = {
  configured: boolean;
  moved: number;
  cancelled: number;
  clashes: number;
  note?: string;
};

const VISIT_COLUMNS =
  "id, appointment_date, status, notes, calendar_etag, calendar_synced_at, calendar_out_of_date_at, residents(name), clinics(name)";

const bangkokDay = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 10);

function describe(v: Visit): string {
  const when = bangkokDay(v.appointment_date);
  return `${v.clinics?.name ?? "Vet"} - ${v.residents?.name ?? "a resident"} on ${when}`;
}

async function tellAdmins(origin: string, subject: string, line: string): Promise<void> {
  try {
    const to = await adminEmails();
    if (!to.length) return;
    const text = `${line}\n\nIt is a change made in the shelter calendar, picked up by Lanna Care. If this was a mistake, open the visit and set it back to scheduled.`;
    await send({ subject, text, html: `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p><p>${text.split("\n\n")[1]}</p>` }, to, origin);
  } catch {
    // the cancellation stands; a mail that cannot go is not a reason to undo it
  }
}

async function apply(event: GEvent, origin: string | null, result: PollResult): Promise<void> {
  const db = createAdminClient();
  const { data } = await db
    .from("clinic_visits")
    .select(VISIT_COLUMNS)
    .eq("calendar_event_id", event.id)
    .limit(1)
    .returns<Visit[]>();
  const visit = data?.[0];
  if (!visit) return; // not an event the app made
  const decision = decideChange(event, visit);
  if (decision === "ignore" || decision === "own") return;
  if (decision === "clash") {
    result.clashes += 1;
    await db
      .from("clinic_visits")
      .update({ calendar_error: "Changed in the app and in Google Calendar; the app's version was kept." })
      .eq("id", visit.id);
    return;
  }
  if (decision === "cancel") {
    const notes = [visit.notes, CANCELLED_NOTE].filter(Boolean).join("\n");
    const { error } = await db
      .from("clinic_visits")
      .update({ status: "cancelled", notes, calendar_event_id: null, calendar_etag: null })
      .eq("id", visit.id);
    if (error) return;
    result.cancelled += 1;
    if (origin) {
      const what = describe(visit);
      await tellAdmins(origin, `Vet visit cancelled in the calendar: ${what}`, `${what} was cancelled in your calendar; it is cancelled in Lanna Care too.`);
    }
    return;
  }
  const { error } = await db
    .from("clinic_visits")
    .update({ appointment_date: new Date(event.start!.dateTime!).toISOString() })
    .eq("id", visit.id);
  if (error) {
    // e.g. 0107: a visit with prescriptions linked cannot move past today.
    result.clashes += 1;
    await db.from("clinic_visits").update({ calendar_error: `Moved in Google Calendar but not applied: ${error.message}`.slice(0, 500) }).eq("id", visit.id);
    return;
  }
  result.moved += 1;
}

export async function pollCalendarChanges(origin: string | null): Promise<PollResult> {
  const result: PollResult = { configured: calendarConfigured(), moved: 0, cancelled: 0, clashes: 0 };
  if (!result.configured) return result;
  const db = createAdminClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "";
  const now = new Date().toISOString();
  const fail = async (message: string) => {
    await db.from("calendar_sync_state").upsert({ calendar_id: calendarId, last_run_at: now, last_error: message.slice(0, 500) });
    result.note = message;
    return result;
  };
  try {
    const { data: state } = await db
      .from("calendar_sync_state")
      .select("sync_token")
      .eq("calendar_id", calendarId)
      .limit(1)
      .returns<{ sync_token: string | null }[]>();
    let token = state?.[0]?.sync_token ?? null;
    // First run (or an expired token): read everything once to get a token, applying nothing.
    const baseline = !token;
    let pageToken: string | null = null;
    let nextSync: string | null = null;
    for (let page = 0; page < 20; page += 1) {
      const qs = new URLSearchParams({ maxResults: "250", singleEvents: "false" });
      if (token) qs.set("syncToken", token);
      if (pageToken) qs.set("pageToken", pageToken);
      const res = await calendarFetch(`/events?${qs}`);
      if (res.status === 410) {
        await db.from("calendar_sync_state").upsert({ calendar_id: calendarId, sync_token: null, last_run_at: now });
        result.note = "Sync token expired; will re-baseline next run.";
        return result;
      }
      if (!res.ok) return await fail(`Calendar poll failed (${res.status}): ${await errorText(res)}`);
      const body = (await res.json()) as { items?: GEvent[]; nextPageToken?: string; nextSyncToken?: string };
      if (!baseline) for (const event of body.items ?? []) await apply(event, origin, result);
      pageToken = body.nextPageToken ?? null;
      if (!pageToken) {
        nextSync = body.nextSyncToken ?? null;
        break;
      }
    }
    if (!nextSync) return await fail("Calendar poll ended without a sync token.");
    await db
      .from("calendar_sync_state")
      .upsert({ calendar_id: calendarId, sync_token: nextSync, last_run_at: now, last_ok_at: now, last_error: null });
    return result;
  } catch (err) {
    return await fail(err instanceof Error ? err.message : String(err));
  }
}
