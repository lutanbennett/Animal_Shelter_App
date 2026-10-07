import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type Permissions } from "@/lib/permissions/can";
import { hasAppAccess, loadCurrentRole, signedInLandingPath } from "./app-access";

/**
 * The app page that says "you do not have access to this" — where a
 * signed-in app user lands when a page's role check refuses them. Inside
 * the app, with its menu, so they are never thrown out to the public
 * website mid-task (backlog, "A refused page and a booked vet visit both
 * dump you onto the public website").
 */
export const NO_ACCESS_PATH = "/no-access";

/**
 * Where a refused signed-in user goes. An app user gets the no-access page;
 * anyone else (a public viewer) gets where their sign-in would land them,
 * which for them is the public home — "/" is right for a public viewer and
 * only for them. The request proxy normally catches a public viewer before
 * a page guard runs, so the second branch is the belt to its braces.
 */
export function refusedPath(role: string | null | undefined): string {
  return hasAppAccess(role) ? NO_ACCESS_PATH : signedInLandingPath(role ?? null, null);
}

/**
 * Refuses the current request: never `redirect("/")`, which is the public
 * website. For a page whose role check has already run.
 */
export function refuse(role: string | null | undefined): never {
  redirect(refusedPath(role));
}

/**
 * Refuses a request whose permissions are already loaded. Use this, not `refuse(perms.role.key)`:
 * the key of a configured role ("head_of_medical") is not in the legacy allow-list, so
 * hasAppAccess() says no and `refuse()` would send her to "/", the public website. What decides
 * whether someone is in the app is the role's own `opensApp`
 * (docs/decisions/2026-10-04-medical-jobs-app.md).
 */
export function refuseFor(perms: Permissions | null | undefined): never {
  if (perms?.role.opensApp) redirect(NO_ACCESS_PATH);
  refuse(perms?.role.key);
}

/**
 * The guard for a role-gated page (a server component, or a layout for a
 * whole route tree): signed out → /login, a role `allowed` does not accept
 * → refused (above). Returns the Supabase client, user and role so the page
 * does not look them up again.
 *
 *   const { supabase, role } = await requireRole((role) => role === "vet");
 *
 * Server actions keep returning or throwing their refusal instead — a
 * redirect from inside a form submission is not a refusal anyone reads.
 */
export async function requireRole(allowed: (role: string | null) => boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = await loadCurrentRole(supabase);
  if (!allowed(role)) refuse(role);

  return { supabase, user, role };
}
