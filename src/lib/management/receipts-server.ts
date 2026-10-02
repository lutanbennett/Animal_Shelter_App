import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReceiptFigure } from "@/lib/management/purchasing";
import type { ItemKind } from "@/lib/units";

type ReceiptQueryRow = {
  medication_id: string | null;
  diet_type_id: string | null;
  quantity: number | string;
  received_at: string;
  supplier_contact_id: string | null;
};

const PAGE = 1000;

/**
 * Every delivery of one kind (0096), newest first, reduced to what the
 * stock sums need. Paged because PostgREST caps a response at 1000 rows and
 * a delivery list only grows; a silently cut-off list would under-count
 * what has arrived since a count. Quantities are base units (0118).
 */
export async function loadReceipts(
  supabase: SupabaseClient,
  kind: ItemKind,
): Promise<{ data: ReceiptFigure[]; error: string | null }> {
  const data: ReceiptFigure[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: rows, error } = await supabase
      .from("stock_receipts")
      .select("medication_id, diet_type_id, quantity, received_at, supplier_contact_id")
      .eq("item_kind", kind === "medication" ? "medication" : "diet_type")
      .order("received_at", { ascending: false })
      .range(from, from + PAGE - 1)
      .returns<ReceiptQueryRow[]>();
    if (error) return { data: [], error: error.message };
    for (const row of rows ?? []) {
      const itemId = row.medication_id ?? row.diet_type_id;
      if (!itemId) continue;
      data.push({
        item_id: itemId,
        quantity: Number(row.quantity),
        received_at: row.received_at,
        supplier_contact_id: row.supplier_contact_id,
      });
    }
    if ((rows?.length ?? 0) < PAGE) return { data, error: null };
  }
}
