// Pure rules for a polled calendar event (used by calendar-poll.ts).

type Ev = { status?: string; etag?: string; start?: { dateTime?: string; date?: string } };
type V = {
  appointment_date: string;
  status: string;
  calendar_etag: string | null;
  calendar_synced_at: string | null;
  calendar_out_of_date_at: string | null;
};

/** What a polled event means for its visit. */
export function decideChange(event: Ev, visit: V): "ignore" | "own" | "clash" | "cancel" | "move" {
  if (visit.status !== "scheduled") return "ignore";
  if (event.etag && event.etag === visit.calendar_etag) return "own";
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
