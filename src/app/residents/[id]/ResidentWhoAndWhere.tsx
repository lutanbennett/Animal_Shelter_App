import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { placeName } from "@/lib/enclosures/names";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import { driveImageUrl } from "@/lib/google/drive-client";
import { sexLabel, speciesLabel, statusLabel } from "@/lib/i18n/enum-labels";
import { WHO_AND_WHERE_COLUMNS, type WhoAndWhere } from "@/lib/residents/who-and-where";

/**
 * A resident's page for a volunteer: who it is and where it lives, from `resident_who_and_where`
 * (0134, §5) and nothing else. Not the hub with parts hidden: the hub reads columns and tables the
 * volunteer no longer holds, so this page is its own, and a new column on `residents` stays out of
 * it until the view carries it.
 */
export async function ResidentWhoAndWhere({ id }: { id: string }) {
  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const { data, error } = await supabase
    .from("resident_who_and_where")
    .select(WHO_AND_WHERE_COLUMNS)
    .eq("id", id)
    .limit(1)
    .returns<WhoAndWhere[]>();
  if (error) throw new Error(error.message);
  const resident = data?.[0];
  if (!resident) notFound();

  const w = t.residents.whoAndWhere;
  const displayName = resident.thai_name ? `${resident.name} (${resident.thai_name})` : resident.name;
  const enclosureName = placeName(locale, resident.enclosure_name, resident.enclosure_name_th);
  // Hospital, fostered and adopted residents sit in the Lifecycle pseudo-zone: the status says it.
  const zoneName =
    resident.zone_name === SYSTEM_ZONE ? "" : placeName(locale, resident.zone_name, resident.zone_name_th);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link href="/residents" className="text-sm text-muted hover:text-foreground">
        {t.residents.hub.backToResidents}
      </Link>

      <div className="flex min-w-0 gap-4 rounded-lg border border-border bg-surface p-5">
        {resident.profile_photo_drive_file_id ? (
          <img
            src={driveImageUrl(resident.profile_photo_drive_file_id)}
            alt={displayName}
            className="h-20 w-20 shrink-0 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-hover text-center text-xs text-muted">
            {t.residents.hub.noPhoto}
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="min-w-0 break-words text-2xl font-semibold text-foreground">{displayName}</h1>
            <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted">
              {resident.resident_code}
            </span>
          </div>
          <p className="text-sm text-muted">
            {[speciesLabel(t, resident.species), sexLabel(t, resident.sex)].filter(Boolean).join(" · ") ||
              t.residents.hub.speciesUnknown}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">{w.where}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">{w.status}</dt>
          <dd className="text-foreground">
            {resident.current_status ? statusLabel(t, resident.current_status) : t.common.dash}
          </dd>
          <dt className="text-muted">{w.enclosure}</dt>
          <dd className="text-foreground">
            {resident.enclosure_id ? (
              <Link href={`/enclosures/${resident.enclosure_id}`} className="font-medium text-primary hover:underline">
                {enclosureName}
              </Link>
            ) : (
              w.notInEnclosure
            )}
          </dd>
          {zoneName && (
            <>
              <dt className="text-muted">{w.zone}</dt>
              <dd className="text-foreground">{zoneName}</dd>
            </>
          )}
        </dl>
      </section>

      <p className="text-sm text-muted">{w.scope}</p>
    </main>
  );
}
