import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppealStatus } from "./state";
import type { AppealStyle } from "./form";

/**
 * What the staff screens read: the appeals table itself (RLS: appeal.run) and
 * the gifts designated to them. The raised figure is summed here exactly as
 * public_appeals sums it (0210): donation_lines.amount of donations whose
 * designation is 'appeal' and whose designation_appeal_id is the appeal.
 * Gifts for the resident do not count, and nothing is counted twice because a
 * gift has one designation.
 */

export type StaffAppeal = {
  id: string;
  resident_id: string;
  title: string;
  what_is_wrong: string | null;
  treatment_needed: string | null;
  cost_covers: string | null;
  target_amount: number;
  deadline: string | null;
  status: AppealStatus;
  outcome_note: string | null;
  display_style: AppealStyle;
  social_links: string[];
  published: boolean;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  residents: { name: string; thai_name: string | null } | null;
};

export const STAFF_APPEAL_COLUMNS =
  "id, resident_id, title, what_is_wrong, treatment_needed, cost_covers, target_amount, deadline, status, outcome_note, display_style, social_links, published, published_at, closed_at, created_at, updated_at, residents(name, thai_name)";

export function normaliseStaffAppeal(row: StaffAppeal): StaffAppeal {
  return { ...row, target_amount: Number(row.target_amount) };
}

export type Raised = { raised: number; asOf: string | null; gifts: number };

type GiftRow = {
  designation_appeal_id: string | null;
  created_at: string;
  donation_lines: { amount: number | string | null }[];
};

/**
 * Raised per appeal, in whole satang so the sum is exact. A failed read throws:
 * a zero that is really an error would be shown to staff as "nothing raised".
 */
export async function loadRaised(supabase: SupabaseClient, appealIds: string[]): Promise<Map<string, Raised>> {
  const out = new Map<string, Raised>(appealIds.map((id) => [id, { raised: 0, asOf: null, gifts: 0 }]));
  if (appealIds.length === 0) return out;
  const { data, error } = await supabase
    .from("donations")
    .select("designation_appeal_id, created_at, donation_lines(amount)")
    .eq("designation", "appeal")
    .in("designation_appeal_id", appealIds)
    .returns<GiftRow[]>();
  if (error) throw new Error(`Appeals: could not read the gifts: ${error.message}`);
  const satang = new Map<string, number>();
  for (const g of data ?? []) {
    const id = g.designation_appeal_id;
    const cur = out.get(id ?? "");
    if (!id || !cur) continue;
    let s = 0;
    for (const l of g.donation_lines) if (l.amount != null) s += Math.round(Number(l.amount) * 100);
    satang.set(id, (satang.get(id) ?? 0) + s);
    cur.gifts += 1;
    if (!cur.asOf || g.created_at > cur.asOf) cur.asOf = g.created_at;
  }
  for (const [id, s] of satang) out.get(id)!.raised = s / 100;
  return out;
}

export async function loadStaffAppeal(supabase: SupabaseClient, id: string): Promise<StaffAppeal | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const { data, error } = await supabase
    .from("appeals")
    .select(STAFF_APPEAL_COLUMNS)
    .eq("id", id)
    .maybeSingle<StaffAppeal>();
  if (error) throw new Error(`Appeals: could not read the appeal: ${error.message}`);
  return data ? normaliseStaffAppeal(data) : null;
}

export async function loadStaffAppeals(supabase: SupabaseClient, residentId?: string): Promise<StaffAppeal[]> {
  let q = supabase.from("appeals").select(STAFF_APPEAL_COLUMNS).order("created_at", { ascending: false });
  if (residentId) q = q.eq("resident_id", residentId);
  const { data, error } = await q.returns<StaffAppeal[]>();
  if (error) throw new Error(`Appeals: could not read the appeals: ${error.message}`);
  return (data ?? []).map(normaliseStaffAppeal);
}
