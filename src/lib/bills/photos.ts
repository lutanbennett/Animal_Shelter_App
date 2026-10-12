import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { driveImageUrl } from "@/lib/google/drive-client";
import type { BillPhoto } from "@/components/BillPhotosSection";

/** Bill photos on delivery or visit records, grouped by record, in the order they were added. One query for a whole list. */
export async function loadBillPhotos(
  supabase: SupabaseClient,
  ownerType: "stock_receipt" | "clinic_visit",
  ownerIds: string[],
): Promise<Map<string, BillPhoto[]>> {
  const byOwner = new Map<string, BillPhoto[]>();
  if (ownerIds.length === 0) return byOwner;
  const { data } = await supabase
    .from("attachments")
    .select("id, owner_id, drive_file_id, file_name")
    .eq("owner_type", ownerType)
    .in("owner_id", ownerIds)
    .order("created_at", { ascending: true })
    .returns<{ id: string; owner_id: string; drive_file_id: string; file_name: string | null }[]>();
  for (const a of data ?? []) {
    const list = byOwner.get(a.owner_id) ?? [];
    list.push({ id: a.id, url: driveImageUrl(a.drive_file_id), name: a.file_name ?? "", isPdf: /\.pdf$/i.test(a.file_name ?? "") });
    byOwner.set(a.owner_id, list);
  }
  return byOwner;
}
