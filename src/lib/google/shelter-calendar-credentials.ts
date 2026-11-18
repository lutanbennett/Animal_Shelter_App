import { createAdminClient } from "@/lib/supabase/admin";
import { decideCalendar, type CalendarCredentialRow, type CalendarResolution } from "./shelter-calendar-decide";
export { decideCalendar, envCalendarConfigured, type CalendarCreds, type CalendarResolution } from "./shelter-calendar-decide";

/**
 * The calendar a given shelter's clinic visits are written to (#calsh, table 0409). Rule, per
 * docs/decisions/2026-11-18-per-shelter-calendar-credentials.md: a shelter with a complete row uses it; the shelter keyed
 * the fallback shelter with no row keeps the environment variables; any other shelter with no row is REFUSED, never routed to the fallback shelter's.
 * Not a permission: it picks which calendar the server writes to.
 */
export async function resolveShelterCalendar(shelterId: string): Promise<CalendarResolution> {
  const db = createAdminClient({ shelterId });
  const { data: row } = await db
    .from("shelter_calendar_credentials")
    .select("shelter_id, calendar_id, oauth_client_id, oauth_client_secret_enc, refresh_token_enc, token_status, last_error")
    .eq("shelter_id", shelterId)
    .maybeSingle();
  if (row) return decideCalendar(row as CalendarCredentialRow, null);
  const { data: shelter } = await db.from("shelters").select("key").eq("id", shelterId).maybeSingle();
  return decideCalendar(null, shelter?.key);
}
