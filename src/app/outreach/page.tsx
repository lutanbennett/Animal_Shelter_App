import Link from "next/link";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import { formatDate } from "@/lib/format";
import { helpGiven, loadOutings } from "@/lib/outreach/outings";

/**
 * /outreach: the outreach visit notes, newest first (0169). Whoever holds
 * community.outings at Read sees them; at Edit they also record and correct
 * them. Which roles those are is a Settings answer (Settings → Security),
 * not a role named here.
 */
export default async function OutreachPage() {
  const { t, locale } = await getT();
  const { supabase, perms } = await requirePermission("community.outings", "read");
  const canWrite = can(perms, "community.outings");
  const o = t.outreach;

  const { outings, error } = await loadOutings(supabase);
  const dogs = outings.reduce((sum, x) => sum + x.dog_count, 0);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{o.title}</h1>
          <p className="text-sm text-muted">{o.subtitle}</p>
        </div>
        {canWrite && (
          <ActionLink href="/outreach/new" label={o.record} icon={ACTION_ICONS.add} variant="primary" iconOnlyOnMobile={false} />
        )}
      </div>

      {error && (
        <p className="text-sm text-danger">
          {o.couldntLoad}: {error}
        </p>
      )}

      {outings.length === 0 ? (
        <p className="text-sm text-muted">{o.empty}</p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">{o.totals(dogs, outings.length)}</p>
            <p className="text-xs text-muted">{o.totalsNote}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {outings.map((x) => {
              const place = x.community_places;
              return (
                <li key={x.id} className="flex flex-col gap-2 rounded border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {place?.name ?? "—"}
                        {place && <span className="ml-2 text-xs font-normal text-muted">{o.kinds[place.kind]}</span>}
                      </p>
                      <p className="text-sm text-muted">{formatDate(x.outing_on, locale)}</p>
                    </div>
                    {canWrite && (
                      <Link
                        href={`/outreach/${x.id}/edit`}
                        className="inline-flex min-h-11 shrink-0 items-center rounded px-3 text-sm font-medium text-primary hover:bg-primary/10"
                      >
                        {o.edit}
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-foreground">
                    {o.dogsHelped(x.dog_count)}
                    {x.sterilised_count != null && <> · {o.sterilisedOf(x.sterilised_count)}</>}
                  </p>
                  <p className="text-sm text-muted">{helpGiven(x).map((k) => o.help[k]).join(", ")}</p>
                  {x.note && <p className="whitespace-pre-line text-sm text-foreground">{x.note}</p>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {!canWrite && <p className="text-xs text-muted">{o.readOnly}</p>}
    </main>
  );
}
