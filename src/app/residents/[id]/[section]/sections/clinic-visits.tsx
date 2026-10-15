import { formatBaht, formatDate, todayIso } from "@/lib/format";
import { localLabel } from "@/lib/translations/labels";
import { appointmentStatusLabel } from "@/lib/i18n/enum-labels";
import { can } from "@/lib/permissions/can";
import { ArchiveRecordControl } from "@/components/ArchiveRecordControl";
import { visitDate } from "@/lib/clinics/linkable";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS, PLACEMENT_ICONS, SECTION_ICONS } from "@/components/hub-icons";
import { RowActionLink } from "@/components/RowAction";
import { availablePlacementActions } from "@/lib/placements/available";
import type { SectionContext } from "./types";
import { googleCalendarUrl } from "@/lib/clinics/calendar-link";
import { getSiteOrigin } from "@/lib/site-origin";
import { RecordList } from "./shared";

export async function renderClinicVisitsSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, resident, residentState, isDeceased, perms, t, locale, supabase, showArchived, canArchive, archivedCount, archivedToggle, archivedList } = ctx;
  const [{ data }, { data: visitWeights }] = await Promise.all([
    supabase
      .from("clinic_visits")
      .select("id, appointment_date, status, reason, doctor_name, notes, cost, clinics(name, name_th)")
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
          clinics: { name: string; name_th: string | null } | null;
        }[]
      >(),
    supabase
      .from("weight")
      .select("id, clinic_visit_id")
      .is("archived_at", null)
      .eq("resident_id", id)
      .not("clinic_visit_id", "is", null)
      .returns<{ id: string; clinic_visit_id: string }[]>(),
  ]);
  // One weight per visit (0106): a visit that has its reading offers to
  // correct it, and a visit still to come offers nothing, since a
  // reading can't be dated in the future.
  const weightByVisit = new Map(
    (visitWeights ?? []).map((w) => [w.clinic_visit_id, w.id]),
  );
  const visitCount = await archivedCount("clinic_visits");
  const { data: archivedVisits } = showArchived
    ? await supabase
        .from("clinic_visits")
        .select("id, appointment_date, status, reason, doctor_name, archive_reason, clinics(name, name_th)")
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
            clinics: { name: string; name_th: string | null } | null;
          }[]
        >()
    : { data: [] };
  const today = todayIso();
  const origin = await getSiteOrigin();
  const sv = t.shelterVisits;
  const calendarUrl = (row: { status: string; appointment_date: string; reason: string | null; clinics: { name: string; name_th: string | null } | null }) => {
    const clinicName = row.clinics ? localLabel(locale, row.clinics.name, row.clinics.name_th) : "";
    return googleCalendarUrl({
      status: row.status,
      appointmentDate: row.appointment_date,
      title: sv.calendarTitle(resident.name, clinicName || "—"),
      details: `${sv.calendarDetails(row.reason ?? sv.fallbackReason)}${origin ? ` ${new URL(`/residents/${id}/clinic-visits`, origin).toString()}` : ""}`,
      location: clinicName || null,
    });
  };
  const anyCalendar = (data ?? []).some((row) => calendarUrl(row) !== null);
  // A visit can end with the resident admitted; offer that on each record
  // unless they're already in hospital, adopted out, or gone.
  const canSendToHospital = availablePlacementActions(
    isDeceased ? "Deceased" : residentState?.current_status,
  ).includes("hospital");
  const visitSubject = (row: { reason: string | null; appointment_date: string }) =>
    `${row.reason ?? t.residents.sections.vetVisitFallback} · ${formatDate(row.appointment_date, locale)}`;
  return (
    <div className="flex flex-col gap-4">
      {!isDeceased && (
        <div className="flex justify-end">
          <ActionLink
            href={`/clinic-visits/new?residentId=${id}`}
            label={t.residents.sections.bookVetVisit}
            icon={SECTION_ICONS["clinic-visits"]}
            variant="primary"
            iconOnlyOnMobile={false}
          />
        </div>
      )}
      {anyCalendar && <p className="text-xs text-muted">{sv.calendarNote}</p>}
      <RecordList
        rows={data ?? []}
        empty={t.residents.sections.empty.vetAppointments}
        render={(row) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="font-medium">
                {row.reason ?? t.residents.sections.vetVisitFallback}
              </span>
              {((row.clinics && localLabel(locale, row.clinics.name, row.clinics.name_th)) || row.doctor_name) && (
                <span className="text-xs text-muted">
                  {[(row.clinics && localLabel(locale, row.clinics.name, row.clinics.name_th)), row.doctor_name].filter(Boolean).join(" · ")}
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
                {calendarUrl(row) && (
                  <a href={calendarUrl(row)!} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline">
                    {sv.addToCalendar}
                  </a>
                )}
                {!isDeceased && (
                  <>
                    {can(perms, "medical.visits") && (
                      <RowActionLink
                        href={`/clinic-visits/${row.id}/edit`}
                        label={t.common.edit}
                        subject={visitSubject(row)}
                        icon={ACTION_ICONS.edit}
                      />
                    )}
                    <RowActionLink
                      href={`/blood-tests/new?residentId=${id}&clinicVisitId=${row.id}`}
                      label={t.residents.sections.logBloodTest}
                      subject={visitSubject(row)}
                      icon={SECTION_ICONS["blood-tests"]}
                    />
                    {visitDate(row) <= today && (
                      <RowActionLink
                        href={`/prescriptions/new?residentId=${id}&clinicVisitId=${row.id}`}
                        label={t.residents.sections.addPrescription}
                        subject={visitSubject(row)}
                        icon={SECTION_ICONS.prescriptions}
                      />
                    )}
                    {weightByVisit.has(row.id) ? (
                      can(perms, "medical.weight") && (
                        <RowActionLink
                          href={`/weight/${weightByVisit.get(row.id)}/edit`}
                          label={t.residents.sections.editWeight}
                          subject={visitSubject(row)}
                          icon={SECTION_ICONS.weight}
                        />
                      )
                    ) : (
                      visitDate(row) <= today && (
                        <RowActionLink
                          href={`/weight/new?residentId=${id}&clinicVisitId=${row.id}`}
                          label={t.residents.sections.logWeight}
                          subject={visitSubject(row)}
                          icon={SECTION_ICONS.weight}
                        />
                      )
                    )}
                    <RowActionLink
                      href={`/procedures/new?residentId=${id}&clinicVisitId=${row.id}`}
                      label={t.residents.sections.logProcedure}
                      subject={visitSubject(row)}
                      icon={SECTION_ICONS.procedures}
                    />
                  </>
                )}
                {canSendToHospital && (
                  <RowActionLink
                    href={`/residents/${id}/hospital?clinicVisitId=${row.id}`}
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
            {((row.clinics && localLabel(locale, row.clinics.name, row.clinics.name_th)) || row.doctor_name) && (
              <span className="text-xs text-muted">
                {[(row.clinics && localLabel(locale, row.clinics.name, row.clinics.name_th)), row.doctor_name].filter(Boolean).join(" · ")}
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
}
