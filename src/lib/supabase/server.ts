import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { authCookieOptions } from "./cookie-options";
import { SHELTER_HEADER, requestShelterHeaders } from "./shelter-header";

/**
 * Supabase client for use in Server Components, Route Handlers, and Server
 * Actions. Reads/writes the auth session via Next.js cookies so RLS policies
 * (supabase/migrations/0001_initial_schema.sql) see the signed-in user.
 */
export async function createClient() {
  const cookieStore = await cookies();
  // The shelter the Worker mapped this host to (worker/shelter.mjs); none means the database returns no rows.
  const shelter = requestShelterHeaders((await headers()).get(SHELTER_HEADER));

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      global: { headers: shelter },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component with no request context to
            // write to — safe to ignore as long as the proxy refreshes
            // the session (src/proxy.ts).
          }
        },
      },
    },
  );
}
