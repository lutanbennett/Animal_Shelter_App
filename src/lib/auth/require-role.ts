import { redirect } from "next/navigation";
import { entersApp, type Permissions } from "@/lib/permissions/can";
import { NO_ACCESS_PATH } from "./next-path";

export { NO_ACCESS_PATH };

/**
 * Refuses a request whose permissions are already loaded. A role that opens the app gets the no-access page
 * (inside the app, with its menu); anyone else — a public viewer, or no live role — gets the public home page,
 * which is right for them and only them. What decides whether someone is in the app is the role's own
 * cards: entersApp() (docs/decisions/2026-10-04-medical-jobs-app.md), never a list of role names.
 *
 * While a shelter's website is off (src/lib/public-site.ts) "/" shows no website to anyone: the proxy sends a login
 * whose cards open nothing on to the no-access page (it knows the shelter's state from the request header, and this
 * function is synchronous so cannot read it). That is one more redirect than before #wbsof and cannot loop: it only
 * ever lands on /no-access, never back on "/" (#br3f3).
 */
export function refuseFor(perms: Permissions | null | undefined): never {
  redirect(entersApp(perms) ? NO_ACCESS_PATH : "/");
}
