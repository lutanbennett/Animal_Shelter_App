/** How long the calendar entry runs. A visit stores a start time only, so this is a stand-in. */
export const CALENDAR_ENTRY_MINUTES = 60;

/** Google's `dates` parameter wants UTC as YYYYMMDDTHHmmssZ, whatever zone the shelter keeps. */
function googleUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * A plain "Add to Google Calendar" link for one visit: no tokens, no setup, and it does not
 * follow later changes to the visit. `appointmentDate` is the stored instant (timestamptz), so
 * converting it to UTC here is exact: a 03:00 Bangkok visit becomes 20:00 UTC the day before,
 * which Google then shows back as 03:00 on the right day in the Director's calendar.
 * Returns null for a cancelled or finished visit, or one with an unreadable date.
 */
export function googleCalendarUrl(v: {
  status: string;
  appointmentDate: string;
  title: string;
  details: string;
  location?: string | null;
}): string | null {
  if (v.status !== "scheduled") return null;
  const start = new Date(v.appointmentDate);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + CALENDAR_ENTRY_MINUTES * 60_000);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: v.title,
    details: v.details,
  });
  if (v.location) q.set("location", v.location);
  // Google reads the slash between start and end literally; URLSearchParams would encode it.
  const dates = `${googleUtc(start)}/${googleUtc(end)}`;
  return `https://calendar.google.com/calendar/render?${q.toString()}&dates=${dates}`;
}
