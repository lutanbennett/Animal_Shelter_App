import Image from "next/image";
import Link from "next/link";
import { PawPrint, Utensils } from "lucide-react";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { dietUnitLabel } from "@/lib/i18n/enum-labels";
import { statusLabel } from "@/lib/i18n/enum-labels";
import { placeName } from "@/lib/enclosures/names";
import { driveImageUrl } from "@/lib/google/drive-client";
import { RoundIcon, RoundStrip } from "@/components/medication/RoundIcons";
import { loadSpecialDiets, type DietResident, type SpecialDiet } from "@/lib/diets/special-list";
import { roundsFor, suggestRound, type RoundKey } from "@/lib/rounds/suggest";
import { refuse } from "@/lib/auth/require-role";
import { requirePermission } from "@/lib/permissions/require";

/**
 * Feed Special Diets, a job of the Head of Medical (docs/decisions/2026-10-04-medical-jobs-app.md):
 * who is on a diet that is not the standard one, how much a meal, and which meals, by zone then
 * enclosure. A reference, not a record: nothing is ticked as fed (the medication list's ruling),
 * so this page has no form, no action and no client component.
 *
 * The meal is asked, not inferred (`?round=`): the clock only pre-selects, as on the medication
 * list. Food has two rounds, morning and evening. Pictures first: the amount sits beside a bowl
 * and the meals are the sunrise / moon strip the medication list uses.
 */
export default async function SpecialDietsPage(props: PageProps<"/medical/diets">) {
  const { perms } = await requirePermission("medical.diet", "read");
  // The view is for a login that sees every clinic (0140); a vet would get an empty page.
  if (perms.scopes.clinical !== "any") refuse(perms.role.key);
  const { t, locale } = await getT();
  const d = t.medicalJobs.diets;

  const sp = await props.searchParams;
  const rounds = roundsFor("food");
  const chosen = rounds.find((k) => k === sp.round) ?? null;
  const round: RoundKey = chosen ?? suggestRound("food");
  const href = (r: RoundKey) => `/medical/diets?round=${r}`;

  const supabase = await createClient();
  const list = await loadSpecialDiets(supabase, round);
  const roundsText = (ks: readonly RoundKey[]) => ks.map((k) => d.rounds[k]).join(", ");

  const residentName = (r: DietResident) =>
    locale === "th" && r.thaiName?.trim() ? r.thaiName.trim() : r.name;
  const secondName = (r: DietResident) =>
    locale === "th" && r.thaiName?.trim() ? r.name : r.thaiName?.trim() || null;
  const number = (n: number) => String(Number(n.toFixed(2)));

  const dietRow = (diet: SpecialDiet) => {
    const meals = diet.mealsPerDay && diet.mealsPerDay > 0 ? diet.mealsPerDay : null;
    const perMeal = diet.dailyQuantity != null && meals ? diet.dailyQuantity / meals : diet.dailyQuantity;
    const unit = dietUnitLabel(t, diet.unit);
    const amount = perMeal != null ? `${number(perMeal)} ${unit}` : d.amountMissing;
    return (
      <li key={diet.residentDietId} className="flex flex-col gap-1">
        <p className="break-words text-lg font-medium text-foreground">{diet.name}</p>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1" role="group" aria-label={d.amountPicture(amount)}>
          <Utensils aria-hidden className="h-8 w-8 shrink-0 text-foreground" />
          <span className="break-words text-xl font-semibold text-foreground">{amount}</span>
        </span>
        {diet.rounds.length > 0 ? (
          <div className="mt-1">
            <RoundStrip rounds={diet.rounds} names={d.rounds} label={d.eatsAt(roundsText(diet.rounds))} />
          </div>
        ) : (
          <p className="mt-1 inline-block self-start rounded-full border-2 border-red-400 px-2 py-0.5 text-sm font-medium text-red-800">
            {d.noRoundHeading}
          </p>
        )}
        {meals && <p className="text-sm text-muted">{d.mealsPerDay(meals)}</p>}
        {diet.notes && <p className="break-words text-sm text-muted">{diet.notes}</p>}
      </li>
    );
  };

  const residentCard = (r: DietResident, status?: string) => (
    <li key={r.id} className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {r.photoFileId ? (
            <Image
              src={driveImageUrl(r.photoFileId, 160)}
              alt={d.photoAlt(residentName(r))}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <PawPrint aria-label={d.noPhoto} role="img" className="h-8 w-8 text-muted" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-xl font-semibold text-foreground">{residentName(r)}</h3>
          {secondName(r) && <p className="break-words text-sm text-muted">{secondName(r)}</p>}
          {status && <p className="text-sm text-muted">{status}</p>}
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-3 border-t border-border pt-3">{r.diets.map(dietRow)}</ul>
    </li>
  );

  const noRoundCount = [...list.zones.flatMap((z) => z.enclosures.flatMap((e) => e.residents)), ...list.apart].reduce(
    (n, r) => n + r.diets.filter((x) => x.rounds.length === 0).length,
    0,
  );

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{d.title}</h1>
        <p className="text-lg font-medium text-foreground">{d.today(formatDate(list.today, locale))}</p>
        <p className="text-sm text-muted">{d.subtitle}</p>
      </div>

      <nav aria-label={d.roundLabel} className="flex flex-col gap-2">
        <p className="text-base font-semibold text-foreground">{d.roundLabel}</p>
        <ul className="grid grid-cols-2 gap-2">
          {rounds.map((k) => (
            <li key={k}>
              <Link
                href={href(k)}
                aria-current={k === round ? "true" : undefined}
                className={
                  k === round
                    ? "flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border-2 border-foreground bg-foreground px-1 text-background"
                    : "flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface px-1 text-foreground"
                }
              >
                <RoundIcon round={k} className="h-7 w-7" />
                <span className="break-words text-center text-sm font-semibold">{d.rounds[k]}</span>
              </Link>
            </li>
          ))}
        </ul>
        {!chosen && <p className="text-sm text-muted">{d.suggested}</p>}
      </nav>

      {list.error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {d.couldntLoad}: {list.error}
        </p>
      )}
      {noRoundCount > 0 && !list.error && (
        <p role="alert" className="rounded border-2 border-red-400 bg-red-50 p-3 text-sm text-red-800">
          {d.noRoundHeading}: {noRoundCount}. {d.noRoundNote}
        </p>
      )}
      {!list.error && list.zones.length === 0 && list.apart.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-4 text-muted">{d.empty}</p>
      )}

      {list.zones.map((zone) => (
        <section key={zone.zone.name} className="flex flex-col gap-4">
          <h2 className="break-words border-b border-border pb-1 text-xl font-semibold text-foreground">
            {placeName(locale, zone.zone.name, zone.zone.nameTh)}
          </h2>
          {zone.enclosures.map((e) => (
            <div key={e.enclosure.name} className="flex flex-col gap-2">
              <h3 className="flex flex-wrap items-baseline justify-between gap-x-3 text-lg font-semibold text-foreground">
                <span className="min-w-0 break-words">{placeName(locale, e.enclosure.name, e.enclosure.nameTh)}</span>
                <span className="text-sm font-normal text-muted">{d.residentsCount(e.residents.length)}</span>
              </h3>
              <ul className="flex flex-col gap-3">{e.residents.map((r) => residentCard(r))}</ul>
            </div>
          ))}
        </section>
      ))}

      {list.apart.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="break-words border-b border-border pb-1 text-xl font-semibold text-foreground">
              {d.apartHeading}
            </h2>
            <p className="mt-1 text-sm text-muted">{d.apartNote}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {list.apart.map((r) => residentCard(r, r.status ? statusLabel(t, r.status) : d.noEnclosure))}
          </ul>
        </section>
      )}
    </main>
  );
}
