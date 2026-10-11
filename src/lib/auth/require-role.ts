import { redirect } from "next/navigation";
import { type Permissions } from "@/lib/permissions/can";

/**
 * The app page that says "you do not have access to this" — where a
 * signed-in app user lands when a page's role check refuses them. Inside
 * the app, with its menu, so they are never thrown out to the public
 * website mid-task (backlog, "A refused page and a booked vet visit both
 * dump you onto the public website").
 */
export const NO_ACCESS_PATH = "/no-access";

/**
 * Refuses a request whose permissions are already loaded. A role that opens the app gets the no-access page
 * (inside the app, with its menu); anyone else — a public viewer, or no live role — gets the public home page,
 * which is right for them and only them. What decides whether someone is in the app is the role's own
 * `opensApp` (docs/decisions/2026-10-04-medical-jobs-app.md), never a list of role names.
 */
export function refuseFor(perms: Permissions | null | undefined): never {
  redirect(perms?.role.opensApp ? NO_ACCESS_PATH : "/");
}
