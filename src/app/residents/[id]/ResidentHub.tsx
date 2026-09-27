"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  DeceasedBanner,
  DeceasedRestoreNotice,
  type DeceasedArchive,
} from "./deceased/DeceasedBanner";
import {
  StatCard,
  type StatCardAction,
  type StatCardTone,
} from "@/components/StatCard";
import { HUB_TAB_ICONS, PLACEMENT_ICONS, SECTION_ICONS } from "@/components/hub-icons";
import {
  PLACEMENT_ACTION_PATHS,
  availablePlacementActions,
} from "@/lib/placements/available";
import {
  formatAge,
  formatDate,
  formatWeightDelta,
  formatWeightKg,
} from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  statusLabel,
  speciesLabel,
  sexLabel,
  sizeLabel,
  compatibilityLabel,
  energyLevelLabel,
} from "@/lib/i18n/enum-labels";
import type { AdoptionProfile } from "@/components/AdoptionProfileFields";
import { CopyTagLink } from "@/components/CopyTagLink";
import { TranslationPanel } from "@/components/TranslationPanel";
import { placeName } from "@/lib/enclosures/names";
import { residentTagPath } from "@/lib/tags/links";
import type { TranslationRow } from "@/lib/translations/types";

export type Resident = {
  id: string;
  name: string;
  resident_code: string;
  thai_name: string | null;
  other_names: string | null;
  species: string | null;
  breed: string | null;
  sex: string | null;
  size: string | null;
  estimated_age_years: number | null;
  age_estimated_on: string | null;
  blood_test_interval_months: number;
  intake_date: string | null;
  bio: string | null;
  temperament_notes: string | null;
  past_story_notes: string | null;
  hook_line: string | null;
  ideal_home: string | null;
  behaviour_notes: string | null;
  profile_photo_drive_file_id: string | null;
  ready_for_adoption: boolean;
  is_public_visible: boolean;
  drive_folder_id: string | null;
  deceased_summary_drive_file_id: string | null;
  deceased_index_drive_file_id: string | null;
  deceased_archived_at: string | null;
} & AdoptionProfile;

export type ResidentStatus = {
  current_status: string | null;
  enclosure_id: string | null;
  enclosure_name: string | null;
  enclosure_name_th: string | null;
  zone_id: string | null;
  zone_name: string | null;
  zone_name_th: string | null;
  zone_internal: boolean | null;
};

export type ImmunizationRecordRow = {
  id: string;
  date_administered: string;
  immunization_types: { name: string } | null;
};

export type MissingImmunizationRow = {
  immunization_type_name: string;
};

export type VetAppointmentRow = {
  id: string;
  appointment_date: string;
  status: string;
  reason: string | null;
};

export type PrescriptionRow = {
  id: string;
  start_date: string;
  end_date: string | null;
  medication: { name: string } | null;
};

export type DietRow = {
  id: string;
  start_date: string;
  end_date: string | null;
  diet_types: { name: string } | null;
};

export type WeightRow = { id: string; date: string; weight_kg: number };
export type ProcedureRow = {
  id: string;
  date: string;
  procedure_types: { name: string } | null;
};
export type BloodTestRow = { id: string; date: string };

/** The hub's Adoption updates card (0097). */
export type AdoptionUpdatesSummary = {
  count: number;
  latest: { received_on: string; channel: string } | null;
  /** Has had an Adopt placement, now or before a return to the shelter. */
  everAdopted: boolean;
  /** Admin, management or staff, on a resident who has been adopted. */
  canAdd: boolean;
};

const STATUS_TONE: Record<string, StatCardTone> = {
  Hospitalised: "warning",
  Deceased: "neutral",
  Fostered: "success",
  Adopted: "success",
  Unassigned: "warning",
  Outreach: "success",
  Resident: "success",
};

const STATUS_BADGE_CLASSES: Record<StatCardTone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-primary/15 text-primary",
  danger: "bg-danger/15 text-danger",
  neutral: "bg-surface-hover text-muted",
};

function tabButtonClass(active: boolean) {
  return `flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium transition ${
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted hover:text-foreground"
  }`;
}

export function ResidentHub({
  resident,
  status,
  isDeceased,
  dateOfDeath,
  causeOfDeath,
  archive,
  canRecordDeath,
  canUndoDeath,
  canManageTranslations,
  translations,
  currentPlacementSince,
  carerName,
  hospitalPreviousEnclosureName,
  placementHistoryCount,
  immunizationRecords,
  missingMandatoryImmunizations,
  vetAppointments,
  prescriptions,
  diets,
  weightEntries,
  procedures,
  bloodTests,
  photoCount,
  adoptionUpdates,
  now,
  tagOrigin,
}: {
  resident: Resident;
  status: ResidentStatus | null;
  isDeceased: boolean;
  dateOfDeath: string | null;
  causeOfDeath: string | null;
  /**
   * Where the Drive archive got to. Read when isDeceased, and for a living
   * resident too: columns still set after a withdrawn death mean the Drive
   * restore didn't finish.
   */
  archive: DeceasedArchive;
  /** Admin/staff, the roles that may record a death (and retry an archive). */
  canRecordDeath: boolean;
  /** Admin only: may withdraw a death recorded in error (and retry its Drive restore). */
  canUndoDeath: boolean;
  /** Admin/management: may write and approve the other-language text. */
  canManageTranslations: boolean;
  /** The resident's rows in `translations` (bio, temperament, past story). */
  translations: TranslationRow[];
  currentPlacementSince: string | null;
  carerName: string | null;
  /** Where the resident was before going into hospital, while they're there. */
  hospitalPreviousEnclosureName: string | null;
  placementHistoryCount: number;
  immunizationRecords: ImmunizationRecordRow[];
  missingMandatoryImmunizations: MissingImmunizationRow[];
  vetAppointments: VetAppointmentRow[];
  prescriptions: PrescriptionRow[];
  diets: DietRow[];
  weightEntries: WeightRow[];
  procedures: ProcedureRow[];
  bloodTests: BloodTestRow[];
  photoCount: number;
  adoptionUpdates: AdoptionUpdatesSummary;
  /** Server-computed timestamp (ISO string) — avoids calling Date.now() during render. */
  now: string;
  /** Origin for the RFID-card link (src/lib/tags/origin.ts). */
  tagOrigin: string | null;
}) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<"info" | "medical">("info");

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;

  const base = `/residents/${resident.id}`;

  // Housing & status. A hospitalised resident is off-site in medical care,
  // and a fostered or adopted one is living with a carer, so the card says
  // that (and where they'll come back to, or who they're with) instead of
  // naming the Lifecycle pseudo-enclosure as if it were a kennel.
  const currentStatus = status?.current_status ?? "Unknown";
  const isHospitalised = currentStatus === "Hospitalised";
  const isWithCarer = currentStatus === "Fostered" || currentStatus === "Adopted";
  const housingTone = STATUS_TONE[currentStatus] ?? "neutral";
  const housingDetail = isHospitalised
    ? [
        t.residents.hub.inHospitalDetail,
        hospitalPreviousEnclosureName &&
          t.residents.hub.hospitalReturnsTo(hospitalPreviousEnclosureName),
      ]
        .filter(Boolean)
        .join(" · ")
    : currentStatus === "Fostered"
      ? carerName
        ? t.residents.hub.fosteredWith(carerName)
        : t.residents.hub.fosteredNoCarer
      : currentStatus === "Adopted"
        ? carerName
          ? t.residents.hub.adoptedBy(carerName)
          : t.residents.hub.adoptedNoCarer
        : [
            placeName(locale, status?.enclosure_name, status?.enclosure_name_th),
            placeName(locale, status?.zone_name, status?.zone_name_th),
            carerName && t.residents.hub.carer(carerName),
          ]
            .filter(Boolean)
            .join(" · ") || t.residents.hub.historyEntries(placementHistoryCount);
  // Which placement actions apply depends on the lifecycle status — see
  // availablePlacementActions() for the table.
  const housingActions: StatCardAction[] = availablePlacementActions(
    isDeceased ? "Deceased" : currentStatus,
  ).map((key) => ({
    href: `${base}${PLACEMENT_ACTION_PATHS[key]}`,
    label: t.residents.hub.placementActions[key],
    icon: PLACEMENT_ICONS[key],
  }));

  // Nothing can be added to a dead resident's medical record — the database
  // rejects it (migration 0026), so the buttons that would try are dropped
  // rather than left to fail.
  const medicalActions = (actions: StatCardAction[]) =>
    isDeceased ? [] : actions;

  // Immunizations — we can only tell "recorded" vs "missing mandatory type"
  // today; due-date/interval tracking isn't in the data model yet (see
  // docs/decisions.md), so there's no "upcoming" bucket until that lands.
  const missingCount = missingMandatoryImmunizations.length;
  const immunizationTone: StatCardTone = missingCount > 0 ? "danger" : "success";
  const immunizationValue =
    missingCount > 0
      ? t.residents.hub.immunizationsMissing(missingCount)
      : t.residents.hub.immunizationsRecorded(immunizationRecords.length);
  const immunizationDetail =
    missingCount > 0
      ? missingMandatoryImmunizations
          .slice(0, 2)
          .map((m) => m.immunization_type_name)
          .join(", ") + (missingCount > 2 ? ", …" : "")
      : t.residents.hub.allMandatoryOnFile;

  // Vet appointments — genuinely computable overdue/upcoming from real dates.
  const nowMs = new Date(now).getTime();
  const scheduled = vetAppointments.filter((a) => a.status === "scheduled");
  const upcoming = scheduled
    .filter((a) => new Date(a.appointment_date).getTime() >= nowMs)
    .sort(
      (a, b) =>
        new Date(a.appointment_date).getTime() -
        new Date(b.appointment_date).getTime(),
    );
  const overdue = scheduled.filter(
    (a) => new Date(a.appointment_date).getTime() < nowMs,
  );
  const vetTone: StatCardTone =
    overdue.length > 0 ? "danger" : upcoming.length > 0 ? "warning" : "neutral";
  const vetValue =
    overdue.length > 0
      ? t.residents.hub.vetOverdue(overdue.length)
      : upcoming.length > 0
        ? t.residents.hub.vetUpcoming(upcoming.length)
        : t.residents.hub.vetNoneScheduled;
  const vetDetail = upcoming[0]
    ? t.residents.hub.vetNext(formatDate(upcoming[0].appointment_date, locale))
    : overdue.length > 0
      ? t.residents.hub.vetPastDue
      : t.residents.hub.vetTotalVisits(vetAppointments.length);

  // Prescriptions
  const today = now.slice(0, 10);
  const activePrescriptions = prescriptions.filter(
    (p) => !p.end_date || p.end_date >= today,
  );
  const prescriptionTone: StatCardTone =
    activePrescriptions.length > 0 ? "warning" : "neutral";
  const prescriptionDetail = activePrescriptions[0]?.medication?.name
    ? activePrescriptions.map((p) => p.medication?.name).filter(Boolean).join(", ")
    : t.residents.hub.noActivePrescriptions;

  // Diet — a closed record has no current diet whatever the dates say.
  const currentDiets = isDeceased
    ? []
    : diets.filter((d) => !d.end_date || d.end_date >= today);
  const dietDetail = currentDiets[0]?.diet_types?.name
    ? currentDiets.map((d) => d.diet_types?.name).filter(Boolean).join(", ")
    : t.residents.hub.noCurrentDiets;

  // Weight
  const latestWeight = weightEntries[0];
  const previousWeight = weightEntries[1];
  const weightTrend =
    latestWeight && previousWeight
      ? latestWeight.weight_kg - previousWeight.weight_kg
      : null;
  const weightValue = latestWeight
    ? formatWeightKg(latestWeight.weight_kg, locale)
    : t.residents.hub.weightNoData;
  const weightDetail = latestWeight
    ? `${formatDate(latestWeight.date, locale)}${
        weightTrend != null
          ? ` · ${weightTrend > 0 ? "▲" : weightTrend < 0 ? "▼" : "—"} ${formatWeightDelta(weightTrend, locale)}`
          : ""
      }`
    : t.residents.hub.weightNotRecorded;

  // Procedures / blood tests — simple counts for now.
  const latestProcedure = procedures[0];
  const latestBloodTest = bloodTests[0];

  // All but behaviour notes are public (on /adopt) and carry a translation
  // row; behaviour notes are staff-only and don't.
  const translationFor = (column: string) =>
    translations.find((row) => row.column_name === column) ?? null;
  const bioFields = [
    { label: t.residents.hub.bioLabels.hookLine, value: resident.hook_line, translation: translationFor("hook_line") },
    { label: t.residents.hub.bioLabels.bio, value: resident.bio, translation: translationFor("bio") },
    { label: t.residents.hub.bioLabels.temperament, value: resident.temperament_notes, translation: translationFor("temperament_notes") },
    { label: t.residents.hub.bioLabels.pastStory, value: resident.past_story_notes, translation: translationFor("past_story_notes") },
    { label: t.residents.hub.bioLabels.idealHome, value: resident.ideal_home, translation: translationFor("ideal_home") },
    { label: t.residents.hub.bioLabels.behaviour, value: resident.behaviour_notes, translation: null },
  ].filter((f) => f.value);

  // The adoption recommendation (0060), set fields only — what /adopt/[id]
  // shows as "Is {name} right for you?".
  const fl = t.residents.new.fields;
  const adoptionFields = [
    { label: fl.colour, value: resident.colour },
    {
      label: fl.desexed,
      value: resident.is_desexed == null ? null : resident.is_desexed ? t.common.yes : t.common.no,
    },
    { label: fl.goodWithDogs, value: compatibilityLabel(t, resident.good_with_dogs) },
    { label: fl.goodWithCats, value: compatibilityLabel(t, resident.good_with_cats) },
    { label: fl.goodWithChildren, value: compatibilityLabel(t, resident.good_with_children) },
    { label: fl.energyLevel, value: energyLevelLabel(t, resident.energy_level) },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link href="/residents" className="text-sm text-muted hover:text-foreground">
        {t.residents.hub.backToResidents}
      </Link>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
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
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {displayName}
              </h1>
              <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted">
                {resident.resident_code}
              </span>
              {/* After death the edit page offers only the bio and photos
                  (0052); record-death is never offered twice. */}
              {(
                <Link
                  href={`${base}/edit`}
                  title={t.residents.hub.editResident}
                  aria-label={t.residents.hub.editResident}
                  className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground"
                >
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                </Link>
              )}
              {!isDeceased && canRecordDeath && (
                <Link
                  href={`${base}/deceased`}
                  title={t.residents.deceased.recordButton}
                  aria-label={t.residents.deceased.recordButton}
                  className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
                >
                  <PLACEMENT_ICONS.deceased aria-hidden="true" className="h-4 w-4" />
                </Link>
              )}
            </div>
            <p className="text-sm text-muted">
              {[
                speciesLabel(t, resident.species),
                resident.breed,
                sexLabel(t, resident.sex),
                sizeLabel(t, resident.size),
              ]
                .filter(Boolean)
                .join(" · ") || t.residents.hub.speciesUnknown}
            </p>
            {!resident.size && !isDeceased && (
              <p className="text-xs text-warning">{t.residents.hub.sizeNotSet}</p>
            )}
            <p className="text-sm text-muted">
              {formatAge(t, resident.estimated_age_years, resident.age_estimated_on)}
              {resident.intake_date &&
                ` · ${t.residents.hub.intake(formatDate(resident.intake_date, locale))}`}
            </p>
            {/* The address for the RFID card on the kennel: the R-code,
                not the id, so the card outlives any restructuring. */}
            <div className="mt-2 w-full sm:w-80">
              <CopyTagLink
                field
                path={residentTagPath(resident.resident_code)}
                origin={tagOrigin}
                name={displayName}
                label={t.tagLinks.residentLabel}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[housingTone]}`}
          >
            {statusLabel(t, currentStatus)}
          </span>
          {resident.ready_for_adoption && (
            <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
              {t.residents.hub.readyForAdoption}
            </span>
          )}
          {isDeceased && dateOfDeath && (
            <span className="rounded-full bg-surface-hover px-3 py-1 text-xs text-muted">
              {t.residents.hub.passed(formatDate(dateOfDeath, locale))}
            </span>
          )}
          {!isDeceased && currentPlacementSince && (
            <span className="rounded-full bg-surface-hover px-3 py-1 text-xs text-muted">
              {t.residents.hub.since(formatDate(currentPlacementSince, locale))}
            </span>
          )}
        </div>
      </div>

      {isDeceased && (
        <DeceasedBanner
          residentId={resident.id}
          dateOfDeath={dateOfDeath}
          causeOfDeath={causeOfDeath}
          archive={archive}
          canRetryArchive={canRecordDeath}
          canUndo={canUndoDeath}
        />
      )}
      {!isDeceased &&
        (archive.archivedAt || archive.summaryDriveFileId || archive.indexDriveFileId) && (
          <DeceasedRestoreNotice residentId={resident.id} canRetry={canUndoDeath} />
        )}

      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 md:hidden">
        <button
          type="button"
          onClick={() => setTab("info")}
          className={tabButtonClass(tab === "info")}
        >
          <HUB_TAB_ICONS.info aria-hidden="true" className="h-4 w-4" />
          {t.residents.hub.overview}
        </button>
        <button
          type="button"
          onClick={() => setTab("medical")}
          className={tabButtonClass(tab === "medical")}
        >
          <HUB_TAB_ICONS.medical aria-hidden="true" className="h-4 w-4" />
          {t.residents.hub.medical}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section
          className={`${tab === "info" ? "flex" : "hidden"} flex-col gap-4 md:flex`}
        >
          <h2 className="text-lg font-semibold text-foreground">
            {t.residents.hub.generalInformation}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title={t.residents.hub.housingStatus}
              icon={
                isHospitalised
                  ? PLACEMENT_ICONS.hospital
                  : isWithCarer
                    ? PLACEMENT_ICONS.rehome
                    : SECTION_ICONS.housing
              }
              value={
                isHospitalised
                  ? t.residents.hub.inHospital
                  : statusLabel(t, currentStatus)
              }
              detail={housingDetail}
              tone={housingTone}
              href={`${base}/housing`}
              actions={housingActions}
            />
            <StatCard
              title={t.residents.hub.photos}
              icon={SECTION_ICONS.photos}
              value={`${photoCount}`}
              detail={t.residents.hub.photosDetail}
              tone="neutral"
              href={`${base}/photos`}
            />
            {/* Any resident ever adopted keeps the card, returned or not —
                the news from their time away stays on the record
                (docs/decisions.md, 2026-09-27). */}
            {(adoptionUpdates.everAdopted || adoptionUpdates.count > 0) && (
              <StatCard
                title={t.adoptionUpdates.title}
                icon={SECTION_ICONS["adoption-updates"]}
                value={`${adoptionUpdates.count}`}
                detail={
                  adoptionUpdates.latest
                    ? t.adoptionUpdates.latest(
                        formatDate(adoptionUpdates.latest.received_on, locale),
                        (t.adoptionUpdates.channels as Record<string, string>)[
                          adoptionUpdates.latest.channel
                        ] ?? adoptionUpdates.latest.channel,
                      )
                    : t.adoptionUpdates.noneYet
                }
                tone={adoptionUpdates.count > 0 ? "success" : "neutral"}
                href={`${base}/adoption-updates`}
                actions={
                  adoptionUpdates.canAdd
                    ? [{ href: `${base}/adoption-updates/new`, label: t.adoptionUpdates.addUpdate }]
                    : []
                }
              />
            )}
            <StatCard
              title={t.residents.hub.diet}
              icon={SECTION_ICONS.diet}
              value={t.residents.hub.dietsActive(currentDiets.length)}
              detail={dietDetail}
              tone={currentDiets.length > 0 ? "success" : "neutral"}
              href={`${base}/diet`}
              actions={medicalActions([
                {
                  href: `/diets/new?residentId=${resident.id}`,
                  label: t.residents.hub.addDiet,
                },
              ])}
            />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-medium text-muted">
              {t.residents.hub.bioBehaviour}
            </h3>
            {bioFields.length > 0 ? (
              <dl className="flex flex-col gap-3">
                {bioFields.map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs font-medium text-muted">
                      {f.label}
                    </dt>
                    <dd className="whitespace-pre-line text-sm text-foreground">{f.value}</dd>
                    {f.translation && (
                      <dd className="mt-1">
                        <TranslationPanel
                          key={f.translation.id + f.translation.updated_at}
                          row={f.translation}
                          canManage={canManageTranslations}
                        />
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted">{t.residents.hub.noBioNotes}</p>
            )}
          </div>

          {!isDeceased && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="mb-2 text-sm font-medium text-muted">
                {t.residents.hub.adoptionProfile}
              </h3>
              {adoptionFields.length > 0 ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                  {adoptionFields.map((f) => (
                    <div key={f.label}>
                      <dt className="text-xs font-medium text-muted">{f.label}</dt>
                      <dd className="text-sm text-foreground">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted">{t.residents.hub.noAdoptionProfile}</p>
              )}
            </div>
          )}
        </section>

        <section
          className={`${tab === "medical" ? "flex" : "hidden"} flex-col gap-4 md:flex`}
        >
          <h2 className="text-lg font-semibold text-foreground">
            {t.residents.hub.medicalHeading}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title={t.residents.hub.immunizations}
              icon={SECTION_ICONS.immunizations}
              value={immunizationValue}
              detail={immunizationDetail}
              tone={immunizationTone}
              href={`${base}/immunizations`}
              actions={medicalActions([
                {
                  href: `/immunizations/new?residentId=${resident.id}`,
                  label: t.residents.sections.logImmunization,
                },
              ])}
            />
            <StatCard
              title={t.residents.hub.vetAppointments}
              icon={SECTION_ICONS["vet-appointments"]}
              value={vetValue}
              detail={vetDetail}
              tone={vetTone}
              href={`${base}/vet-appointments`}
              actions={medicalActions([
                {
                  href: `/vet-visits/new?residentId=${resident.id}`,
                  label: t.residents.sections.bookVetVisit,
                },
              ])}
            />
            <StatCard
              title={t.residents.hub.prescriptions}
              icon={SECTION_ICONS.prescriptions}
              value={t.residents.hub.prescriptionsActive(activePrescriptions.length)}
              detail={prescriptionDetail}
              tone={prescriptionTone}
              href={`${base}/prescriptions`}
              actions={medicalActions([
                {
                  href: `/prescriptions/new?residentId=${resident.id}`,
                  label: t.residents.hub.addPrescription,
                },
              ])}
            />
            <StatCard
              title={t.residents.hub.weight}
              icon={SECTION_ICONS.weight}
              value={weightValue}
              detail={weightDetail}
              tone="neutral"
              href={`${base}/weight`}
              actions={medicalActions([
                {
                  href: `/weight/new?residentId=${resident.id}`,
                  label: t.residents.sections.logWeight,
                },
              ])}
            />
            <StatCard
              title={t.residents.hub.procedures}
              icon={SECTION_ICONS.procedures}
              value={`${procedures.length}`}
              detail={
                latestProcedure
                  ? t.residents.hub.proceduresLast(
                      latestProcedure.procedure_types?.name ?? t.procedures.unknownType,
                      formatDate(latestProcedure.date, locale),
                    )
                  : t.residents.hub.proceduresNone
              }
              tone="neutral"
              href={`${base}/procedures`}
              actions={medicalActions([
                {
                  href: `/procedures/new?residentId=${resident.id}`,
                  label: t.residents.sections.logProcedure,
                },
              ])}
            />
            <StatCard
              title={t.residents.hub.bloodTests}
              icon={SECTION_ICONS["blood-tests"]}
              value={`${bloodTests.length}`}
              detail={`${
                latestBloodTest
                  ? t.residents.hub.bloodTestsLast(
                      formatDate(latestBloodTest.date, locale),
                    )
                  : t.residents.hub.bloodTestsNone
              } · ${t.residents.hub.bloodTestsEvery(resident.blood_test_interval_months)}`}
              tone="neutral"
              href={`${base}/blood-tests`}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
