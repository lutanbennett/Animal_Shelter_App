import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Permissions } from "@/lib/permissions/can";
import { mayFileRoute, type BillKind } from "@/lib/bills/kinds";
import { accountLabel, type ImportCatalogue, type ImportRoute } from "@/lib/bills/import";

/** The inbox is read a page at a time: the database hands back at most 1000 rows per request. */
const PAGE = 1000;
const MAX_PAGES = 10;

/**
 * The shelter's own names and the photos waiting in the Bills inbox, read as the person importing, under their own session.
 * What their cards let them see is all they get (the catalogue policies, 0305; the attachments policy for bill_inbox, 0189), and
 * `mayFile` is the same question each destination's own action asks (mayFileRoute), so a row for a destination they hold no
 * card for fails with a reason rather than being written.
 */
export async function loadImportCatalogue(supabase: SupabaseClient, perms: Permissions | null): Promise<ImportCatalogue | { error: string }> {
  const [kindsR, placesR, accountsR] = await Promise.all([
    supabase
      .from("bill_kinds")
      .select("id, key, label, parent_id, sort, archived_at")
      .returns<{ id: string; key: string; label: string; parent_id: string | null; sort: number; archived_at: string | null }[]>(),
    supabase.from("premises").select("id, name, archived_at").returns<{ id: string; name: string; archived_at: string | null }[]>(),
    supabase
      .from("bill_accounts")
      .select("id, supplier, account_ref, premises_id, archived_at")
      .returns<{ id: string; supplier: string; account_ref: string | null; premises_id: string | null; archived_at: string | null }[]>(),
  ]);
  const failed = kindsR.error ?? placesR.error ?? accountsR.error;
  if (failed) return { error: failed.message };

  const photos: { id: string; fileName: string }[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from("attachments")
      .select("id, file_name")
      .eq("owner_type", "bill_inbox") // never all attachments: a row must not be able to claim a resident's photo
      .not("file_name", "is", null)
      .order("uploaded_at", { ascending: true })
      .order("id", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1)
      .returns<{ id: string; file_name: string | null }[]>();
    if (error) return { error: error.message };
    for (const a of data ?? []) if (a.file_name) photos.push({ id: a.id, fileName: a.file_name });
    if ((data?.length ?? 0) < PAGE) break;
  }

  const kinds: BillKind[] = (kindsR.data ?? []).map((k) => ({ id: k.id, key: k.key, label: k.label, parentId: k.parent_id, sort: k.sort, archived: k.archived_at != null }));
  return {
    kinds,
    places: (placesR.data ?? []).filter((p) => !p.archived_at).map((p) => ({ id: p.id, name: p.name })),
    accounts: (accountsR.data ?? []).filter((a) => !a.archived_at).map((a) => ({ id: a.id, label: accountLabel(a.supplier, a.account_ref), premisesId: a.premises_id })),
    photos,
    mayFile: (route: ImportRoute) => mayFileRoute(perms, route),
  };
}
