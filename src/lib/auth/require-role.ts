import { redirect } from "next/navigation";
import { entersApp, type Permissions } from "@/lib/permissions/can";
import { isPublicSiteOff } from "@/lib/public-site";
import { NO_ACCESS_PATH } from "./next-path";

export { NO_ACCESS_PATH };

/**
 * Refuses a request whose permissions are already loaded. A role that opens the app gets the no-access page
 * (inside the app, with its menu); anyone else — a public viewer, or no live role — gets the public home page,
 * which is right for them and only them. What decides whether someone is in the app is the role's own
 * cards: entersApp() (docs/decisions/2026-10-04-medical-jobs-app.md), never a list of role names.
 *
 * While the website is off (PUBLIC_SITE "off", src/lib/public-site.ts) nobody is sent to "/": everyone gets
 * the no-access page. "/" would only send a signed-in login on again, and before this an edge redirect
 * from "/" to /home looped exactly this login (#br3f3).
 */
export function refuseFor(perms: Permissions | null | undefined): never {
  redirect(entersApp(perms) || isPublicSiteOff() ? NO_ACCESS_PATH : "/");
}
