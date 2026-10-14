import type { SupabaseClient } from "@supabase/supabase-js";
import { todayIso } from "@/lib/format";
import type { Permissions } from "@/lib/permissions/can";
import { canOpen, routeFor } from "@/lib/permissions/routes";
import { countMyUrgentAccessRequests } from "./access-requests";
import { countMyUrgentMaintenance } from "./maintenance";
import { countMyUrgentRecurring } from "./recurring";

export type UrgentCounts = {
  /** Everything due today or overdue across its sources: the number on My tasks. */
  total: number;
  /** The maintenance share of it, for the Maintenance tile. */
  maintenance: number;
};

/**
 * What is due today or overdue for this person. One definition for the left menu's My tasks badge and the
 * counts on the home tiles, so the two can never disagree (the menu may be removed; the numbers must not go with it).
 */
export async function loadUrgentCounts(supabase: SupabaseClient, perms: Permissions, userId: string): Promise<UrgentCounts> {
  const today = todayIso();
  const maintenanceRoute = routeFor("/maintenance");
  const [access, maintenance, recurring] = await Promise.all([
    perms.isAdmin ? countMyUrgentAccessRequests() : 0,
    maintenanceRoute && canOpen(perms, maintenanceRoute) ? countMyUrgentMaintenance(supabase, userId, today) : 0,
    countMyUrgentRecurring(supabase, userId, today),
  ]);
  return { total: access + maintenance + recurring, maintenance };
}

