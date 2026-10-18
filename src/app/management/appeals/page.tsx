import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { formatBahtExact } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { loadRaised, loadStaffAppeals } from "@/lib/appeals/staff";
import { AppealProgressDisplay } from "@/app/appeals/AppealProgressDisplay";

/**
 * Management → Appeals: every sponsorship drive, newest first, with where it
 * stands. Opens for whoever holds appeal.run (Admin by default; delegable in
 * Settings). The raised figure needs the donation register, so a login that
 * runs appeals but cannot read donations sees the appeals without the figure
 * rather than a zero that is really "not allowed to look".
 */
export default async function AppealsPage() {
  const { supabase, perms } = await requirePermission("appeal.run");
  const { t, locale } = await getT();
  const a = t.appealsAdmin;
  const canSeeGifts = can(perms, "donation.receipt");

  const appeals = await loadStaffAppeals(supabase);
  const raised = canSeeGifts ? await loadRaised(supabase, appeals.map((x) => x.id)) : null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management">{t.nav.management}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground">{a.title}</h1>
        <p className="text-sm text-muted">{a.subtitle}</p>
      </div>
      <Link
        href="/management/appeals/new"
        className="inline-flex min-h-11 items-center self-start rounded bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover"
      >
        {a.start}
      </Link>

      {appeals.length === 0 ? (
        <p className="max-w-2xl rounded border border-border bg-surface p-4 text-sm text-muted">{a.noneYet}</p>
      ) : (
        <ul className="grid max-w-4xl gap-3 sm:grid-cols-2">
          {appeals.map((x) => {
            const r = raised?.get(x.id)?.raised ?? 0;
            return (
              <li key={x.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-foreground">{a.status[x.status]}</span>
                  <span className="text-xs text-muted">{x.published ? a.onSite.yes : a.onSite.no}</span>
                </div>
                <Link href={`/management/appeals/${x.id}`} className="text-lg font-semibold text-foreground underline-offset-4 hover:underline" lang="und">
                  {x.title}
                </Link>
                <p className="text-sm text-muted">{a.forResident(x.residents?.name ?? "")}</p>
                {raised ? (
                  <div className="font-site text-foreground [--color-site-ink:var(--foreground)] [--color-site-ink-soft:var(--muted)] [--color-site-sand:var(--background)] [--color-site-line:var(--border)]">
                    <AppealProgressDisplay style="bar" compact raised={r} target={x.target_amount} locale={locale} t={t} />
                  </div>
                ) : (
                  <p className="text-sm text-muted">{formatBahtExact(x.target_amount, locale)}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
