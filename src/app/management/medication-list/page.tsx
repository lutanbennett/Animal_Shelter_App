import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { formatDate } from "@/lib/format";
import { formatDose, statusLabel } from "@/lib/i18n/enum-labels";
import { placeName } from "@/lib/enclosures/names";
import { describeSchedule } from "@/lib/prescriptions/frequency";
import { driveImageUrl } from "@/lib/google/drive-client";
import { MedicationLabelThumb } from "@/components/MedicationLabelThumb";
import { AmountPicture } from "@/components/medication/AmountPicture";
import { RoundIcon, RoundStrip } from "@/components/medication/RoundIcons";
import {
  loadMedicationList,
  type ListedMedication,
  type ListedResident,
} from "@/lib/medication-list/load";
import { buildPickList, type PickLine } from "@/lib/medication-list/pick";
import { ROUND_KEYS, suggestRound, type RoundKey } from "@/lib/rounds/suggest";
import { refuse } from "@/lib/auth/require-role";
import { requirePermission } from "@/lib/permissions/require";

/**
 * Management → Medication list (docs/roles-and-permissions.md §14): who
 * needs what medicine today, for someone walking the enclosures with a phone.
 *
 * A reference, not a record. There is deliberately nothing to tap — no
 * "given", no "skipped", no reason, no history (Lutan, 2026-10-03) — so the
 * page has no form, no action and no client component. It opens for anyone
 * holding Read on medical.prescriptions: Management, Admin, Staff and the Head
 * of Medical, whose one home tile it is (docs/decisions/2026-10-04-medical-role.md).
 *
 * THE ROUND IS ASKED, NOT INFERRED (docs/decisions/2026-10-04-medication-rounds.md).
 * `?round=` is the person's choice. With none, the clock only pre-selects (suggestRound, on
 * the shelter's clock) and the chooser stays on screen, so preparing lunch at 09:00 is one tap
 * and nothing here decides for them. The chooser is plain links: still no form, no action.
 *
 * Pictures first: the helpers read neither Thai nor English, so the amount is drawn and the
 * frequency is sunrise / sun / moon; words are the fallback
 * (docs/decisions/2026-10-04-medical-round-screens.md).
 */
export default async function MedicationListPage(props: PageProps<"/management/medication-list">) {
  const { perms } = await requirePermission("medical.prescriptions", "read");
  // The list's views are for a login that sees every clinic (0136); a vet would get an empty page.
  if (perms.scopes.clinical !== "any") refuse(perms.role.key);
  const { t, locale } = await getT();
  const m = t.management.medicationList;

  const sp = await props.searchParams;
  const chosen = ROUND_KEYS.find((k) => k === sp.round) ?? null;
  const round: RoundKey = chosen ?? suggestRound("medication");
  // The round starts at the stock room, so the pick list is the front door and by-resident the second tab.
  const view = sp.view === "list" ? "list" : "pick";
  const href = (r: RoundKey, v: string) => `/management/medication-list?round=${r}&view=${v}`;

  const supabase = await createClient();
  const list = await loadMedicationList(supabase, round);
  const pick = view === "pick" ? buildPickList(list) : null;
  const roundsText = (rounds: readonly RoundKey[]) => rounds.map((k) => m.rounds[k]).join(", ");

  const residentName = (r: ListedResident) =>
    locale === "th" && r.thaiName?.trim() ? r.thaiName.trim() : r.name;
  const secondName = (r: ListedResident) =>
    locale === "th" && r.thaiName?.trim() ? r.name : r.thaiName?.trim() || null;

  const dose = (med: ListedMedication) =>
    formatDose(t, med.quantity, med.doseUnit) ?? m.amountMissing;
  const often = (med: ListedMedication) =>
    med.schedule ? describeSchedule(t, med.schedule) : (med.frequencyLabel ?? t.frequency.asNeeded);

  const pickLine = (line: PickLine) => (
    <li key={line.medicationId + line.doseUnit} className="flex items-center gap-3">
      <MedicationLabelThumb fileId={line.labelFileId} alt={m.labelAlt(line.name)} size={64} />
      <div className="min-w-0 flex-1">
        <p className="break-words text-lg font-medium text-foreground">{line.name}</p>
        <p className="text-lg font-semibold text-foreground">{m.pickDoses(line.doses)}</p>
        <p className="break-words text-sm text-muted">
          {line.amountMissing
            ? m.amountMissing
            : m.pickTotal(formatDose(t, line.total, line.doseUnit) ?? "")}
        </p>
      </div>
    </li>
  );

  const residentCard = (r: ListedResident, status?: string) => (
    <li key={r.id} className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {r.photoFileId ? (
            <Image
              src={driveImageUrl(r.photoFileId, 160)}
              alt={m.photoAlt(residentName(r))}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <PawPrint aria-label={m.noPhoto} role="img" className="h-8 w-8 text-muted" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-xl font-semibold text-foreground">{residentName(r)}</h3>
          {secondName(r) && <p className="break-words text-sm text-muted">{secondName(r)}</p>}
          {status && <p className="text-sm text-muted">{status}</p>}
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
        {r.medications.map((med) => (
          <li key={med.prescriptionId} className="flex items-center gap-3">
            <MedicationLabelThumb fileId={med.labelFileId} alt={m.labelAlt(med.name)} size={80} />
            <div className="min-w-0 flex-1">
              <p className="break-words text-lg font-medium text-foreground">{med.name}</p>
              <AmountPicture quantity={med.quantity} unit={med.doseUnit} text={dose(med)} />
              {med.place === "round" && (
                <div className="mt-1">
                  <RoundStrip
                    rounds={med.rounds}
                    names={m.rounds}
                    label={m.roundsPicture(roundsText(med.rounds))}
                  />
                </div>
              )}
              {med.place === "noRound" && (
                <p className="mt-1 inline-block rounded-full border-2 border-red-400 px-2 py-0.5 text-sm font-medium text-red-800">
                  {m.noRoundHeading}
                </p>
              )}
              {med.place === "asNeeded" && (
                <p className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-sm font-medium text-foreground">
                  {m.asNeededHeading}
                </p>
              )}
              <p className="break-words text-sm text-muted">{often(med)}</p>
              {med.lastDay && (
                <p className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground">
                  {m.lastDay}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </li>
  );

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
        <p className="text-lg font-medium text-foreground">{m.today(formatDate(list.today, locale))}</p>
        <p className="text-sm text-muted">{m.subtitle}</p>
      </div>

      <nav aria-label={m.roundLabel} className="flex flex-col gap-2">
        <p className="text-base font-semibold text-foreground">{m.roundLabel}</p>
        <ul className="grid grid-cols-3 gap-2">
          {ROUND_KEYS.map((k) => (
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
                <span className="break-words text-center text-sm font-semibold">{m.rounds[k]}</span>
              </Link>
            </li>
          ))}
        </ul>
        {!chosen && <p className="text-sm text-muted">{m.suggested}</p>}
        <div className="grid grid-cols-2 gap-2">
          {(["pick", "list"] as const).map((v) => (
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
              {v === "pick" ? m.viewPick : m.viewList}
            </Link>
          ))}
        </div>
      </nav>

      {list.error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {m.couldntLoad}: {list.error}
        </p>
      )}

      {pick && !list.error && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="break-words text-xl font-semibold text-foreground">
              {m.pickHeading(m.rounds[round])}
            </h2>
            <p className="text-sm text-muted">{m.pickIntro}</p>
          </div>
          {pick.noRoundDoses > 0 && (
            <p role="alert" className="rounded border-2 border-red-400 bg-red-50 p-3 text-sm text-red-800">
              {m.noRoundHeading}: {m.pickDoses(pick.noRoundDoses)}. {m.noRoundNote}
            </p>
          )}
          {pick.zones.length === 0 && (
            <p className="rounded-lg border border-border bg-surface p-4 text-muted">{m.pickEmpty}</p>
          )}
          {pick.zones.map((z) => (
            <div key={z.zone.name} className="flex flex-col gap-3">
              <h3 className="break-words border-b border-border pb-1 text-xl font-semibold text-foreground">
                {placeName(locale, z.zone.name, z.zone.nameTh)}
              </h3>
              <ul className="flex flex-col gap-2 rounded-lg border-2 border-foreground bg-surface p-3">
                {z.lines.map(pickLine)}
              </ul>
              {z.enclosures.map((e) => (
                <div key={e.enclosure.name} className="flex flex-col gap-1">
                  <h4 className="break-words text-lg font-semibold text-foreground">
                    {placeName(locale, e.enclosure.name, e.enclosure.nameTh)}
                  </h4>
                  <ul className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
                    {e.lines.map(pickLine)}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {!pick && !list.error && list.zones.length === 0 && list.apart.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-4 text-muted">{m.empty}</p>
      )}

      {!pick &&
        list.zones.map((zone) => (
          <section key={zone.zone.name} className="flex flex-col gap-4">
            <h2 className="break-words border-b border-border pb-1 text-xl font-semibold text-foreground">
              {placeName(locale, zone.zone.name, zone.zone.nameTh)}
            </h2>
            {zone.enclosures.map((enclosure) => (
              <div key={enclosure.enclosure.name} className="flex flex-col gap-2">
                <h3 className="flex flex-wrap items-baseline justify-between gap-x-3 text-lg font-semibold text-foreground">
                  <span className="min-w-0 break-words">
                    {placeName(locale, enclosure.enclosure.name, enclosure.enclosure.nameTh)}
                  </span>
                  <span className="text-sm font-normal text-muted">
                    {m.residentsCount(enclosure.residents.length)}
                  </span>
                </h3>
                <ul className="flex flex-col gap-3">{enclosure.residents.map((r) => residentCard(r))}</ul>
              </div>
            ))}
          </section>
        ))}

      {!pick && list.apart.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="break-words border-b border-border pb-1 text-xl font-semibold text-foreground">
              {m.apartHeading}
            </h2>
            <p className="mt-1 text-sm text-muted">{m.apartNote}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {list.apart.map((r) => residentCard(r, r.status ? statusLabel(t, r.status) : m.noEnclosure))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted">{m.carryNote}</p>
    </main>
  );
}
