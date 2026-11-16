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

/**
 * The shelter a LOCAL `next dev` server stands in for, because there is no Worker in front of it to send
 * the header (#ujqr5). Read from DEV_SHELTER_ID and honoured only when NODE_ENV is "development", which
 * Next sets for `next dev` alone: a `next build` / `next start` / Worker / Pi process is "production" and
 * ignores the variable even if it is somehow present. Nothing here picks a shelter by itself: no variable,
 * no header, and the database then returns no rows, exactly as in production.
 */
export function devShelterId(env: Record<string, string | undefined> = process.env): string | null {
  if (env.NODE_ENV !== "development") return null;
  const id = env.DEV_SHELTER_ID?.trim();
  return id && UUID.test(id) ? id : null;
}

/**
 * The headers for a server-side Supabase call: the shelter the request arrived with (the Worker's header)
 * if it has one, else, on `next dev` only, the developer's own. A header that arrived always wins.
 */
export function requestShelterHeaders(
  inbound: string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): Record<string, string> {
  const fromRequest = shelterHeaders(inbound);
  return SHELTER_HEADER in fromRequest ? fromRequest : shelterHeaders(devShelterId(env));
}
