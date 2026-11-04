import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { formatDate } from "@/lib/format";
import { requirePermission } from "@/lib/permissions/require";
import { loadPhotoCounts, loadStaffEvents } from "@/lib/events/staff";

/**
 * Management → Events: every fundraising event, newest first. Opens for whoever holds events.run (the
 * run_fundraising_events card). Everything on the page is read and written by that one activity.
 */
export default async function EventsPage() {
  const { supabase } = await requirePermission("events.run");
  const { t, locale } = await getT();
  const a = t.eventsAdmin;

  const events = await loadStaffEvents(supabase);
  const counts = await loadPhotoCounts(supabase, events.map((e) => e.id));

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management">{t.nav.management}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground">{a.title}</h1>
        <p className="text-sm text-muted">{a.subtitle}</p>
      </div>
      <Link
        href="/management/events/new"
        className="inline-flex min-h-11 items-center self-start rounded bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover"
      >
        {a.start}
      </Link>

      {events.length === 0 ? (
        <p className="max-w-2xl rounded border border-border bg-surface p-4 text-sm text-muted">{a.noneYet}</p>
      ) : (
        <ul className="grid max-w-4xl gap-3 sm:grid-cols-2">
          {events.map((e) => (
            <li key={e.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-foreground">{a.status[e.status]}</span>
                <span className="text-xs text-muted">{e.published ? a.onSite.yes : a.onSite.no}</span>
              </div>
              <Link href={`/management/events/${e.id}`} className="text-lg font-semibold text-foreground underline-offset-4 hover:underline" lang="und">
                {e.title}
              </Link>
              <p className="text-sm text-muted">
                {e.end_date ? a.dateRange(formatDate(e.event_date, locale), formatDate(e.end_date, locale)) : formatDate(e.event_date, locale)}
                {e.location ? ` · ${e.location}` : ""}
              </p>
              <p className="text-sm text-muted">{a.photoCount(counts.get(e.id) ?? 0)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
