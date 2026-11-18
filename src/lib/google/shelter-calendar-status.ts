import { createClient } from "@/lib/supabase/server";

export type ShelterCalendarStatus = {
  tokenStatus: "unchecked" | "ok" | "dead";
  lastCheckedAt: string | null;
  lastError: string | null;
  calendarId: string | null;
  calendarAccountEmail: string | null;
  connected: boolean;
};

/**
 * The status columns of the shelter being served's own calendar connection, through shelter_calendar_status() (0410). Admin only:
 * the function returns nothing for anyone else, and never a client id, secret or token. Null when there is no row (the fallback
 * shelter on environment variables) or the caller is not Admin.
 */
export async function getShelterCalendarStatus(): Promise<ShelterCalendarStatus | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("shelter_calendar_status");
  const row = (data as Record<string, unknown>[] | null)?.[0];
  if (!row) return null;
  return {
    tokenStatus: row.token_status as ShelterCalendarStatus["tokenStatus"],
    lastCheckedAt: (row.last_checked_at as string | null) ?? null,
    lastError: (row.last_error as string | null) ?? null,
    calendarId: (row.calendar_id as string | null) ?? null,
    calendarAccountEmail: (row.calendar_account_email as string | null) ?? null,
    connected: row.connected === true,
  };
}
