import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { canUseBills } from "./access";
import type { Permissions } from "@/lib/permissions/can";

/** Cards still in the inbox: matching deletes the card, so this is simply the row count. */
export async function countBillsWaiting(supabase: SupabaseClient, perms: Permissions | null): Promise<number | undefined> {
  if (!canUseBills(perms)) return undefined;
  const { count } = await supabase.from("bills_inbox").select("id", { count: "exact", head: true });
  return count ?? 0;
}
