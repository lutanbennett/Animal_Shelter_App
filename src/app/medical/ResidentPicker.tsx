import Image from "next/image";
import Link from "next/link";
import { PawPrint, Search } from "lucide-react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { placeName } from "@/lib/enclosures/names";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import { groupByPlace, matchesQuery, type PickableResident } from "@/lib/medical/residents";
import { ACTION_ICONS } from "@/components/hub-icons";

/**
 * "Who?" for the Head of Medical's phone jobs: residents as big photo tiles, by zone then
 * enclosure, with a name search that is a plain GET form (no client code). A tile is a link to
 * `${base}?resident=<id>`. The residents come from `resident_who_and_where`, so this shows what
 * her login may see and nothing else (src/lib/medical/residents.ts).
 */
export function ResidentPicker({
  t,
  locale,
  base,
  residents,
  query,
  error,
}: {
  t: Dictionary;
  locale: Locale;
  base: string;
  residents: PickableResident[];
  query: string;
  error: string | null;
}) {
  const p = t.medicalJobs.picker;
  const shown = residents.filter((r) => matchesQuery(r, query));
  const nameOf = (r: PickableResident) => (locale === "th" && r.thaiName?.trim() ? r.thaiName.trim() : r.name);
  const otherName = (r: PickableResident) =>
    locale === "th" && r.thaiName?.trim() ? r.name : r.thaiName?.trim() || null;

  return (
    <div className="flex flex-col gap-4">
      <form method="get" action={base} role="search" className="flex flex-col gap-2">
        <label htmlFor="resident-search" className="text-base font-semibold text-foreground">
          {p.searchLabel}
        </label>
        <div className="flex gap-2">
          <input
            id="resident-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={p.searchPlaceholder}
            className="min-h-12 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-lg text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            aria-label={p.search}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg bg-primary px-3 text-primary-foreground"
          >
            <Search aria-hidden className="h-6 w-6" />
          </button>
        </div>
        {query && (
          <Link
            href={base}
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-medium text-primary hover:underline"
          >
            <ACTION_ICONS.clear aria-hidden="true" className="h-4 w-4 shrink-0" />
            {p.clear}
          </Link>
        )}
      </form>

      {error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {p.couldntLoad}: {error}
        </p>
      )}
      {!error && shown.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-4 text-muted">
          {query ? p.noMatch : p.empty}
        </p>
      )}

      {groupByPlace(shown).map((zone) => (
        <section key={zone.zone?.name ?? "none"} className="flex flex-col gap-3">
          <h2 className="break-words border-b border-border pb-1 text-xl font-semibold text-foreground">
            {zone.zone ? placeName(locale, zone.zone.name, zone.zone.nameTh) : p.elsewhere}
          </h2>
          {zone.enclosures.map((e) => (
            <div key={e.enclosure?.name ?? "none"} className="flex flex-col gap-2">
              {e.enclosure && (
                <h3 className="break-words text-lg font-semibold text-foreground">
                  {placeName(locale, e.enclosure.name, e.enclosure.nameTh)}
                </h3>
              )}
              <ul className="grid grid-cols-2 gap-2">
                {e.residents.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`${base}?resident=${r.id}`}
                      className="flex h-full flex-col items-center gap-2 rounded-lg border border-border bg-surface p-2 text-center"
                    >
                      <span className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                        {r.photoFileId ? (
                          <Image
                            src={driveImageUrl(r.photoFileId, 400)}
                            alt={p.photoAlt(nameOf(r))}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <PawPrint aria-label={p.noPhoto} role="img" className="h-10 w-10 text-muted" />
                        )}
                      </span>
                      <span className="w-full break-words text-lg font-semibold leading-tight text-foreground">
                        {nameOf(r)}
                      </span>
                      {otherName(r) && (
                        <span className="w-full break-words text-xs text-muted">{otherName(r)}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
