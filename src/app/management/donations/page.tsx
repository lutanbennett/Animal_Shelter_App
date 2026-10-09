import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { addDaysIso, formatBahtExact, formatDate, todayIso } from "@/lib/format";
import { requirePermission } from "@/lib/permissions/require";
import type { DonationMethod } from "@/lib/donations/donations";

type ListRow = {
  id: string;
  received_on: string;
  donor_name: string;
  method: DonationMethod;
  donation_lines: { amount: number | string | null }[];
  donation_receipts: { id: string; number: string; voided_at: string | null; drive_file_id: string | null; sent_at: string | null; issued_at: string }[];
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Management → Donations: the gifts received in a window, newest first, each
 * with its receipt and where that receipt stands (void, on Drive, sent), and
 * the baht total. The start of the donations ledger the Cashflow forecast has
 * no income source for. Default window: the last 90 days.
 *
 * A gift whose only receipts are void is listed but left out of the total; a
 * gift in kind has no baht figure.
 */
export default async function DonationsPage(props: PageProps<"/management/donations">) {
  await requirePermission("donation.receipt");
  const { t, locale } = await getT();
  const d = t.donations;
  const sp = await props.searchParams;
  const today = todayIso();
  const from = typeof sp.from === "string" && ISO.test(sp.from) ? sp.from : addDaysIso(today, -90);
  const to = typeof sp.to === "string" && ISO.test(sp.to) ? sp.to : today;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select("id, received_on, donor_name, method, donation_lines(amount), donation_receipts(id, number, voided_at, drive_file_id, sent_at, issued_at)")
    .gte("received_on", from)
    .lte("received_on", to)
    .order("received_on", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<ListRow[]>();

  const rows = (data ?? []).map((r) => {
    const receipts = [...r.donation_receipts].sort((a, b) => b.issued_at.localeCompare(a.issued_at));
    const live = receipts.find((x) => !x.voided_at) ?? null;
    const amounts = r.donation_lines.map((l) => (l.amount == null ? null : Number(l.amount)));
    const inKind = amounts.every((a) => a == null);
    const amount = amounts.reduce<number>((s, a) => s + Math.round((a ?? 0) * 100), 0) / 100;
    return { ...r, live, latest: receipts[0] ?? null, inKind, amount };
  });
  // Only gifts with a live receipt count: a gift whose receipts are all void is being corrected.
  const total = rows.filter((r) => r.live && !r.inKind).reduce((s, r) => s + Math.round(r.amount * 100), 0) / 100;

  const inputClass = "rounded border border-border bg-background px-3 py-2 text-sm text-foreground";

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management">{t.management.landing.title}</BackLink>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{d.title}</h1>
          <Link href="/management/donations/new" className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
            {d.record}
          </Link>
        </div>
        <p className="text-sm text-muted">{d.subtitle}</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/management/donations">
        <label className="flex flex-col gap-1 text-sm text-muted">
          {d.from}
          <input type="date" name="from" defaultValue={from} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          {d.to}
          <input type="date" name="to" defaultValue={to} className={inputClass} />
        </label>
        <button type="submit" className="rounded border border-border px-4 py-2 text-sm text-foreground hover:bg-surface">
          {d.show}
        </button>
      </form>

      {error ? (
        <p className="text-sm text-danger">
          {d.couldntLoad}: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">{d.none}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded border border-border bg-surface px-4 py-3">
            <span className="text-sm text-muted">{d.totalFor(rows.length)}</span>
            <span className="text-lg font-semibold text-foreground">
              {d.totalBaht}: {formatBahtExact(total, locale)}
            </span>
            <span className="w-full text-xs text-muted">{d.totalNote}</span>
          </div>

          <ul className="flex flex-col divide-y divide-border rounded border border-border">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/management/donations/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface">
                  <span className="w-24 text-sm text-muted">{formatDate(r.received_on, locale)}</span>
                  <span className="min-w-0 flex-1 font-medium text-foreground" lang="und">
                    {r.donor_name}
                  </span>
                  <span className="text-sm text-muted">{d.methods[r.method]}</span>
                  <span className="w-28 text-right text-sm text-foreground">{r.inKind ? d.inKind : formatBahtExact(r.amount, locale)}</span>
                  <span className="flex w-full flex-wrap gap-2 text-xs sm:w-auto">
                    <span className="font-mono text-foreground">{(r.live ?? r.latest)?.number ?? d.noReceipt}</span>
                    {!r.live && r.latest && <span className="rounded bg-danger/10 px-1.5 text-danger">{d.status.void}</span>}
                    {r.live && !r.live.drive_file_id && <span className="rounded bg-warning/10 px-1.5 text-warning">{d.status.notOnDrive}</span>}
                    {r.live && (r.live.sent_at ? (
                      <span className="rounded bg-success/10 px-1.5 text-success">{d.status.sent}</span>
                    ) : (
                      <span className="rounded bg-surface px-1.5 text-muted">{d.status.notSent}</span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
