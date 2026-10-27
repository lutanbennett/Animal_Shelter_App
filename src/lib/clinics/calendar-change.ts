// Pure rules for a polled calendar event (used by calendar-poll.ts).

type Ev = { status?: string; etag?: string; updated?: string; start?: { dateTime?: string; date?: string } };
type V = {
  appointment_date: string;
  status: string;
  calendar_etag: string | null;
  calendar_synced_at: string | null;
  calendar_out_of_date_at: string | null;
};

/** A deletion this soon after the app's own sync is the app's DELETE coming back round. */
const OWN_DELETE_WINDOW_MS = 120_000;

/**
 * Whether a visit should hold a calendar event. Decided 2026-10-27: a past or completed visit KEEPS its
 * event; it goes only when the visit is cancelled or archived. A visit with no event gets one only while
 * it is scheduled and today or later, so past visits are never back-filled. Days are Bangkok yyyy-mm-dd.
 */
export function wantsEvent(
  v: { status: string; archived_at: string | null; hasEvent: boolean; hasNames: boolean },
  visitDay: string,
  today: string,
): boolean {
  if (v.status === "cancelled" || v.archived_at || !v.hasNames) return false;
  if (v.hasEvent) return true;
  return v.status === "scheduled" && visitDay >= today;
}

/** What a polled event means for its visit. */
export function decideChange(event: Ev, visit: V, now: number = Date.now()): "ignore" | "own" | "clash" | "cancel" | "move" | "past" {
  if (visit.status !== "scheduled") return "ignore";
  if (event.etag && event.etag === visit.calendar_etag) return "own";
  // A deleted event comes back with a NEW etag, so the app's own DELETE is recognised by timing instead.
  if (event.status === "cancelled" && event.updated && visit.calendar_synced_at) {
    const gap = new Date(event.updated).getTime() - new Date(visit.calendar_synced_at).getTime();
    if (gap >= -5_000 && gap <= OWN_DELETE_WINDOW_MS) return "own";
  }
  // A past visit cannot be called off from the calendar: leave it and flag it.
  if (event.status === "cancelled" && new Date(visit.appointment_date).getTime() < now) return "past";
  const changedInApp =
    visit.calendar_out_of_date_at !== null &&
    (!visit.calendar_synced_at || visit.calendar_out_of_date_at > visit.calendar_synced_at);
  if (event.status === "cancelled") return changedInApp ? "clash" : "cancel";
  const start = event.start?.dateTime;
  if (!start || Number.isNaN(new Date(start).getTime())) return "ignore"; // all-day or unreadable
  if (new Date(start).getTime() === new Date(visit.appointment_date).getTime()) return "ignore";
  return changedInApp ? "clash" : "move";
}

/** An event carrying a different environment's tag. No tag (an older event) is not "other": the visit lookup already tied it to this database. */
export function isOtherEnvironment(tag: string | undefined, mine: string): boolean {
  return tag !== undefined && tag !== mine;
}
