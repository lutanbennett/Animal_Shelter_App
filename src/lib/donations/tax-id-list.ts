import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { TaxHolderKind } from "./tax-id";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type TaxIdListRow = {
  donationId: string;
  taxId: string;
  holderKind: TaxHolderKind;
  recordedOn: string | null;
  donorName: string;
  receivedOn: string;
  /** null for a gift in kind. */
  amount: number | null;
};

type Raw = {
  donation_id: string;
  tax_id: string;
  holder_kind: TaxHolderKind;
  recorded_on: string | null;
  donations: { donor_name: string; received_on: string; donation_lines: { amount: number | string | null }[] } | null;
};

/**
 * "Still to record" is a query, not a view (0381): rows with no recorded_on, with the donor's
 * name and date from donations and the amount from donation_lines. The recently recorded come
 * back too, newest first, so a mistaken press can be seen. RLS asks donation.receipt.
 */
export async function loadTaxIdList(supabase: Supabase, recorded: boolean) {
  let q = supabase
    .from("donation_tax_ids")
    .select("donation_id, tax_id, holder_kind, recorded_on, donations(donor_name, received_on, donation_lines(amount))");
  q = recorded ? q.not("recorded_on", "is", null).order("recorded_on", { ascending: false }).limit(20) : q.is("recorded_on", null);
  const { data, error } = await q.returns<Raw[]>();
  if (error) return { rows: [] as TaxIdListRow[], error };
  const rows = (data ?? [])
    .filter((r) => r.donations)
    .map((r): TaxIdListRow => {
      const amounts = r.donations!.donation_lines.map((l) => (l.amount == null ? null : Number(l.amount)));
      const inKind = amounts.every((a) => a == null);
      return {
        donationId: r.donation_id,
        taxId: r.tax_id,
        holderKind: r.holder_kind,
        recordedOn: r.recorded_on,
        donorName: r.donations!.donor_name,
        receivedOn: r.donations!.received_on,
        amount: inKind ? null : amounts.reduce<number>((s, a) => s + Math.round((a ?? 0) * 100), 0) / 100,
      };
    });
  if (!recorded) rows.sort((a, b) => a.receivedOn.localeCompare(b.receivedOn));
  return { rows, error: null };
}
