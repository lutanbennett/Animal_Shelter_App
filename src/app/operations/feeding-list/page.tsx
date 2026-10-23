import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { formatDate } from "@/lib/format";
import { placeName } from "@/lib/enclosures/names";
import { ZoneName } from "@/components/ZoneName";
import { RoundIcon } from "@/components/medication/RoundIcons";
import { driveImageUrl } from "@/lib/google/drive-client";
import { loadFeedingList } from "@/lib/diets/feeding-list";
import type { DietBlock, FedDog } from "@/lib/diets/feeding-build";
import { formatAmount } from "@/lib/diets/servings";
import { roundsFor, suggestRound, type RoundKey } from "@/lib/rounds/suggest";
import { refuseFor } from "@/lib/auth/require-role";
import { requirePermission } from "@/lib/permissions/require";

/**
 * Operations → Feeding list (docs/decisions/2026-10-23-feeding-list.md): what each zone's food batch
 * needs for ONE meal, diet by diet, and what each dog is plated. "The food is made in batches for a zone
 * and then plated up" (Lutan, 2026-10-22), so one page serves both: "Batch for each zone" is the cook's
 * view, "Plate by dog" is the plater's.
 *
 * A reference, not a record, like the medication list it is modelled on: no form, no action, no client
 * component. The meal is ASKED, not inferred: `?round=` is the person's choice, the clock only
 * pre-selects (food has no lunch). Totals are exact sums of the unrounded per-dog amounts and are
 * rounded once, here, when printed (formatAmount). Opens for medical.diet Read, as /medical/diets does.
 */
export default async function FeedingListPage(props: PageProps<"/operations/feeding-list">) {
  const { perms } = await requirePermission("medical.diet", "read");
  // The diet rows are for a login that sees every clinic (0140); a doctor would get an empty page.
  if (perms.scopes.clinical !== "any") refuseFor(perms);
  const { t, locale } = await getT();
  const f = t.management.feedingList;

  const sp = await props.searchParams;
  const rounds = roundsFor("food");
  const chosen = rounds.find((k) => k === sp.round) ?? null;
  const round: RoundKey = chosen ?? suggestRound("food");
  const view = sp.view === "dogs" ? "dogs" : "batch";
  const href = (r: RoundKey, v: string) => `/operations/feeding-list?round=${r}&view=${v}`;

  const supabase = await createClient();
  const list = await loadFeedingList(supabase, round, locale);
  const everyone = [...list.zones.flatMap((z) => z.dogs), ...list.apart.dogs];
  const anyNoRound = everyone.some((d) => d.noRound);

  const dogName = (d: FedDog) => (locale === "th" && d.thaiName?.trim() ? d.thaiName.trim() : d.name);
  const dogSecond = (d: FedDog) => (locale === "th" && d.thaiName?.trim() ? d.name : d.thaiName?.trim() || null);

  const dietBlock = (b: DietBlock) => (
    <div key={b.diet.id} className="rounded-lg border-2 border-foreground bg-surface p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h4 className="min-w-0 break-words text-lg font-semibold text-foreground">
          {b.diet.name}
          {b.diet.isStandard && (
            <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
              {f.standardTag}
            </span>
          )}
        </h4>
        <span className="text-sm text-muted">{f.dogCount(b.dogCount)}</span>
      </div>
      {b.lines.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{f.noLines}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {b.lines.map((l) => (
            <li key={l.ingredientId + l.unit} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 break-words text-lg text-foreground">{l.name}</span>
              <span className="shrink-0 text-xl font-semibold text-foreground">
                {formatAmount(l.total)} <span className="text-base font-medium">{l.unit}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const dogCard = (d: FedDog) => (
    <li key={d.id + d.diet.id} className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {d.photoFileId ? (
            <Image src={driveImageUrl(d.photoFileId, 160)} alt={f.photoAlt(dogName(d))} fill sizes="64px" className="object-cover" />
          ) : (
            <PawPrint aria-label={f.noPhoto} role="img" className="h-7 w-7 text-muted" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-xl font-semibold text-foreground">{dogName(d)}</h3>
          {dogSecond(d) && <p className="break-words text-sm text-muted">{dogSecond(d)}</p>}
          <p className="flex flex-wrap items-center gap-1 text-sm text-muted">
            <span className="break-words">{d.diet.name}</span>
            {d.portionFactor != null && d.portionFactor !== 1 && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground">
                {f.portionTag(formatAmount(d.portionFactor))}
              </span>
            )}
            {d.noRound && (
              <span className="rounded-full border-2 border-red-400 px-2 py-0.5 text-xs font-medium text-red-800">
                {f.noRoundTag}
              </span>
            )}
          </p>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
        {d.lines.map((l) => (
          <li key={l.ingredientId + l.unit} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 break-words text-lg text-foreground">{l.name}</span>
            <span className="shrink-0 text-xl font-semibold text-foreground">
              {formatAmount(l.amount)} <span className="text-base font-medium">{l.unit}</span>
            </span>
          </li>
        ))}
      </ul>
      {d.notes && <p className="mt-2 break-words text-sm text-foreground">{d.notes}</p>}
    </li>
  );

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{f.title}</h1>
        <p className="text-lg font-medium text-foreground">{f.today(formatDate(list.today, locale))}</p>
        <p className="text-sm text-muted">{f.subtitle}</p>
      </div>

      <nav aria-label={f.roundLabel} className="flex flex-col gap-2">
        <p className="text-base font-semibold text-foreground">{f.roundLabel}</p>
        <ul className="grid grid-cols-2 gap-2">
          {rounds.map((k) => (
            <li key={k}>
              <Link
                href={href(k, view)}
                aria-current={k === round ? "true" : undefined}
                className={
                  k === round
                    ? "flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border-2 border-foreground bg-foreground px-1 text-background"
                    : "flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface px-1 text-foreground"
                }
              >
                <RoundIcon round={k} className="h-7 w-7" />
                <span className="break-words text-center text-sm font-semibold">{f.rounds[k]}</span>
              </Link>
            </li>
          ))}
        </ul>
        {!chosen && <p className="text-sm text-muted">{f.suggested}</p>}
        <div className="grid grid-cols-2 gap-2">
          {(["batch", "dogs"] as const).map((v) => (
            <Link
              key={v}
              href={href(round, v)}
              aria-current={v === view ? "page" : undefined}
              className={
                v === view
                  ? "rounded-lg border-2 border-foreground px-2 py-2 text-center text-sm font-semibold text-foreground"
                  : "rounded-lg border border-border px-2 py-2 text-center text-sm text-muted"
              }
            >
              {v === "batch" ? f.viewBatch : f.viewDogs}
            </Link>
          ))}
        </div>
      </nav>

      {list.error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {f.couldntLoad}: {list.error}
        </p>
      )}

      {!list.error && (
        <section className="flex flex-col gap-1">
          <h2 className="break-words text-xl font-semibold text-foreground">
            {view === "batch" ? f.batchHeading(f.rounds[round]) : f.dogsHeading(f.rounds[round])}
          </h2>
          <p className="text-sm text-muted">{view === "batch" ? f.batchIntro : f.dogsIntro}</p>
        </section>
      )}

      {anyNoRound && !list.error && (
        <p role="alert" className="rounded border-2 border-red-400 bg-red-50 p-3 text-sm text-red-800">
          {f.noRoundTag}. {f.noRoundNote}
        </p>
      )}

      {!list.error && everyone.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-4 text-muted">{f.empty}</p>
      )}

      {!list.error &&
        list.zones.map((z) => (
          <section key={z.zone.name} className="flex flex-col gap-3">
            <h3 className="break-words border-b border-border pb-1 text-xl font-semibold text-foreground">
              <ZoneName name={placeName(locale, z.zone.name, z.zone.nameTh)} colour={z.zone.colour} />
            </h3>
            {view === "batch" ? (
              <>
                {z.blocks.map(dietBlock)}
                <details className="rounded-lg border border-border">
                  <summary className="cursor-pointer px-3 py-2 text-base font-semibold text-foreground">
                    {f.byEnclosure}
                  </summary>
                  <div className="flex flex-col gap-4 p-3 pt-1">
                    {z.enclosures.map((e) => (
                      <div key={e.enclosure.name} className="flex flex-col gap-2">
                        <h4 className="flex flex-wrap items-baseline justify-between gap-x-3 text-lg font-semibold text-foreground">
                          <span className="min-w-0 break-words">{placeName(locale, e.enclosure.name, e.enclosure.nameTh)}</span>
                          <span className="text-sm font-normal text-muted">{f.dogCount(e.dogs.length)}</span>
                        </h4>
                        {e.blocks.map(dietBlock)}
                      </div>
                    ))}
                  </div>
                </details>
              </>
            ) : (
              z.enclosures.map((e) => (
                <div key={e.enclosure.name} className="flex flex-col gap-2">
                  <h4 className="flex flex-wrap items-baseline justify-between gap-x-3 text-lg font-semibold text-foreground">
                    <span className="min-w-0 break-words">{placeName(locale, e.enclosure.name, e.enclosure.nameTh)}</span>
                    <span className="text-sm font-normal text-muted">{f.dogCount(e.dogs.length)}</span>
                  </h4>
                  <ul className="flex flex-col gap-3">{e.dogs.map(dogCard)}</ul>
                </div>
              ))
            )}
          </section>
        ))}

      {!list.error && list.apart.dogs.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h3 className="break-words border-b border-border pb-1 text-xl font-semibold text-foreground">
              {f.apartHeading}
            </h3>
            <p className="mt-1 text-sm text-muted">{f.apartNote}</p>
          </div>
          {view === "batch" ? list.apart.blocks.map(dietBlock) : <ul className="flex flex-col gap-3">{list.apart.dogs.map(dogCard)}</ul>}
        </section>
      )}

      <p className="text-xs text-muted">{f.carryNote}</p>
    </main>
  );
}
