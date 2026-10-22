import type { AppEnv } from "@/lib/app-env";

/** How long the calendar entry runs. A visit stores a start time only, so this is a stand-in. */
export const CALENDAR_ENTRY_MINUTES = 60;

const ENV_LETTER: Record<AppEnv, string> = { dev: "d", uat: "u", production: "p" };

/**
 * The Google event id for a visit, chosen by us, so a second create for the same visit answers 409
 * instead of making a second event. Google wants base32hex (0-9, a-v), 5 to 1024 characters; a UUID's
 * hex digits fit. The letter in front means two systems holding the same visit id (a dev database
 * refreshed from production) can never collide on one calendar.
 */
export function calendarEventIdFor(visitId: string, env: AppEnv): string {
  return `${ENV_LETTER[env]}${visitId.replace(/-/g, "").toLowerCase()}`;
}

/** Bangkok keeps UTC+7 all year with no daylight saving, so a fixed offset is exact. */
const SHELTER_OFFSET_MS = 7 * 60 * 60 * 1000;

/** The instant as local Bangkok wall time with its offset: 03:00 stays 03:00, never the UTC day before. */
export function bangkokDateTime(instant: Date): string {
  return `${new Date(instant.getTime() + SHELTER_OFFSET_MS).toISOString().slice(0, 19)}+07:00`;
}

export type CalendarVisit = {
  id: string;
  residentId: string;
  residentName: string;
  clinicName: string;
  appointmentDate: string;
};

/**
 * The Google Calendar event for one visit, the way the Director types them by hand:
 * "Novel - Blackie", the visit's time, one hour. The description carries the resident's name, the
 * clinic, the time and two addresses, and nothing medical: not the reason, not the notes. The links
 * are built from `origin` (the app's own address), never a written-in host; with none, they are left out.
 */
export function buildCalendarEvent(v: CalendarVisit, origin: string | null, env: AppEnv) {
  const start = new Date(v.appointmentDate);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + CALENDAR_ENTRY_MINUTES * 60_000);
  const lines = [`Vet visit: ${v.residentName} at ${v.clinicName}`];
  if (origin) {
    lines.push(`Visit: ${new URL(`/residents/${v.residentId}/clinic-visits`, origin).toString()}`);
    lines.push(`Resident's record: ${new URL(`/residents/${v.residentId}`, origin).toString()}`);
  }
  return {
    summary: `${v.clinicName} - ${v.residentName}`,
    location: v.clinicName,
    description: lines.join("\n"),
    // The two-way poll only looks at events carrying this (calendar-poll.ts). env says which system
    // made the event, so one system never acts on another's deletions
    // (docs/decisions/2026-10-22-calendar-event-environment-tag.md).
    extendedProperties: { private: { visitId: v.id, env } },
    start: { dateTime: bangkokDateTime(start), timeZone: "Asia/Bangkok" },
    end: { dateTime: bangkokDateTime(end), timeZone: "Asia/Bangkok" },
  };
}
