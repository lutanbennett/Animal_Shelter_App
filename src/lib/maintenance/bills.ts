import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { driveImageUrl } from "@/lib/google/drive-client";
import type { BillPhoto } from "@/components/BillPhotosSection";

export type JobBill = {
  id: string;
  amount: number;
  date: string;
  note: string | null;
  photos: BillPhoto[];
};

/** What maintenance_job_cost (0189) says: the sum of the bills once there are any, else the typed number. */
export type JobCost = {
  billCount: number;
  billsTotal: number;
  typedActual: number | null;
  actual: number | null;
  fromBills: boolean;
};

/**
 * A job's bills and its cost. Called only for a login holding maintenance.bills: the Heads and the
 * 2IC never reach this, so no bill amount is read for them at all (the database would return none
 * either, 0189's policy).
 */
export async function loadJobBills(
  supabase: SupabaseClient,
  jobId: string,
): Promise<{ bills: JobBill[]; cost: JobCost | null }> {
  const [billsResult, costResult] = await Promise.all([
    supabase
      .from("maintenance_bills")
      .select("id, amount, bill_date, note")
      .eq("maintenance_id", jobId)
      .order("bill_date", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<{ id: string; amount: number | string; bill_date: string; note: string | null }[]>(),
    supabase
      .from("maintenance_job_cost")
      .select("bill_count, bills_total, typed_actual_cost, actual_cost, from_bills")
      .eq("maintenance_id", jobId)
      .maybeSingle<{
        bill_count: number;
        bills_total: number | string;
        typed_actual_cost: number | string | null;
        actual_cost: number | string | null;
        from_bills: boolean;
      }>(),
  ]);

  const rows = billsResult.data ?? [];
  const photosByBill = new Map<string, BillPhoto[]>();
  if (rows.length > 0) {
    const { data } = await supabase
      .from("attachments")
      .select("id, owner_id, drive_file_id, file_name")
      .eq("owner_type", "maintenance_bill")
      .in(
        "owner_id",
        rows.map((r) => r.id),
      )
      .order("created_at", { ascending: true })
      .returns<{ id: string; owner_id: string; drive_file_id: string; file_name: string | null }[]>();
    for (const a of data ?? []) {
      const list = photosByBill.get(a.owner_id) ?? [];
      list.push({
        id: a.id,
        url: driveImageUrl(a.drive_file_id),
        name: a.file_name ?? "",
        isPdf: /\.pdf$/i.test(a.file_name ?? ""),
      });
      photosByBill.set(a.owner_id, list);
    }
  }

  const c = costResult.data;
  const num = (v: number | string | null) => (v == null ? null : Number(v));
  return {
    bills: rows.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      date: r.bill_date,
      note: r.note,
      photos: photosByBill.get(r.id) ?? [],
    })),
    cost: c
      ? {
          billCount: c.bill_count,
          billsTotal: Number(c.bills_total),
          typedActual: num(c.typed_actual_cost),
          actual: num(c.actual_cost),
          fromBills: c.from_bills,
        }
      : null,
  };
}
