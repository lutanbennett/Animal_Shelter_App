import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { getT } from "@/lib/i18n/get-t";
import {
  appointmentStatusLabel,
  placementTypeLabel,
} from "@/lib/i18n/enum-labels";
import { PhotoUploader } from "@/components/PhotoUploader";
import { PhotoGallery, type PhotoRow } from "@/components/PhotoGallery";
import { BloodTestList, type BloodTestRow } from "@/components/BloodTestList";
import { ActionLink } from "@/components/ActionLink";
import {
  PLACEMENT_ICONS,
  SECTION_ICONS,
  type HubSection,
} from "@/components/hub-icons";
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

export default async function ResidentSectionPage(
  props: PageProps<"/residents/[id]/[section]">,
) {
  const { id, section } = await props.params;
  const { t, locale } = await getT();
  const title = (
    t.residents.sections.titles as Record<string, string | undefined>
  )[section];
  if (!title) notFound();
  const SectionIcon = SECTION_ICONS[section as HubSection];

  const supabase = await createClient();

  const [residentResult, residentStateResult] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name, profile_photo_drive_file_id")
      .eq("id", id)
      .limit(1)
      .returns<
        {
          id: string;
          name: string;
          thai_name: string | null;
          profile_photo_drive_file_id: string | null;
        }[]
      >(),
    supabase
      .from("resident_current_state")
      .select("current_status, is_deceased")
      .eq("resident_id", id)
      .limit(1)
      .returns<{ current_status: string | null; is_deceased: boolean }[]>(),
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

  let body: React.ReactNode = null;

  switch (section) {
    case "housing": {
      // placement_history has two FKs to enclosures (enclosure_id and
      // previous_enclosure_id), so each embed has to name its FK or
      // PostgREST rejects the whole query as ambiguous.
      const { data, error } = await supabase
        .from("placement_history")
        .select(
          "id, placement_type, start_date, end_date, notes, cause_of_death, enclosure:enclosures!enclosure_id(name), previous_enclosure:enclosures!previous_enclosure_id(name), carer:contacts(name)",
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
            enclosure: { name: string } | null;
            previous_enclosure: { name: string } | null;
            carer: { name: string } | null;
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
                  <span className="text-xs text-muted">
                    {[
                      row.previous_enclosure?.name
                        ? `${row.previous_enclosure.name} → ${row.enclosure.name}`
                        : row.enclosure.name,
                      row.carer?.name && t.residents.hub.carer(row.carer.name),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
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
      const { data: photos } = await supabase
        .from("attachments")
        .select("id, drive_file_id, file_name, sub_folder, date_taken")
        .eq("owner_type", "resident")
        .eq("owner_id", id)
        .order("uploaded_at", { ascending: true })
        .returns<PhotoRow[]>();
      body = (
        <div className="flex flex-col gap-6">
          {!isDeceased && <PhotoUploader residentId={id} />}
          <PhotoGallery
            residentId={id}
            photos={photos ?? []}
            profilePhotoDriveFileId={resident.profile_photo_drive_file_id}
            readOnly={isDeceased}
          />
        </div>
      );
      break;
    }
    case "immunizations": {
      const { data } = await supabase
        .from("immunization_records")
        .select("id, date_administered, administered_by, immunization_types(name)")
        .eq("resident_id", id)
        .order("date_administered", { ascending: false })
        .returns<
          {
            id: string;
            date_administered: string;
            administered_by: string | null;
            immunization_types: { name: string } | null;
          }[]
        >();
      const { data: missing } = await supabase
        .from("immunization_compliance")
        .select("immunization_type_name")
        .eq("resident_id", id)
        .returns<{ immunization_type_name: string }[]>();
      const { data: nextDue } = await supabase
        .from("immunization_next_due")
        .select("immunization_type_name, next_due_date")
        .eq("resident_id", id)
        .not("next_due_date", "is", null)
        .order("next_due_date", { ascending: true })
        .returns<{ immunization_type_name: string; next_due_date: string }[]>();
      const today = new Date().toISOString().slice(0, 10);
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
                missing.map((m) => m.immunization_type_name).join(", "),
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
                      {n.immunization_type_name}
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
            render={(row) => (
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {row.immunization_types?.name ??
                    t.residents.sections.unknownVaccine}
                </span>
                <span className="text-xs text-muted">
                  {formatDate(row.date_administered, locale)}
                  {row.administered_by ? ` · ${row.administered_by}` : ""}
                </span>
              </div>
            )}
          />
        </div>
      );
      break;
    }
    case "vet-appointments": {
      const { data } = await supabase
        .from("vet_appointments")
        .select("id, appointment_date, status, reason, notes, vets(name)")
        .eq("resident_id", id)
        .order("appointment_date", { ascending: false })
        .returns<
          {
            id: string;
            appointment_date: string;
            status: string;
            reason: string | null;
            notes: string | null;
            vets: { name: string } | null;
          }[]
        >();
      // A visit can end with the animal admitted; offer that on each record
      // unless they're already in hospital, adopted out, or gone.
      const canSendToHospital = availablePlacementActions(
        isDeceased ? "Deceased" : residentState?.current_status,
      ).includes("hospital");
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
                  {row.vets?.name && (
                    <span className="text-xs text-muted">{row.vets.name}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted">
                    {formatDate(row.appointment_date, locale)}
                  </span>
                  <span className="text-xs capitalize text-muted">
                    {appointmentStatusLabel(t, row.status)}
                  </span>
                  <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
                    {!isDeceased && (
                      <Link
                        href={`/blood-tests/new?residentId=${id}&vetAppointmentId=${row.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t.residents.sections.logBloodTest}
                      </Link>
                    )}
                    {canSendToHospital && (
                      <Link
                        href={`/residents/${id}/hospital?vetAppointmentId=${row.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t.residents.hub.placementActions.hospital}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      );
      break;
    }
    case "prescriptions": {
      const { data } = await supabase
        .from("prescriptions")
        .select("id, start_date, end_date, notes, medication(name), frequency(label)")
        .eq("resident_id", id)
        .order("start_date", { ascending: false })
        .returns<
          {
            id: string;
            start_date: string;
            end_date: string | null;
            notes: string | null;
            medication: { name: string } | null;
            frequency: { label: string } | null;
          }[]
        >();
      body = (
        <RecordList
          rows={data ?? []}
          empty={t.residents.sections.empty.prescriptions}
          render={(row) => (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium">
                  {row.medication?.name ?? t.residents.sections.unknownMedication}
                </span>
                {row.frequency?.label && (
                  <span className="text-xs text-muted">{row.frequency.label}</span>
                )}
              </div>
              <span className="text-xs text-muted">
                {formatDate(row.start_date, locale)} –{" "}
                {row.end_date
                  ? formatDate(row.end_date, locale)
                  : t.residents.sections.ongoing}
              </span>
            </div>
          )}
        />
      );
      break;
    }
    case "weight": {
      const { data } = await supabase
        .from("weight")
        .select("id, date, weight_kg, notes")
        .eq("resident_id", id)
        .order("date", { ascending: false })
        .returns<{ id: string; date: string; weight_kg: number; notes: string | null }[]>();
      body = (
        <RecordList
          rows={data ?? []}
          empty={t.residents.sections.empty.weight}
          render={(row) => (
            <div className="flex items-center justify-between">
              <span className="font-medium">{row.weight_kg} kg</span>
              <span className="text-xs text-muted">
                {formatDate(row.date, locale)}
              </span>
            </div>
          )}
        />
      );
      break;
    }
    case "procedures": {
      const { data } = await supabase
        .from("procedures")
        .select("id, procedure_type, date, notes")
        .eq("resident_id", id)
        .order("date", { ascending: false })
        .returns<
          { id: string; procedure_type: string; date: string; notes: string | null }[]
        >();
      body = (
        <RecordList
          rows={data ?? []}
          empty={t.residents.sections.empty.procedures}
          render={(row) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{row.procedure_type}</span>
                <span className="text-xs text-muted">
                  {formatDate(row.date, locale)}
                </span>
              </div>
              {row.notes && <span className="text-xs text-muted">{row.notes}</span>}
            </div>
          )}
        />
      );
      break;
    }
    case "blood-tests": {
      const { data: tests } = await supabase
        .from("blood_tests")
        .select("id, date, results, vet_appointments(appointment_date, reason)")
        .eq("resident_id", id)
        .order("date", { ascending: false })
        .returns<
          {
            id: string;
            date: string;
            results: string | null;
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
      {body}
    </main>
  );
}
