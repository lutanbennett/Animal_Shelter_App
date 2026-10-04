import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadPermissions } from "@/lib/permissions/load";
import { refuseFor } from "./require-role";

/**
 * What only an Admin may do and no activity names: who can sign in, and as what (Settings → Security).
 * An Admin rule, not a cell (§6: a role nobody else holds cannot be an activity everyone may be given),
 * so it asks `perms.isAdmin` and never a role's name. Everything else under Settings is an activity.
 * Sends anyone else to the no-access page (require-role.ts). Returns the current user.
 */
export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perms = await loadPermissions();
  if (!perms?.isAdmin) refuseFor(perms);
  return user;
}

/**
 * Whether the signed-in user is an admin, for a server action that
 * returns its refusal rather than throwing (src/lib/action-result.ts).
 */
export async function hasAdminRole() {
  return (await loadPermissions())?.isAdmin === true;
}

/** Same check for use inside a server action, where redirect() can't be used. */
export async function assertAdminRole() {
  if (!(await hasAdminRole())) {
    const { t } = await getT();
    throw new Error(t.admin.security.errors.adminAccessRequired);
  }
}
