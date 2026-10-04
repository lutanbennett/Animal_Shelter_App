import Image from "next/image";
import { PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { formatDate } from "@/lib/format";
import { formatDose, statusLabel } from "@/lib/i18n/enum-labels";
import { placeName } from "@/lib/enclosures/names";
import { describeSchedule } from "@/lib/prescriptions/frequency";
import { driveImageUrl } from "@/lib/google/drive-client";
import { MedicationLabelThumb } from "@/components/MedicationLabelThumb";
import {
  loadMedicationList,
  type ListedMedication,
  type ListedResident,
} from "@/lib/medication-list/load";
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
 */
export default async function MedicationListPage() {
  const { perms } = await requirePermission("medical.prescriptions", "read");
  // The list's views are for a login that sees every clinic (0136); a vet would get an empty page.
  if (perms.scopes.clinical !== "any") refuse(perms.role.key);
  const { t, locale } = await getT();
  const m = t.management.medicationList;

  const supabase = await createClient();
  const list = await loadMedicationList(supabase);

  const residentName = (r: ListedResident) =>
    locale === "th" && r.thaiName?.trim() ? r.thaiName.trim() : r.name;
  const secondName = (r: ListedResident) =>
    locale === "th" && r.thaiName?.trim() ? r.name : r.thaiName?.trim() || null;

  const dose = (med: ListedMedication) =>
    formatDose(t, med.quantity, med.doseUnit) ?? m.amountMissing;
  const often = (med: ListedMedication) =>
    med.schedule ? describeSchedule(t, med.schedule) : (med.frequencyLabel ?? t.frequency.asNeeded);

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
              <p className="break-words text-lg text-foreground">{dose(med)}</p>
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

      {list.error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {m.couldntLoad}: {list.error}
        </p>
      )}

      {!list.error && list.zones.length === 0 && list.apart.length === 0 && (
        <p className="rounded-lg border border-border bg-surface p-4 text-muted">{m.empty}</p>
      )}

      {list.zones.map((zone) => (
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

      {list.apart.length > 0 && (
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
