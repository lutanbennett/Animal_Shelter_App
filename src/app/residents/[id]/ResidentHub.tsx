"use client";

import { useState } from "react";
import Link from "next/link";
import { StatCard, type StatCardTone } from "@/components/StatCard";
import { formatAge, formatDate } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { statusLabel, speciesLabel, sexLabel } from "@/lib/i18n/enum-labels";

export type Resident = {
  id: string;
  name: string;
  animal_code: string;
  thai_name: string | null;
  other_names: string | null;
  species: string | null;
  breed: string | null;
  sex: string | null;
  estimated_age_years: number | null;
  intake_date: string | null;
  bio: string | null;
  temperament_notes: string | null;
  past_story_notes: string | null;
  behaviour_notes: string | null;
  profile_photo_drive_file_id: string | null;
  ready_for_adoption: boolean;
  is_public_visible: boolean;
};

export type ResidentStatus = {
  current_status: string | null;
  enclosure_id: string | null;
  enclosure_name: string | null;
  zone_id: string | null;
  zone_name: string | null;
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

export type WeightRow = { id: string; date: string; weight_kg: number };
export type ProcedureRow = { id: string; procedure_type: string; date: string };
export type BloodTestRow = { id: string; date: string };

const STATUS_TONE: Record<string, StatCardTone> = {
  Hospitalised: "warning",
  Deceased: "neutral",
  Fostered: "success",
  Adopted: "success",
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
  return `flex-1 rounded px-3 py-2 text-sm font-medium transition ${
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
  currentPlacementSince,
  carerName,
  placementHistoryCount,
  immunizationRecords,
  missingMandatoryImmunizations,
  vetAppointments,
  prescriptions,
  weightEntries,
  procedures,
  bloodTests,
  photoCount,
  now,
}: {
  resident: Resident;
  status: ResidentStatus | null;
  isDeceased: boolean;
  dateOfDeath: string | null;
  currentPlacementSince: string | null;
  carerName: string | null;
  placementHistoryCount: number;
  immunizationRecords: ImmunizationRecordRow[];
  missingMandatoryImmunizations: MissingImmunizationRow[];
  vetAppointments: VetAppointmentRow[];
  prescriptions: PrescriptionRow[];
  weightEntries: WeightRow[];
  procedures: ProcedureRow[];
  bloodTests: BloodTestRow[];
  photoCount: number;
  /** Server-computed timestamp (ISO string) — avoids calling Date.now() during render. */
  now: string;
}) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<"info" | "medical">("info");

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;

  const base = `/residents/${resident.id}`;

  // Housing & status
  const currentStatus = status?.current_status ?? "Unknown";
  const housingTone = STATUS_TONE[currentStatus] ?? "neutral";
  const housingDetail =
    [
      status?.enclosure_name,
      status?.zone_name,
      carerName && t.residents.hub.carer(carerName),
    ]
      .filter(Boolean)
      .join(" · ") || t.residents.hub.historyEntries(placementHistoryCount);

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

  // Weight
  const latestWeight = weightEntries[0];
  const previousWeight = weightEntries[1];
  const weightTrend =
    latestWeight && previousWeight
      ? latestWeight.weight_kg - previousWeight.weight_kg
      : null;
  const weightValue = latestWeight
    ? `${latestWeight.weight_kg} kg`
    : t.residents.hub.weightNoData;
  const weightDetail = latestWeight
    ? `${formatDate(latestWeight.date, locale)}${
        weightTrend != null
          ? ` · ${weightTrend > 0 ? "▲" : weightTrend < 0 ? "▼" : "—"} ${Math.abs(weightTrend).toFixed(1)} kg`
          : ""
      }`
    : t.residents.hub.weightNotRecorded;

  // Procedures / blood tests — simple counts for now.
  const latestProcedure = procedures[0];
  const latestBloodTest = bloodTests[0];

  const bioFields = [
    { label: t.residents.hub.bioLabels.bio, value: resident.bio },
    { label: t.residents.hub.bioLabels.temperament, value: resident.temperament_notes },
    { label: t.residents.hub.bioLabels.pastStory, value: resident.past_story_notes },
    { label: t.residents.hub.bioLabels.behaviour, value: resident.behaviour_notes },
  ].filter((f) => f.value);

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
                {resident.animal_code}
              </span>
            </div>
            <p className="text-sm text-muted">
              {[
                speciesLabel(t, resident.species),
                resident.breed,
                sexLabel(t, resident.sex),
              ]
                .filter(Boolean)
                .join(" · ") || t.residents.hub.speciesUnknown}
            </p>
            <p className="text-sm text-muted">
              {formatAge(t, resident.estimated_age_years, resident.intake_date)}
              {resident.intake_date &&
                ` · ${t.residents.hub.intake(formatDate(resident.intake_date, locale))}`}
            </p>
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

      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 md:hidden">
        <button
          type="button"
          onClick={() => setTab("info")}
          className={tabButtonClass(tab === "info")}
        >
          {t.residents.hub.overview}
        </button>
        <button
          type="button"
          onClick={() => setTab("medical")}
          className={tabButtonClass(tab === "medical")}
        >
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
              value={statusLabel(t, currentStatus)}
              detail={housingDetail}
              tone={housingTone}
              href={`${base}/housing`}
            />
            <StatCard
              title={t.residents.hub.photos}
              value={`${photoCount}`}
              detail={t.residents.hub.photosDetail}
              tone="neutral"
              href={`${base}/photos`}
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
                    <dd className="text-sm text-foreground">{f.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted">{t.residents.hub.noBioNotes}</p>
            )}
          </div>
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
              value={immunizationValue}
              detail={immunizationDetail}
              tone={immunizationTone}
              href={`${base}/immunizations`}
              action={{
                href: `/immunizations/new?residentId=${resident.id}`,
                label: t.residents.sections.logImmunization,
              }}
            />
            <StatCard
              title={t.residents.hub.vetAppointments}
              value={vetValue}
              detail={vetDetail}
              tone={vetTone}
              href={`${base}/vet-appointments`}
              action={{
                href: `/vet-visits/new?residentId=${resident.id}`,
                label: t.residents.sections.bookVetVisit,
              }}
            />
            <StatCard
              title={t.residents.hub.prescriptions}
              value={t.residents.hub.prescriptionsActive(activePrescriptions.length)}
              detail={prescriptionDetail}
              tone={prescriptionTone}
              href={`${base}/prescriptions`}
            />
            <StatCard
              title={t.residents.hub.weight}
              value={weightValue}
              detail={weightDetail}
              tone="neutral"
              href={`${base}/weight`}
            />
            <StatCard
              title={t.residents.hub.procedures}
              value={`${procedures.length}`}
              detail={
                latestProcedure
                  ? t.residents.hub.proceduresLast(
                      latestProcedure.procedure_type,
                      formatDate(latestProcedure.date, locale),
                    )
                  : t.residents.hub.proceduresNone
              }
              tone="neutral"
              href={`${base}/procedures`}
            />
            <StatCard
              title={t.residents.hub.bloodTests}
              value={`${bloodTests.length}`}
              detail={
                latestBloodTest
                  ? t.residents.hub.bloodTestsLast(
                      formatDate(latestBloodTest.date, locale),
                    )
                  : t.residents.hub.bloodTestsNone
              }
              tone="neutral"
              href={`${base}/blood-tests`}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
