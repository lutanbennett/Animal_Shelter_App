/**
 * The request header that tells the database which shelter a request is for.
 * The Worker sets it (worker/shelter.mjs); the server-side Supabase clients
 * forward it, and PostgREST exposes it to SQL as
 * current_setting('request.headers', true)::json ->> 'x-shelter-id'.
 * No header means no shelter, and no shelter means no rows (#ykefa).
 */
export const SHELTER_HEADER = "x-shelter-id";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The headers to hand a Supabase client for this shelter; empty if there is none or it is not a uuid. */
export function shelterHeaders(shelterId: string | null | undefined): Record<string, string> {
  return shelterId && UUID.test(shelterId) ? { [SHELTER_HEADER]: shelterId } : {};
}
