import Image from "next/image";
import Link from "next/link";
import { PawPrint, Stethoscope } from "lucide-react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { placeName } from "@/lib/enclosures/names";
import { shelterTime } from "@/lib/clinics/shelter-visits";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import type { WeighFirst } from "@/lib/medical/weigh-first";

/**
 * "Weigh these first" — the residents a vet saw yesterday or today with no weight since, at the
 * top of Record Weight (docs/decisions/2026-10-16-weigh-these-first.md).
 *
 * Wide rows rather than the picker's photo grid: each one carries the clinic and time as well as
 * the name, R-code and place, and that does not fit a two-across tile on a phone. A row links to
 * `?resident=`, the weight form, exactly as a picker tile does — never to the visit or to the
 * resident's record, neither of which this page's main user may open (0134).
 */
export function WeighFirstList({
  t,
  locale,
  base,
  waiting,
  error,
  /** A search is running, so an empty list means "none of these match", not "nobody is waiting". */
  filtered,
}: {
  t: Dictionary;
  locale: Locale;
  base: string;
  waiting: WeighFirst[];
  error: string | null;
  filtered: boolean;
}) {
  const w = t.medicalJobs.weight.weighFirst;
  const p = t.medicalJobs.picker;
  if (!error && waiting.length === 0 && filtered) return null;

  const nameOf = (r: WeighFirst["resident"]) =>
    locale === "th" && r.thaiName?.trim() ? r.thaiName.trim() : r.name;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 break-words border-b border-border pb-1 text-xl font-semibold text-foreground">
          <Stethoscope aria-hidden className="h-5 w-5 shrink-0 text-primary" />
          {w.title}
        </h2>
        <p className="text-sm text-muted">{w.intro}</p>
      </div>

      {error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {w.couldntLoad}: {error}
        </p>
      )}

      {!error && waiting.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-4 text-base text-muted">{w.none}</p>
      )}

      {waiting.length > 0 && (
        <ul className="flex flex-col gap-2">
          {waiting.map((v) => {
            const r = v.resident;
            const day = v.when === "today" ? w.today : w.yesterday;
            const time = shelterTime(v.visitAt);
            return (
              <li key={r.id}>
                <Link
                  href={`${base}?resident=${r.id}`}
                  className="flex min-h-11 items-center gap-3 rounded-lg border-2 border-primary/40 bg-surface p-2"
                >
                  <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                    {r.photoFileId ? (
                      <Image
                        src={driveImageUrl(r.photoFileId, 400)}
                        alt={p.photoAlt(nameOf(r))}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <PawPrint aria-label={p.noPhoto} role="img" className="h-8 w-8 text-muted" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="break-words text-lg font-semibold leading-tight text-foreground">
                      {nameOf(r)}
                    </span>
                    {r.code && <span className="break-words text-xs text-muted">{r.code}</span>}
                    <span className="break-words text-sm text-muted">
                      {r.enclosure ? placeName(locale, r.enclosure.name, r.enclosure.nameTh) : p.elsewhere}
                    </span>
                    <span className="break-words text-sm font-medium text-foreground">
                      {v.clinicName ? w.visit(v.clinicName, day, time) : w.visitNoClinic(day, time)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
