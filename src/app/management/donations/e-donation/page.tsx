import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { formatBahtExact, formatDate } from "@/lib/format";
import { requirePermission } from "@/lib/permissions/require";
import { loadTaxIdList } from "@/lib/donations/tax-id-list";
import { RecordButton } from "./RecordButton";

/**
 * Management → Donations → Gifts to record in e-Donation. The list the app prepares for the
 * accountant (decision 2026-11-13): gifts whose donor asked for a deduction and that are not yet
 * recorded. The full ID is shown here and on the entry form only, never elsewhere.
 * Every control is drawn because the page itself needs donation.receipt, the activity each
 * action asks.
 */
export default async function EDonationPage() {
  await requirePermission("donation.receipt");
  const { t, locale } = await getT();
  const x = t.donations.taxId;
  const supabase = await createClient();
  const [todo, done] = await Promise.all([loadTaxIdList(supabase, false), loadTaxIdList(supabase, true)]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/donations">{t.donations.backToList}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground">{x.listTitle}</h1>
        <p className="text-sm text-muted">{x.listSubtitle}</p>
      </div>

      {todo.error ? (
        <p className="text-sm text-danger">{x.couldntLoad}</p>
      ) : todo.rows.length === 0 ? (
        <p className="text-sm text-muted">{x.noneToRecord}</p>
      ) : (
        <>
          <p className="rounded border border-border bg-surface px-4 py-3 text-sm text-foreground">{x.reminder}</p>
          <div>
            {/* A file download from a route handler: a plain link, not client routing. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/management/donations/e-donation/export" className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm text-foreground hover:bg-surface">
              {x.download}
            </a>
            <p className="mt-1 text-xs text-muted">{x.downloadNote}</p>
          </div>
          <ul className="flex flex-col divide-y divide-border rounded border border-border">
            {todo.rows.map((r) => (
              <li key={r.donationId} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <span className="w-24 text-sm text-muted">{formatDate(r.receivedOn, locale)}</span>
                <Link href={`/management/donations/${r.donationId}`} className="min-w-0 flex-1 font-medium text-foreground hover:underline" lang="und">
                  {r.donorName}
                </Link>
                <span className="font-mono text-sm text-foreground">{r.taxId}</span>
                <span className="text-sm text-muted">{x[r.holderKind]}</span>
                <span className="w-28 text-right text-sm text-foreground">{r.amount == null ? t.donations.inKind : formatBahtExact(r.amount, locale)}</span>
                <RecordButton donationId={r.donationId} />
              </li>
            ))}
          </ul>
        </>
      )}

      {done.rows.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">{x.recordedTitle}</h2>
          <ul className="flex flex-col divide-y divide-border rounded border border-border">
            {done.rows.map((r) => (
              <li key={r.donationId} className="flex flex-wrap items-center gap-x-4 px-4 py-2 text-sm">
                <span className="min-w-0 flex-1 text-foreground" lang="und">{r.donorName}</span>
                <span className="text-muted">{x.recordedOn(formatDate(r.recordedOn!, locale))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
