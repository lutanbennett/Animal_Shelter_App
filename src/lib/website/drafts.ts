import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appUserLabel, loadAppUsersById } from "@/lib/auth/app-users";

/** One proposed website change waiting for approval (website_drafts, 0315). */
export type WebsiteDraft = {
  id: string;
  target: "site_content" | "site_pages";
  /** 'site_content' has one row; for site_pages this is the page slug. */
  rowKey: string;
  /** Column name -> proposed value, shown as given. */
  patch: Record<string, unknown>;
  proposedBy: string;
  proposedAt: string;
};

type Row = { id: string; target: WebsiteDraft["target"]; row_key: string; patch: Record<string, unknown>; proposed_by: string | null; proposed_at: string };

/** The drafts waiting, oldest first. RLS lets only a login holding website.approve or website.propose read them. */
export async function loadWebsiteDrafts(supabase: SupabaseClient): Promise<WebsiteDraft[]> {
  const { data } = await supabase
    .from("website_drafts")
    .select("id, target, row_key, patch, proposed_by, proposed_at")
    .order("proposed_at", { ascending: true })
    .returns<Row[]>();
  const rows = data ?? [];
  const users = await loadAppUsersById(supabase, rows.map((r) => r.proposed_by).filter((x): x is string => !!x));
  return rows.map((r) => ({
    id: r.id,
    target: r.target,
    rowKey: r.row_key,
    patch: r.patch,
    proposedBy: r.proposed_by ? appUserLabel(users.get(r.proposed_by)) : "—",
    proposedAt: r.proposed_at,
  }));
}
