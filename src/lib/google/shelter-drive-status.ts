import { createClient } from "@/lib/supabase/server";

export type ShelterDriveStatus = {
  tokenStatus: "unchecked" | "ok" | "dead";
  lastCheckedAt: string | null;
  lastError: string | null;
  driveAccountEmail: string | null;
  connected: boolean;
};

/**
 * The status columns of the shelter being served's own Google connection, through shelter_drive_status() (0405). Admin only:
 * the function returns nothing for anyone else, and never a client id, secret or token. Null when there is no row (the
 * fallback shelter on environment variables) or the caller is not Admin.
 */
export async function getShelterDriveStatus(): Promise<ShelterDriveStatus | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("shelter_drive_status");
  const row = (data as Record<string, unknown>[] | null)?.[0];
  if (!row) return null;
  return {
    tokenStatus: row.token_status as ShelterDriveStatus["tokenStatus"],
    lastCheckedAt: (row.last_checked_at as string | null) ?? null,
    lastError: (row.last_error as string | null) ?? null,
    driveAccountEmail: (row.drive_account_email as string | null) ?? null,
    connected: row.connected === true,
  };
}
