import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { SUPPORTER_COLUMNS, type SupporterRow } from "@/lib/donations/supporters";

/**
 * Management → Donations → Donors: the people who give (the supporters table,
 * 0244), found by name, email, phone or LINE. Archived donors are hidden
 * unless asked for; they keep their gifts.
 */
export default async function DonorsPage(props: PageProps<"/management/donations/donors">) {
  await requirePermission("donation.receipt");
  const { t } = await getT();
  const d = t.donations.donors;
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const showArchived = sp.archived === "1";

  const supabase = await createClient();
  let query = supabase.from("supporters").select(SUPPORTER_COLUMNS);
  if (!showArchived) query = query.is("archived_at", null);
  // Strip characters that mean something inside an or() filter or a like pattern.
  const safe = q.replace(/[,()%_\\*]/g, " ").trim();
  if (safe) query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%,line.ilike.%${safe}%`);
  const { data, error } = await query.order("name").limit(500).returns<SupporterRow[]>();
  // Case-insensitive order, the same one the lower(name) index serves.
  const rows = [...(data ?? [])].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  const inputClass = "min-h-11 rounded border border-border bg-background px-3 py-2 text-base text-foreground sm:text-sm";
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/donations">{d.backToDonations}</BackLink>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{d.title}</h1>
          <Link href="/management/donations/donors/new" className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
            {d.add}
          </Link>
        </div>
        <p className="text-sm text-muted">{d.subtitle}</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/management/donations/donors">
        <label className="flex flex-col gap-1 text-sm text-muted">
          {d.search}
          <input name="q" defaultValue={q} className={inputClass} lang="und" />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="archived" value="1" defaultChecked={showArchived} />
          {d.showArchived}
        </label>
        <button type="submit" className="min-h-11 rounded border border-border px-4 text-sm text-foreground hover:bg-surface">{d.find}</button>
      </form>

      {error ? (
        <p className="text-sm text-danger">{d.couldntLoad}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">{d.none}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded border border-border">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/management/donations/donors/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface">
                <span className="min-w-0 flex-1 font-medium text-foreground" lang="und">{r.name}</span>
                <span className="text-sm text-muted" lang="und">{[r.email, r.phone, r.line && `LINE ${r.line}`].filter(Boolean).join(" · ")}</span>
                {r.archived_at && <span className="rounded bg-surface px-1.5 text-xs text-muted">{d.archivedBadge}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
