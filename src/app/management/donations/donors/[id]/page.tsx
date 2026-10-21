import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { formatBahtExact, formatDate } from "@/lib/format";
import { requirePermission } from "@/lib/permissions/require";
import { SUPPORTER_COLUMNS, type SupporterRow } from "@/lib/donations/supporters";
import type { DonationMethod } from "@/lib/donations/donations";
import { DonorForm } from "../DonorForm";

type Gift = {
  id: string;
  received_on: string;
  method: DonationMethod;
  donation_lines: { amount: number | string | null }[];
  donation_receipts: { voided_at: string | null }[];
};

/** One donor: their details, and every gift linked to them (archived or not), newest first. */
export default async function DonorPage(props: PageProps<"/management/donations/donors/[id]">) {
  await requirePermission("donation.receipt");
  const { t, locale } = await getT();
  const d = t.donations.donors;
  const { id } = await props.params;

  const supabase = await createClient();
  const [donor, gifts] = await Promise.all([
    supabase.from("supporters").select(SUPPORTER_COLUMNS).eq("id", id).maybeSingle<SupporterRow>(),
    supabase
      .from("donations")
      .select("id, received_on, method, donation_lines(amount), donation_receipts(voided_at)")
      .eq("supporter_id", id)
      .order("received_on", { ascending: false })
      .returns<Gift[]>(),
  ]);
  if (donor.error) throw new Error(donor.error.message);
  if (gifts.error) throw new Error(gifts.error.message);
  const s = donor.data;
  if (!s) notFound();

  const rows = (gifts.data ?? []).map((g) => {
    const amounts = g.donation_lines.map((l) => (l.amount == null ? null : Number(l.amount)));
    const inKind = amounts.every((a) => a == null);
    const amount = amounts.reduce<number>((sum, a) => sum + Math.round((a ?? 0) * 100), 0) / 100;
    const live = g.donation_receipts.some((r) => !r.voided_at);
    return { ...g, inKind, amount, live };
  });
  // Same rule as the donations list: a gift whose receipts are all void is being corrected, so it is not counted.
  const total = rows.filter((r) => r.live && !r.inKind).reduce((sum, r) => sum + Math.round(r.amount * 100), 0) / 100;

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/donations/donors">{d.backToList}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground" lang="und">{s.name}</h1>
        {s.archived_at && <p className="text-sm text-muted">{d.archivedNote}</p>}
      </div>

      <DonorForm
        id={s.id}
        archived={!!s.archived_at}
        initial={{ name: s.name, email: s.email ?? "", phone: s.phone ?? "", line: s.line ?? "", note: s.note ?? "" }}
      />

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">{d.history}</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">{d.historyNone}</p>
        ) : (
          <>
            <p className="text-sm text-foreground">
              {d.historyTotal(rows.length)} · {t.donations.totalBaht}: {formatBahtExact(total, locale)}
            </p>
            <ul className="flex flex-col divide-y divide-border rounded border border-border">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link href={`/management/donations/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface">
                    <span className="w-24 text-sm text-muted">{formatDate(r.received_on, locale)}</span>
                    <span className="flex-1 text-sm text-muted">{t.donations.methods[r.method]}</span>
                    <span className="text-sm text-foreground">{r.inKind ? t.donations.inKind : formatBahtExact(r.amount, locale)}</span>
                    {!r.live && <span className="rounded bg-danger/10 px-1.5 text-xs text-danger">{t.donations.status.void}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
