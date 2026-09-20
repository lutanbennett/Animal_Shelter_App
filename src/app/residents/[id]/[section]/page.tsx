import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { formatDate, formatWeightDelta, formatWeightKg } from "@/lib/format";
import { getT } from "@/lib/i18n/get-t";
import {
  appointmentStatusLabel,
  formatDose,
  placementTypeLabel,
} from "@/lib/i18n/enum-labels";
import { PhotoUploader } from "@/components/PhotoUploader";
import { PhotoGallery, type PhotoRow } from "@/components/PhotoGallery";
import { BloodTestList, type BloodTestRow } from "@/components/BloodTestList";
import { ProcedureList, type ProcedureRow } from "@/components/ProcedureList";
import { WeightChart } from "@/components/WeightChart";
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
      // A visit can end with the resident admitted; offer that on each record
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
                      <>
                        <Link
                          href={`/blood-tests/new?residentId=${id}&vetAppointmentId=${row.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {t.residents.sections.logBloodTest}
                        </Link>
                        <Link
                          href={`/prescriptions/new?residentId=${id}&vetAppointmentId=${row.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {t.residents.sections.addPrescription}
                        </Link>
                        <Link
                          href={`/weight/new?residentId=${id}&vetAppointmentId=${row.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {t.residents.sections.logWeight}
                        </Link>
                        <Link
                          href={`/procedures/new?residentId=${id}&vetAppointmentId=${row.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {t.residents.sections.logProcedure}
                        </Link>
                      </>
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
      const { data, error } = await supabase
        .from("prescriptions")
        .select(
          "id, start_date, end_date, dose_quantity, notes, medication(name, dose_unit), frequency(label), vet_appointments(appointment_date)",
        )
        .eq("resident_id", id)
        .order("start_date", { ascending: false })
        .returns<
          {
            id: string;
            start_date: string;
            end_date: string | null;
            dose_quantity: number | null;
            notes: string | null;
            medication: { name: string; dose_unit: string } | null;
            frequency: { label: string } | null;
            vet_appointments: { appointment_date: string } | null;
          }[]
        >();
      // Current = still running today (including one dated to start later);
      // expired = its end date has passed. A death ends every open
      // prescription on the date of death (0027), so a deceased resident's
      // list is all expired.
      const today = new Date().toISOString().slice(0, 10);
      const rows = data ?? [];
      const current = rows.filter((row) => !row.end_date || row.end_date >= today);
      const expired = rows.filter((row) => row.end_date && row.end_date < today);
      const renderPrescription = (row: (typeof rows)[number]) => {
        const dose = formatDose(t, row.dose_quantity, row.medication?.dose_unit);
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-medium">
                  {row.medication?.name ?? t.residents.sections.unknownMedication}
                </span>
                {(dose || row.frequency?.label) && (
                  <span className="text-xs text-muted">
                    {[dose, row.frequency?.label].filter(Boolean).join(" · ")}
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
                  render={renderPrescription}
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
                    render={renderPrescription}
                  />
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
              </div>
            )}
          />
        </div>
      );
      break;
    }
    case "procedures": {
      const { data: procedureRows, error } = await supabase
        .from("procedures")
        .select(
          "id, date, notes, procedure_types(name), vet_appointments(appointment_date, reason)",
        )
        .eq("resident_id", id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .returns<
          {
            id: string;
            date: string;
            notes: string | null;
            procedure_types: { name: string } | null;
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
        procedure_types: row.procedure_types,
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
