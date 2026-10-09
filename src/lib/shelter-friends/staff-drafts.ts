import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

/**
 * How many Shelter Friend profiles are drafts — saved but unpublished, on
 * a live contact — for the signed-in viewer of /friends. Staff who have
 * just saved a profile and gone to look at the page otherwise find its
 * visitor-facing empty state, which reads as intentional and gives no hint
 * that their own draft is the reason.
 *
 * The one read of shelter_friends a public page makes, and deliberately
 * only a count: nothing from a draft is rendered. It runs as the viewer,
 * so RLS (0076) decides — anon has no policy on the table and never gets
 * here anyway, since a visitor has no user. Null means "say nothing".
 */
export async function staffDraftFriends(
  supabase: SupabaseClient,
): Promise<{ count: number; canPublish: boolean } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ count, error }, perms] = await Promise.all([
    supabase
      .from("shelter_friends")
      .select("id, picker_contacts!inner(archived_at)", { count: "exact", head: true })
      .eq("published", false)
      .is("picker_contacts.archived_at", null),
    loadPermissions(),
  ]);
  if (error || !count) return null;
  return { count, canPublish: can(perms, "friends.manage") };
}
