import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { formatBaht, formatDate, formatWeightDelta, formatWeightKg, todayIso } from "@/lib/format";
import { getT } from "@/lib/i18n/get-t";
import { contactNameEmbed } from "@/lib/contacts/visibility";
import { placeName } from "@/lib/enclosures/names";
import { localLabel } from "@/lib/translations/labels";
import {
  appointmentStatusLabel,
  dietUnitLabel,
  formatDose,
  placementTypeLabel,
  sizeLabel,
} from "@/lib/i18n/enum-labels";
import { PhotoUploader } from "@/components/PhotoUploader";
import { photoCategoriesFor } from "@/lib/google/drive-client";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import type { LevelKey } from "@/lib/permissions/catalogue";
import { requireFullResident } from "@/lib/residents/who-and-where";
import { PhotoGallery, type PhotoRow } from "@/components/PhotoGallery";
import {
  residentPhotoSelect,
  type PhotoProvenance,
} from "@/lib/adoption-updates/options";
import { AdoptionUpdateActions } from "../adoption-updates/AdoptionUpdateActions";
import { BloodTestList, type BloodTestRow } from "@/components/BloodTestList";
import { ProcedureList, type ProcedureRow } from "@/components/ProcedureList";
import { RecordRowActions } from "@/components/RecordRowActions";
import { ArchiveRecordControl } from "@/components/ArchiveRecordControl";
import { ShowArchivedToggle } from "@/components/ShowArchivedToggle";
import { type MedicalArchiveKind } from "@/lib/medical-archive/kinds";
import { endPrescriptionToday } from "@/app/prescriptions/actions";
import { endDietToday } from "@/app/diets/actions";
import { defaultDailyQuantity, formatQuantity } from "@/lib/diets/options";
import { WeightChart } from "@/components/WeightChart";
import { visitDate } from "@/lib/vets/linkable";
import { ActionLink } from "@/components/ActionLink";
import { MicrochipLine } from "@/components/MicrochipForm";
import { ArchivedBadge } from "@/components/ArchivedBadge";
import {
  ACTION_ICONS,
  PLACEMENT_ICONS,
  SECTION_ICONS,
  type HubSection,
} from "@/components/hub-icons";
import { RowActionLink } from "@/components/RowAction";
import {
  PLACEMENT_ACTION_PATHS,
  availablePlacementActions,
} from "@/lib/placements/available";

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

function RecordList<T extends { id: string }>({
  rows,
  empty,
  render,
}: {
  rows: T[];
  empty: string;
  render: (row: T) => React.ReactNode;
}) {
  if (rows.length === 0) return <Placeholder>{empty}</Placeholder>;
  return (
    <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
      {rows.map((row) => (
        <li key={row.id} className="px-4 py-3 text-sm text-foreground">
          {render(row)}
        </li>
      ))}
    </ul>
  );
}

/**
 * The activity each tab of the record is read under. Housing, photos and adoption updates are the
 * resident's own record (resident.record); the medical tabs each have their cell, so a login with no
 * read of that part is refused, not shown an empty list.
 */
const SECTION_READS: Partial<Record<string, LevelKey>> = {
  immunizations: "medical.immunizations",
  "vet-appointments": "medical.visits",
  prescriptions: "medical.prescriptions",
  diet: "medical.diet",
  weight: "medical.weight",
  procedures: "medical.procedures",
  "blood-tests": "medical.blood_tests",
};

export default async function ResidentSectionPage(
  props: PageProps<"/residents/[id]/[section]">,
) {
  const { id, section } = await props.params;
  const { t, locale } = await getT();
  const title = (
    t.residents.sections.titles as Record<string, string | undefined>
  )[section];
  if (!title) notFound();
  await requireFullResident(SECTION_READS[section]);
  const SectionIcon = SECTION_ICONS[section as HubSection];

  const supabase = await createClient();

  const [residentResult, residentStateResult, perms] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name, size, profile_photo_drive_file_id, microchip_number, microchip_implanted_on")
      .eq("id", id)
      .limit(1)
      .returns<
        {
          id: string;
          name: string;
          thai_name: string | null;
          size: string | null;
          profile_photo_drive_file_id: string | null;
          microchip_number: string | null;
          microchip_implanted_on: string | null;
        }[]
      >(),
    supabase
      .from("resident_current_state")
      .select("current_status, is_deceased")
      .eq("resident_id", id)
      .limit(1)
      .returns<{ current_status: string | null; is_deceased: boolean }[]>(),
    loadPermissions(),
  ]);

  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  // A deceased resident's record is read-only — in the database too
  // (migration 0026), so every "add a record" control below is dropped
  // rather than left to fail against a trigger.
  const residentState = residentStateResult.data?.[0];
  const isDeceased = residentState?.is_deceased ?? false;

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;

  // Archive (0124): a second list of archived rows behind ?archived=1, as on
  // contacts. The live queries below already skip archived rows; this only
  // adds the way to see and restore them. Who gets the button is
  // medical.archive: admin, management and staff, never a vet or
  // volunteer, and nobody on a deceased resident.
  const showArchived = (await props.searchParams).archived === "1";
  // A vet or volunteer reads a carer or sender name through a narrow view (0126): the contacts scope says which.
  const photoSelect = residentPhotoSelect(perms);
  const contactEmbed = (withArchive = false) => contactNameEmbed(perms, withArchive);
  const canArchive = (kind: MedicalArchiveKind) => !isDeceased && can(perms, "medical.archive");
  const archivedCount = async (
    table: "weight" | "prescriptions" | "vet_appointments" | "immunization_records",
  ) =>
    (
      await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("resident_id", id)
        .not("archived_at", "is", null)
    ).count ?? 0;
  const ra = t.recordArchive;
  const archivedToggle = (count: number) => (
    <ShowArchivedToggle
      count={count}
      shown={showArchived}
      href={`/residents/${id}/${section}${showArchived ? "" : "?archived=1"}`}
      labels={{ hidden: ra.archivedHidden, show: ra.showArchived, hide: ra.hideArchived }}
    />
  );
  const archivedList = <T extends { id: string; archive_reason: string | null }>(
    rows: T[],
    render: (row: T) => React.ReactNode,
  ) =>
    showArchived &&
    rows.length > 0 && (
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted">{ra.archivedHeading(rows.length)}</h2>
        <RecordList
          rows={rows}
          empty=""
          render={(row) => (
            <div className="flex flex-col gap-1 opacity-80">
              {render(row)}
              {row.archive_reason && (
                <span className="text-xs text-muted">{ra.reason(row.archive_reason)}</span>
              )}
            </div>
          )}
        />
      </section>
    );

  let body: React.ReactNode = null;

  switch (section) {
    case "housing": {
      // placement_history has two FKs to enclosures (enclosure_id and
      // previous_enclosure_id), so each embed has to name its FK or
      // PostgREST rejects the whole query as ambiguous.
      const { data, error } = await supabase
        .from("placement_history")
        .select(
          `id, placement_type, start_date, end_date, notes, cause_of_death, enclosure:enclosures!enclosure_id(name, name_th), previous_enclosure:enclosures!previous_enclosure_id(name, name_th), carer:${contactEmbed(true)}`,
        )
        .eq("resident_id", id)
        .order("start_date", { ascending: false })
        .returns<
          {
            id: string;
            placement_type: string;
            start_date: string;
            end_date: string | null;
            notes: string | null;
            cause_of_death: string | null;
            enclosure: { name: string; name_th: string | null } | null;
            previous_enclosure: { name: string; name_th: string | null } | null;
            // An archived carer is still named — this is their history —
            // with the badge, so nobody tries to place a new animal there.
            carer: {
              name: string;
              archived_at: string | null;
              archive_reason: string | null;
            } | null;
          }[]
        >();
      // Which placement actions apply depends on the lifecycle status — see
      // availablePlacementActions() for the table. The last one is primary.
      // A deceased resident has none, which is also how the read-only rule
      // shows up here.
      const actions = availablePlacementActions(
        isDeceased ? "Deceased" : residentState?.current_status,
      );
      body = (
        <div className="flex flex-col gap-4">
          {actions.length > 0 && (
            <div className="flex justify-end gap-2">
              {actions.map((key, index) => (
                <ActionLink
                  key={key}
                  href={`/residents/${id}${PLACEMENT_ACTION_PATHS[key]}`}
                  label={t.residents.hub.placementActions[key]}
                  icon={PLACEMENT_ICONS[key]}
                  variant={index === actions.length - 1 ? "primary" : "secondary"}
                />
              ))}
            </div>
          )}
          {error && (
            <p className="text-sm text-danger">{error.message}</p>
          )}
          <RecordList
            rows={data ?? []}
            empty={t.residents.sections.empty.housing}
            render={(row) => (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {placementTypeLabel(t, row.placement_type)}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(row.start_date, locale)} –{" "}
                    {row.end_date
                      ? formatDate(row.end_date, locale)
                      : t.residents.sections.present}
                  </span>
                </div>
                {row.enclosure?.name && (
                  <span className="flex flex-wrap items-center gap-x-1 text-xs text-muted">
                    {[
                      row.previous_enclosure?.name
                        ? `${placeName(locale, row.previous_enclosure.name, row.previous_enclosure.name_th)} → ${placeName(locale, row.enclosure.name, row.enclosure.name_th)}`
                        : placeName(locale, row.enclosure.name, row.enclosure.name_th),
                      row.carer?.name && (row.placement_type === "Adopt" ? t.residents.hub.adopter(row.carer.name) : t.residents.hub.carer(row.carer.name)),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    {row.carer?.archived_at && (
                      <ArchivedBadge
                        label={t.contacts.archive.badge}
                        title={
                          row.carer.archive_reason
                            ? t.contacts.archive.reason(row.carer.archive_reason)
                            : undefined
                        }
                      />
                    )}
                  </span>
                )}
                {row.cause_of_death && (
                  <span className="text-xs text-muted">
                    {t.residents.deceased.banner.cause(row.cause_of_death)}
                  </span>
                )}
                {row.notes && <span className="text-xs text-muted">{row.notes}</span>}
              </div>
            )}
          />
        </div>
      );
      break;
    }
    case "photos": {
      const [{ data: photos }] = await Promise.all([
        supabase
          .from("attachments")
          .select(photoSelect)
          .eq("owner_type", "resident")
          .eq("owner_id", id)
          .order("uploaded_at", { ascending: true })
          .returns<PhotoRow[]>(),
      ]);
      body = (
        <div className="flex flex-col gap-6">
          {/* Photos stay open after death (0052); the archive is refreshed
              by the upload route and the photo actions. */}
          <PhotoUploader residentId={id} categories={photoCategoriesFor(perms)} />
          <PhotoGallery
            residentId={id}
            photos={photos ?? []}
            profilePhotoDriveFileId={resident.profile_photo_drive_file_id}
            moveCategories={photoCategoriesFor(perms)}
          />
        </div>
      );
      break;
    }
    case "adoption-updates": {
      // Shown for any resident who has ever been adopted, not only one
      // adopted now: a resident returned to the shelter keeps the news from
      // their time away, and it can still arrive late (0097 leaves where
      // the section shows to the hub; docs/decisions.md, 2026-09-27).
      const [updatesResult, photosResult, adoptCountResult] = await Promise.all([
        supabase
          .from("adoption_updates")
          .select(`id, received_on, channel, note, created_at, sender:${contactEmbed()}`)
          .eq("resident_id", id)
          .order("received_on", { ascending: false })
          .order("created_at", { ascending: false })
          .returns<
            {
              id: string;
              received_on: string;
              channel: string;
              note: string | null;
              created_at: string;
              sender: { name: string } | null;
            }[]
          >(),
        supabase
          .from("attachments")
          .select(photoSelect)
          .eq("owner_type", "resident")
          .eq("owner_id", id)
          .not("adoption_update_id", "is", null)
          .order("uploaded_at", { ascending: true })
          .returns<PhotoRow[]>(),
        supabase
          .from("placement_history")
          .select("id", { count: "exact", head: true })
          .eq("resident_id", id)
          .eq("placement_type", "Adopt"),
      ]);
      const updates = updatesResult.data ?? [];
      const photos = photosResult.data ?? [];
      const canWrite =
        can(perms, "resident.adoption_news") && (adoptCountResult.count ?? 0) > 0;
      const a = t.adoptionUpdates;
      const channelLabel = (code: string) =>
        (a.channels as Record<string, string>)[code] ?? code;
      body = (
        <div className="flex flex-col gap-4">
          {canWrite && (
            <div className="flex justify-end">
              <ActionLink
                href={`/residents/${id}/adoption-updates/new`}
                label={a.addUpdate}
                icon={SECTION_ICONS["adoption-updates"]}
                variant="primary"
                iconOnlyOnMobile={false}
              />
            </div>
          )}
          {residentState?.current_status !== "Adopted" && updates.length > 0 && (
            <p className="rounded-lg border border-border bg-surface p-3 text-sm text-muted">
              {a.notAdoptedNow}
            </p>
          )}
          {(updatesResult.error || photosResult.error) && (
            <p className="text-sm text-danger">
              {(updatesResult.error ?? photosResult.error)?.message}
            </p>
          )}
          {updates.length === 0 ? (
            <Placeholder>
              {(adoptCountResult.count ?? 0) > 0 ? a.empty : a.neverAdoptedEmpty}
            </Placeholder>
          ) : (
            <ul className="flex flex-col gap-4">
              {updates.map((update) => {
                const updatePhotos = photos.filter(
                  (p) => (p.adoption_update as PhotoProvenance | null)?.id === update.id,
                );
                return (
                  <li
                    key={update.id}
                    id={`update-${update.id}`}
                    className="flex scroll-mt-6 flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-sm target:ring-2 target:ring-primary/50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">
                          {formatDate(update.received_on, locale)}
                          <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                            {channelLabel(update.channel)}
                          </span>
                        </span>
                        <span className="text-xs text-muted">
                          {update.sender?.name ? a.sentBy(update.sender.name) : a.senderUnknown}
                        </span>
                      </div>
                      {canWrite && (
                        <AdoptionUpdateActions
                          residentId={id}
                          updateId={update.id}
                          photoCount={updatePhotos.length}
                          subject={formatDate(update.received_on, locale)}
                        />
                      )}
                    </div>
                    {update.note && (
                      <p className="whitespace-pre-line text-foreground">{update.note}</p>
                    )}
                    {updatePhotos.length > 0 && (
                      <PhotoGallery
                        residentId={id}
                        photos={updatePhotos}
                        profilePhotoDriveFileId={resident.profile_photo_drive_file_id}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      );
      break;
    }
    case "immunizations": {
      const { data } = await supabase
        .from("immunization_records")
        .select("id, date_administered, administered_by, immunization_types:picker_immunization_types(name, name_th)")
        .is("archived_at", null)
        .eq("resident_id", id)
        .order("date_administered", { ascending: false })
        .returns<
          {
            id: string;
            date_administered: string;
            administered_by: string | null;
            immunization_types: { name: string; name_th: string | null } | null;
          }[]
        >();
      const immCount = await archivedCount("immunization_records");
      const { data: archivedImm } = showArchived
        ? await supabase
            .from("immunization_records")
            .select("id, date_administered, administered_by, archive_reason, immunization_types:picker_immunization_types(name, name_th)")
            .not("archived_at", "is", null)
            .eq("resident_id", id)
            .order("date_administered", { ascending: false })
            .returns<
              {
                id: string;
                date_administered: string;
                administered_by: string | null;
                archive_reason: string | null;
                immunization_types: { name: string; name_th: string | null } | null;
              }[]
            >()
        : { data: [] };
      const renderImmunization = (
        row: {
          id: string;
          date_administered: string;
          administered_by: string | null;
          immunization_types: { name: string; name_th: string | null } | null;
        },
        archived: boolean,
      ) => (
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">
            {(row.immunization_types ? localLabel(locale, row.immunization_types.name, row.immunization_types.name_th) : t.residents.sections.unknownVaccine)}
          </span>
          <span className="flex flex-col items-end gap-1 text-xs text-muted">
            <span>
              {formatDate(row.date_administered, locale)}
              {row.administered_by ? ` · ${row.administered_by}` : ""}
            </span>
            {canArchive("immunization") && (
              <ArchiveRecordControl
                kind="immunization"
                residentId={id}
                id={row.id}
                archived={archived}
                subject={`${(row.immunization_types ? localLabel(locale, row.immunization_types.name, row.immunization_types.name_th) : t.residents.sections.unknownVaccine)} · ${formatDate(row.date_administered, locale)}`}
              />
            )}
          </span>
        </div>
      );
      const { data: missing } = await supabase
        .from("immunization_compliance")
        .select("immunization_type_id, immunization_type_name")
        .eq("resident_id", id)
        .returns<{ immunization_type_id: string; immunization_type_name: string }[]>();
      // The compliance view carries no Thai (0166 kept that private view narrow); the picker view has it.
      const { data: missingTh } =
        locale === "th" && missing && missing.length > 0
          ? await supabase
              .from("picker_immunization_types")
              .select("id, name_th")
              .in("id", missing.map((m) => m.immunization_type_id))
              .returns<{ id: string; name_th: string | null }[]>()
          : { data: [] as { id: string; name_th: string | null }[] };
      const { data: nextDue } = await supabase
        .from("immunization_next_due")
        .select("immunization_type_name, immunization_type_name_th, next_due_date")
        .eq("resident_id", id)
        .not("next_due_date", "is", null)
        .order("next_due_date", { ascending: true })
        .returns<{ immunization_type_name: string; immunization_type_name_th: string | null; next_due_date: string }[]>();
      const today = todayIso();
      body = (
        <div className="flex flex-col gap-4">
          {!isDeceased && (
            <div className="flex justify-end">
              <ActionLink
                href={`/immunizations/new?residentId=${id}`}
                label={t.residents.sections.logImmunization}
                icon={SECTION_ICONS.immunizations}
                variant="primary"
                iconOnlyOnMobile={false}
              />
            </div>
          )}
          {missing && missing.length > 0 && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
              {t.residents.sections.missingMandatory(
                missing
                  .map((m) =>
                    localLabel(locale, m.immunization_type_name, missingTh?.find((x) => x.id === m.immunization_type_id)?.name_th),
                  )
                  .join(", "),
              )}
            </div>
          )}
          {nextDue && nextDue.length > 0 && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="mb-2 text-sm font-medium text-muted">
                {t.residents.sections.nextDueDates}
              </h3>
              <ul className="flex flex-col gap-1 text-sm">
                {nextDue.map((n) => (
                  <li
                    key={n.immunization_type_name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-foreground">
                      {localLabel(locale, n.immunization_type_name, n.immunization_type_name_th)}
                    </span>
                    <span
                      className={
                        n.next_due_date < today
                          ? "text-danger"
                          : "text-muted"
                      }
                    >
                      {formatDate(n.next_due_date, locale)}
                      {n.next_due_date < today
                        ? ` ${t.residents.sections.overdue}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <RecordList
            rows={data ?? []}
            empty={t.residents.sections.empty.immunizations}
            render={(row) => renderImmunization(row, false)}
          />
          {archivedToggle(immCount)}
          {archivedList(archivedImm ?? [], (row) => renderImmunization(row, true))}
        </div>
      );
      break;
    }
    case "vet-appointments": {
      const [{ data }, { data: visitWeights }] = await Promise.all([
        supabase
          .from("vet_appointments")
          .select("id, appointment_date, status, reason, doctor_name, notes, cost, vets(name, name_th)")
          .is("archived_at", null)
          .eq("resident_id", id)
          .order("appointment_date", { ascending: false })
          .returns<
            {
              id: string;
              appointment_date: string;
              status: string;
              reason: string | null;
              doctor_name: string | null;
              notes: string | null;
              cost: number | null;
              vets: { name: string; name_th: string | null } | null;
            }[]
          >(),
        supabase
          .from("weight")
          .select("id, vet_appointment_id")
          .is("archived_at", null)
          .eq("resident_id", id)
          .not("vet_appointment_id", "is", null)
          .returns<{ id: string; vet_appointment_id: string }[]>(),
      ]);
      // One weight per visit (0106): a visit that has its reading offers to
      // correct it, and a visit still to come offers nothing, since a
      // reading can't be dated in the future.
      const weightByVisit = new Map(
        (visitWeights ?? []).map((w) => [w.vet_appointment_id, w.id]),
      );
      const visitCount = await archivedCount("vet_appointments");
      const { data: archivedVisits } = showArchived
        ? await supabase
            .from("vet_appointments")
            .select("id, appointment_date, status, reason, doctor_name, archive_reason, vets(name, name_th)")
            .not("archived_at", "is", null)
            .eq("resident_id", id)
            .order("appointment_date", { ascending: false })
            .returns<
              {
                id: string;
                appointment_date: string;
                status: string;
                reason: string | null;
                doctor_name: string | null;
                archive_reason: string | null;
                vets: { name: string; name_th: string | null } | null;
              }[]
            >()
        : { data: [] };
      const today = todayIso();
      // A visit can end with the resident admitted; offer that on each record
      // unless they're already in hospital, adopted out, or gone.
      const canSendToHospital = availablePlacementActions(
        isDeceased ? "Deceased" : residentState?.current_status,
      ).includes("hospital");
      const visitSubject = (row: { reason: string | null; appointment_date: string }) =>
        `${row.reason ?? t.residents.sections.vetVisitFallback} · ${formatDate(row.appointment_date, locale)}`;
      body = (
        <div className="flex flex-col gap-4">
          {!isDeceased && (
            <div className="flex justify-end">
              <ActionLink
                href={`/vet-visits/new?residentId=${id}`}
                label={t.residents.sections.bookVetVisit}
                icon={SECTION_ICONS["vet-appointments"]}
                variant="primary"
                iconOnlyOnMobile={false}
              />
            </div>
          )}
          <RecordList
            rows={data ?? []}
            empty={t.residents.sections.empty.vetAppointments}
            render={(row) => (
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {row.reason ?? t.residents.sections.vetVisitFallback}
                  </span>
                  {((row.vets && localLabel(locale, row.vets.name, row.vets.name_th)) || row.doctor_name) && (
                    <span className="text-xs text-muted">
                      {[(row.vets && localLabel(locale, row.vets.name, row.vets.name_th)), row.doctor_name].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted">
                    {formatDate(row.appointment_date, locale)}
                  </span>
                  <span className="text-xs capitalize text-muted">
                    {appointmentStatusLabel(t, row.status)}
                    {row.cost != null && ` · ${formatBaht(Number(row.cost), locale)}`}
                  </span>
                  <div className="flex flex-wrap justify-end gap-2">
                    {!isDeceased && (
                      <>
                        <RowActionLink
                          href={`/vet-visits/${row.id}/edit`}
                          label={t.common.edit}
                          subject={visitSubject(row)}
                          icon={ACTION_ICONS.edit}
                        />
                        <RowActionLink
                          href={`/blood-tests/new?residentId=${id}&vetAppointmentId=${row.id}`}
                          label={t.residents.sections.logBloodTest}
                          subject={visitSubject(row)}
                          icon={SECTION_ICONS["blood-tests"]}
                        />
                        {visitDate(row) <= today && (
                          <RowActionLink
                            href={`/prescriptions/new?residentId=${id}&vetAppointmentId=${row.id}`}
                            label={t.residents.sections.addPrescription}
                            subject={visitSubject(row)}
                            icon={SECTION_ICONS.prescriptions}
                          />
                        )}
                        {weightByVisit.has(row.id) ? (
                          <RowActionLink
                            href={`/weight/${weightByVisit.get(row.id)}/edit`}
                            label={t.residents.sections.editWeight}
                            subject={visitSubject(row)}
                            icon={SECTION_ICONS.weight}
                          />
                        ) : (
                          visitDate(row) <= today && (
                            <RowActionLink
                              href={`/weight/new?residentId=${id}&vetAppointmentId=${row.id}`}
                              label={t.residents.sections.logWeight}
                              subject={visitSubject(row)}
                              icon={SECTION_ICONS.weight}
                            />
                          )
                        )}
                        <RowActionLink
                          href={`/procedures/new?residentId=${id}&vetAppointmentId=${row.id}`}
                          label={t.residents.sections.logProcedure}
                          subject={visitSubject(row)}
                          icon={SECTION_ICONS.procedures}
                        />
                      </>
                    )}
                    {canSendToHospital && (
                      <RowActionLink
                        href={`/residents/${id}/hospital?vetAppointmentId=${row.id}`}
                        label={t.residents.hub.placementActions.hospital}
                        subject={visitSubject(row)}
                        icon={PLACEMENT_ICONS.hospital}
                      />
                    )}
                  </div>
                  {canArchive("visit") && (
                    <ArchiveRecordControl
                      kind="visit"
                      residentId={id}
                      id={row.id}
                      archived={false}
                      subject={visitSubject(row)}
                    />
                  )}
                </div>
              </div>
            )}
          />
          {archivedToggle(visitCount)}
          {archivedList(archivedVisits ?? [], (row) => (
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-medium">
                  {row.reason ?? t.residents.sections.vetVisitFallback}
                </span>
                {((row.vets && localLabel(locale, row.vets.name, row.vets.name_th)) || row.doctor_name) && (
                  <span className="text-xs text-muted">
                    {[(row.vets && localLabel(locale, row.vets.name, row.vets.name_th)), row.doctor_name].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted">
                  {formatDate(row.appointment_date, locale)} ·{" "}
                  {appointmentStatusLabel(t, row.status)}
                </span>
                {canArchive("visit") && (
                  <ArchiveRecordControl
                    kind="visit"
                    residentId={id}
                    id={row.id}
                    archived
                    subject={`${row.reason ?? t.residents.sections.vetVisitFallback} · ${formatDate(row.appointment_date, locale)}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      );
      break;
    }
    case "prescriptions": {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(
          "id, start_date, end_date, dose_quantity, notes, medication:picker_medications(name, dose_unit, name_th), frequency(label, label_th), vet_appointments(appointment_date)",
        )
        .is("archived_at", null)
        .eq("resident_id", id)
        .order("start_date", { ascending: false })
        .returns<
          {
            id: string;
            start_date: string;
            end_date: string | null;
            dose_quantity: number | null;
            notes: string | null;
            medication: { name: string; dose_unit: string; name_th: string | null } | null;
            frequency: { label: string; label_th: string | null } | null;
            vet_appointments: { appointment_date: string } | null;
          }[]
        >();
      const rxCount = await archivedCount("prescriptions");
      const { data: archivedRx } = showArchived
        ? await supabase
            .from("prescriptions")
            .select(
              "id, start_date, end_date, dose_quantity, notes, archive_reason, medication:picker_medications(name, dose_unit, name_th), frequency(label, label_th), vet_appointments(appointment_date)",
            )
            .not("archived_at", "is", null)
            .eq("resident_id", id)
            .order("start_date", { ascending: false })
            .returns<
              {
                id: string;
                start_date: string;
                end_date: string | null;
                dose_quantity: number | null;
                notes: string | null;
                archive_reason: string | null;
                medication: { name: string; dose_unit: string; name_th: string | null } | null;
                frequency: { label: string; label_th: string | null } | null;
                vet_appointments: { appointment_date: string } | null;
              }[]
            >()
        : { data: [] };
      // Current = still running today (including one dated to start later);
      // expired = its end date has passed. A death ends every open
      // prescription on the date of death (0027), so a deceased resident's
      // list is all expired.
      const today = todayIso();
      const rows = data ?? [];
      const current = rows.filter((row) => !row.end_date || row.end_date >= today);
      const expired = rows.filter((row) => row.end_date && row.end_date < today);
      // Every row can be edited while the record is open; "End today" only
      // makes sense on a current row whose course has started.
      const renderPrescription = (
        row: (typeof rows)[number],
        isCurrent: boolean,
        archived = false,
      ) => {
        const dose = formatDose(t, row.dose_quantity, row.medication?.dose_unit);
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-medium">
                  {(row.medication ? localLabel(locale, row.medication.name, row.medication.name_th) : t.residents.sections.unknownMedication)}
                </span>
                {(dose || (row.frequency && localLabel(locale, row.frequency.label, row.frequency.label_th))) && (
                  <span className="text-xs text-muted">
                    {[dose, (row.frequency && localLabel(locale, row.frequency.label, row.frequency.label_th))].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-0.5 text-right">
                <span className="text-xs text-muted">
                  {formatDate(row.start_date, locale)} –{" "}
                  {row.end_date
                    ? formatDate(row.end_date, locale)
                    : t.residents.sections.ongoing}
                </span>
                {row.start_date > today && (
                  <span className="text-xs text-primary">
                    {t.residents.sections.startsOn(formatDate(row.start_date, locale))}
                  </span>
                )}
                {row.vet_appointments && (
                  <span className="text-xs text-muted">
                    {t.residents.sections.linkedVisit(
                      formatDate(row.vet_appointments.appointment_date, locale),
                    )}
                  </span>
                )}
              </div>
            </div>
            {row.notes && <span className="text-xs text-muted">{row.notes}</span>}
            {!isDeceased && !archived && (
              <RecordRowActions
                editHref={`/prescriptions/${row.id}/edit`}
                subject={`${(row.medication ? localLabel(locale, row.medication.name, row.medication.name_th) : t.residents.sections.unknownMedication)} · ${formatDate(row.start_date, locale)}`}
                endToday={
                  isCurrent && row.start_date <= today
                    ? endPrescriptionToday.bind(null, id, row.id)
                    : null
                }
                labels={{
                  endToday: t.prescriptions.endToday,
                  ending: t.prescriptions.ending,
                }}
              />
            )}
            {canArchive("prescription") && (
              <div className="flex justify-end">
                <ArchiveRecordControl
                  kind="prescription"
                  residentId={id}
                  id={row.id}
                  archived={archived}
                  subject={`${(row.medication ? localLabel(locale, row.medication.name, row.medication.name_th) : t.residents.sections.unknownMedication)} · ${formatDate(row.start_date, locale)}`}
                />
              </div>
            )}
          </div>
        );
      };
      body = (
        <div className="flex flex-col gap-4">
          {!isDeceased && (
            <div className="flex justify-end">
              <ActionLink
                href={`/prescriptions/new?residentId=${id}`}
                label={t.residents.sections.addPrescription}
                icon={SECTION_ICONS.prescriptions}
                variant="primary"
                iconOnlyOnMobile={false}
              />
            </div>
          )}
          {error && <p className="text-sm text-danger">{error.message}</p>}
          {rows.length === 0 ? (
            <Placeholder>{t.residents.sections.empty.prescriptions}</Placeholder>
          ) : (
            <>
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-medium text-muted">
                  {t.residents.sections.currentPrescriptions} ({current.length})
                </h2>
                <RecordList
                  rows={current}
                  empty={t.residents.sections.noCurrentPrescriptions}
                  render={(row) => renderPrescription(row, true)}
                />
              </section>
              {expired.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h2 className="text-sm font-medium text-muted">
                    {t.residents.sections.expiredPrescriptions} ({expired.length})
                  </h2>
                  <RecordList
                    rows={expired}
                    empty=""
                    render={(row) => renderPrescription(row, false)}
                  />
                </section>
              )}
            </>
          )}
          {archivedToggle(rxCount)}
          {archivedList(archivedRx ?? [], (row) => renderPrescription(row, false, true))}
        </div>
      );
      break;
    }
    case "diet": {
      const { data, error } = await supabase
        .from("resident_diets")
        .select(
          "id, start_date, end_date, meals_per_day, daily_quantity, notes, diet_types:picker_diet_types(name, name_th, unit, daily_qty_small, daily_qty_medium, daily_qty_large)",
        )
        .eq("resident_id", id)
        .order("start_date", { ascending: false })
        .returns<
          {
            id: string;
            start_date: string;
            end_date: string | null;
            meals_per_day: number;
            daily_quantity: number | null;
            notes: string | null;
            diet_types: {
              name: string;
              name_th: string | null;
              unit: string;
              daily_qty_small: number;
              daily_qty_medium: number;
              daily_qty_large: number;
            } | null;
          }[]
        >();
      // Current = still running today (including one dated to start later);
      // past = its end date has passed. A closed record (deceased) has no
      // current diets whatever the dates say.
      const today = todayIso();
      const rows = data ?? [];
      const current = isDeceased
        ? []
        : rows.filter((row) => !row.end_date || row.end_date >= today);
      const past = rows.filter((row) => !current.includes(row));
      const renderDiet = (row: (typeof rows)[number], isCurrent: boolean) => {
        const type = row.diet_types;
        const unit = type ? dietUnitLabel(t, type.unit) : "";
        const quantity = type
          ? row.daily_quantity != null
            ? t.residents.sections.dailyQuantity(formatQuantity(row.daily_quantity), unit)
            : t.residents.sections.dailyQuantityDefault(
                formatQuantity(defaultDailyQuantity(type, resident.size)),
                unit,
                sizeLabel(t, resident.size ?? "Medium"),
              )
          : null;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-medium">
                  {(type ? localLabel(locale, type.name, type.name_th) : t.residents.sections.unknownDietType)}
                </span>
                <span className="text-xs text-muted">
                  {[t.residents.sections.mealsPerDay(row.meals_per_day), quantity]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5 text-right">
                <span className="text-xs text-muted">
                  {formatDate(row.start_date, locale)} –{" "}
                  {row.end_date
                    ? formatDate(row.end_date, locale)
                    : t.residents.sections.ongoing}
                </span>
                {row.start_date > today && (
                  <span className="text-xs text-primary">
                    {t.residents.sections.startsOn(formatDate(row.start_date, locale))}
                  </span>
                )}
              </div>
            </div>
            {row.notes && <span className="text-xs text-muted">{row.notes}</span>}
            {!isDeceased && (
              <RecordRowActions
                editHref={`/diets/${row.id}/edit`}
                subject={`${(type ? localLabel(locale, type.name, type.name_th) : t.residents.sections.unknownDietType)} · ${formatDate(row.start_date, locale)}`}
                endToday={
                  isCurrent && row.start_date <= today
                    ? endDietToday.bind(null, id, row.id)
                    : null
                }
                labels={{ endToday: t.diets.endToday, ending: t.diets.ending }}
              />
            )}
          </div>
        );
      };
      body = (
        <div className="flex flex-col gap-4">
          {!isDeceased && (
            <div className="flex justify-end">
              <ActionLink
                href={`/diets/new?residentId=${id}`}
                label={t.residents.sections.addDiet}
                icon={SECTION_ICONS.diet}
                variant="primary"
                iconOnlyOnMobile={false}
              />
            </div>
          )}
          {error && <p className="text-sm text-danger">{error.message}</p>}
          {!resident.size && !isDeceased && (
            <p className="text-sm text-warning">{t.residents.hub.sizeNotSet}</p>
          )}
          {rows.length === 0 ? (
            <Placeholder>{t.residents.sections.empty.diet}</Placeholder>
          ) : (
            <>
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-medium text-muted">
                  {t.residents.sections.currentDiets} ({current.length})
                </h2>
                <RecordList
                  rows={current}
                  empty={t.residents.sections.noCurrentDiets}
                  render={(row) => renderDiet(row, true)}
                />
              </section>
              {past.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h2 className="text-sm font-medium text-muted">
                    {t.residents.sections.pastDiets} ({past.length})
                  </h2>
                  <RecordList rows={past} empty="" render={(row) => renderDiet(row, false)} />
                </section>
              )}
            </>
          )}
        </div>
      );
      break;
    }
    case "weight": {
      const { data, error } = await supabase
        .from("weight")
        .select("id, date, weight_kg, notes, vet_appointments(appointment_date)")
        .is("archived_at", null)
        .eq("resident_id", id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .returns<
          {
            id: string;
            date: string;
            weight_kg: number;
            notes: string | null;
            vet_appointments: { appointment_date: string } | null;
          }[]
        >();
      const rows = data ?? [];
      const weightCount = await archivedCount("weight");
      const { data: archivedWeights } = showArchived
        ? await supabase
            .from("weight")
            .select("id, date, weight_kg, notes, archive_reason, vet_appointments(appointment_date)")
            .not("archived_at", "is", null)
            .eq("resident_id", id)
            .order("date", { ascending: false })
            .returns<
              {
                id: string;
                date: string;
                weight_kg: number;
                notes: string | null;
                archive_reason: string | null;
                vet_appointments: { appointment_date: string } | null;
              }[]
            >()
        : { data: [] };
      // Newest first, so the trend reads latest vs the one before it and
      // vs the very first reading on file.
      const latest = rows[0];
      const previous = rows[1];
      const first = rows.length > 1 ? rows[rows.length - 1] : undefined;
      const deltaTile = (
        label: string,
        from: { date: string; weight_kg: number } | undefined,
      ) => {
        if (!latest || !from) return null;
        const delta = latest.weight_kg - from.weight_kg;
        const percent = (delta / from.weight_kg) * 100;
        const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted">{label}</span>
            <span className="flex items-center gap-1.5 text-lg font-semibold text-foreground">
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
              {formatWeightDelta(delta, locale)}
            </span>
            <span className="text-xs text-muted">
              {t.weight.stats.percentSince(
                `${percent > 0 ? "+" : percent < 0 ? "−" : ""}${Math.abs(percent).toFixed(1)}`,
                formatDate(from.date, locale),
              )}
            </span>
          </div>
        );
      };
      body = (
        <div className="flex flex-col gap-4">
          {!isDeceased && (
            <div className="flex justify-end">
              <ActionLink
                href={`/weight/new?residentId=${id}`}
                label={t.residents.sections.logWeight}
                icon={SECTION_ICONS.weight}
                variant="primary"
                iconOnlyOnMobile={false}
              />
            </div>
          )}
          {error && <p className="text-sm text-danger">{error.message}</p>}
          {latest && (
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted">{t.weight.stats.latest}</span>
                  <span className="text-lg font-semibold text-foreground">
                    {formatWeightKg(latest.weight_kg, locale)}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(latest.date, locale)}
                  </span>
                </div>
                {deltaTile(t.weight.stats.sincePrevious, previous)}
                {deltaTile(t.weight.stats.sinceFirst, first)}
              </div>
              <WeightChart
                points={rows.map((row) => ({
                  id: row.id,
                  date: row.date,
                  weightKg: row.weight_kg,
                }))}
              />
            </div>
          )}
          <RecordList
            rows={rows}
            empty={t.residents.sections.empty.weight}
            render={(row) => (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {formatWeightKg(row.weight_kg, locale)}
                  </span>
                  <span className="text-right text-xs text-muted">
                    {formatDate(row.date, locale)}
                    {row.vet_appointments &&
                      ` · ${t.residents.sections.linkedVisit(
                        formatDate(row.vet_appointments.appointment_date, locale),
                      )}`}
                  </span>
                </div>
                {row.notes && <span className="text-xs text-muted">{row.notes}</span>}
                {(!isDeceased || canArchive("weight")) && (
                  <div className="flex items-start justify-end gap-3">
                    {!isDeceased && (
                      <RowActionLink
                        href={`/weight/${row.id}/edit`}
                        label={t.common.edit}
                        subject={`${formatWeightKg(row.weight_kg, locale)} · ${formatDate(row.date, locale)}`}
                        icon={ACTION_ICONS.edit}
                      />
                    )}
                    {canArchive("weight") && (
                      <ArchiveRecordControl
                        kind="weight"
                        residentId={id}
                        id={row.id}
                        archived={false}
                        subject={`${formatWeightKg(row.weight_kg, locale)} · ${formatDate(row.date, locale)}`}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          />
          {archivedToggle(weightCount)}
          {archivedList(archivedWeights ?? [], (row) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{formatWeightKg(row.weight_kg, locale)}</span>
                <span className="text-right text-xs text-muted">
                  {formatDate(row.date, locale)}
                  {row.vet_appointments &&
                    ` · ${t.residents.sections.linkedVisit(
                      formatDate(row.vet_appointments.appointment_date, locale),
                    )}`}
                </span>
              </div>
              {row.notes && <span className="text-xs text-muted">{row.notes}</span>}
              {canArchive("weight") && (
                <div className="flex justify-end">
                  <ArchiveRecordControl
                    kind="weight"
                    residentId={id}
                    id={row.id}
                    archived
                    subject={`${formatWeightKg(row.weight_kg, locale)} · ${formatDate(row.date, locale)}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      );
      break;
    }
    case "procedures": {
      const { data: procedureRows, error } = await supabase
        .from("procedures")
        .select(
          "id, date, notes, procedure_types(name, name_th), vet_appointments(appointment_date, reason)",
        )
        .eq("resident_id", id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .returns<
          {
            id: string;
            date: string;
            notes: string | null;
            procedure_types: { name: string; name_th: string | null } | null;
            vet_appointments: { appointment_date: string; reason: string | null } | null;
          }[]
        >();

      // X-rays and scans hang off the procedure, not the resident — same
      // second attachments query as blood tests.
      const procedureIds = (procedureRows ?? []).map((row) => row.id);
      const { data: procedureFiles } =
        procedureIds.length > 0
          ? await supabase
              .from("attachments")
              .select("id, owner_id, drive_file_id, file_name")
              .eq("owner_type", "procedure")
              .in("owner_id", procedureIds)
              .order("uploaded_at", { ascending: true })
              .returns<
                { id: string; owner_id: string; drive_file_id: string; file_name: string | null }[]
              >()
          : { data: [] };

      const procedures: ProcedureRow[] = (procedureRows ?? []).map((row) => ({
        id: row.id,
        date: row.date,
        notes: row.notes,
        procedure_types: row.procedure_types && { name: localLabel(locale, row.procedure_types.name, row.procedure_types.name_th) },
        vet_appointments: row.vet_appointments,
        attachments: (procedureFiles ?? [])
          .filter((a) => a.owner_id === row.id)
          .map((a) => ({ id: a.id, drive_file_id: a.drive_file_id, file_name: a.file_name })),
      }));

      body = (
        <div className="flex flex-col gap-4">
          {!isDeceased && (
            <div className="flex justify-end">
              <ActionLink
                href={`/procedures/new?residentId=${id}`}
                label={t.residents.sections.logProcedure}
                icon={SECTION_ICONS.procedures}
                variant="primary"
                iconOnlyOnMobile={false}
              />
            </div>
          )}
          {error && <p className="text-sm text-danger">{error.message}</p>}
          <ProcedureList
            residentId={id}
            procedures={procedures}
            readOnly={isDeceased}
          />
        </div>
      );
      break;
    }
    case "blood-tests": {
      const { data: tests } = await supabase
        .from("blood_tests")
        .select(
          "id, date, results, blood_test_types(name, name_th), vet_appointments(appointment_date, reason)",
        )
        .eq("resident_id", id)
        .order("date", { ascending: false })
        .returns<
          {
            id: string;
            date: string;
            results: string | null;
            blood_test_types: { name: string; name_th: string | null } | null;
            vet_appointments: { appointment_date: string; reason: string | null } | null;
          }[]
        >();

      const testIds = (tests ?? []).map((row) => row.id);
      const { data: attachmentRows } =
        testIds.length > 0
          ? await supabase
              .from("attachments")
              .select("id, owner_id, drive_file_id, file_name")
              .eq("owner_type", "blood_test")
              .in("owner_id", testIds)
              .order("uploaded_at", { ascending: true })
              .returns<
                { id: string; owner_id: string; drive_file_id: string; file_name: string | null }[]
              >()
          : { data: [] };

      const bloodTests: BloodTestRow[] = (tests ?? []).map((row) => ({
        id: row.id,
        date: row.date,
        results: row.results,
        blood_test_types: row.blood_test_types && { name: localLabel(locale, row.blood_test_types.name, row.blood_test_types.name_th) },
        vet_appointments: row.vet_appointments,
        attachments: (attachmentRows ?? [])
          .filter((a) => a.owner_id === row.id)
          .map((a) => ({ id: a.id, drive_file_id: a.drive_file_id, file_name: a.file_name })),
      }));

      body = (
        <div className="flex flex-col gap-4">
          {!isDeceased && (
            <div className="flex justify-end">
              <ActionLink
                href={`/blood-tests/new?residentId=${id}`}
                label={t.residents.sections.logBloodTest}
                icon={SECTION_ICONS["blood-tests"]}
                variant="primary"
                iconOnlyOnMobile={false}
              />
            </div>
          )}
          <BloodTestList
            residentId={id}
            bloodTests={bloodTests}
            readOnly={isDeceased}
          />
        </div>
      );
      break;
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={`/residents/${id}`}
        className="text-sm text-muted hover:text-foreground"
      >
        {t.residents.sections.backTo(displayName)}
      </Link>
      <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
        {SectionIcon && (
          <SectionIcon aria-hidden="true" className="h-6 w-6 shrink-0 text-muted" />
        )}
        {title}
      </h1>
      {/* The vet-visit and procedure views are where a vet reads a chip
          against a scanner, or finds it missing and records it (0116). */}
      {(section === "vet-appointments" || section === "procedures") && (
        <MicrochipLine
          residentId={id}
          number={resident.microchip_number}
          implantedOn={resident.microchip_implanted_on}
          canEdit={!isDeceased && can(perms, "resident.microchip")}
        />
      )}
      {body}
    </main>
  );
}
