import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPlatformHostname, requestHost } from "@/lib/site-hosts";
import { CHOOSER_PATH } from "./chooser-path";
import { frontDoorKeeps } from "./front-door-paths";

/**
 * The platform front door (#fdsgn, docs/decisions/2026-11-28-platform-front-door-signin.md). PLATFORM_HOST maps to no
 * shelter, so a login there holds no role HERE by construction. Sign-in asked only "is there a shelter on the request?"
 * and refused every such login as "this site isn't set up". On the front door the question is instead: is this login a
 * product administrator (the console) or does it hold a role at any shelter (the chooser)? Neither is a card and
 * neither widens anything: /platform and the chooser ask the database again, and the database refuses the rest.
 */

/** Whether this request arrived on the platform front door. The host is the Worker's x-lanna-public-host (set, never passed through). */
export async function onFrontDoor(): Promise<boolean> {
  const h = await headers();
  return isPlatformHostname(requestHost((n) => h.get(n)) ?? "");
}


/**
 * Where a role-less login lands on the front door, or null if there is nothing here for it (then it is signed out and
 * told so with `no_platform`, never "site not set up": the site is set up, the account has nothing on it).
 */
export async function frontDoorLanding(supabase: SupabaseClient, next: string | null | undefined): Promise<string | null> {
  const { data: admin } = await supabase.rpc("is_product_admin");
  if (admin === true) return next && frontDoorKeeps(next) ? next : "/platform";
  const { data: shelters } = await supabase.rpc("my_shelters");
  if (Array.isArray(shelters) && shelters.length > 0) return CHOOSER_PATH;
  return null;
}
