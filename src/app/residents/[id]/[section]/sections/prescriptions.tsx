import { formatDate, todayIso } from "@/lib/format";
import { localLabel } from "@/lib/translations/labels";
import { formatDose } from "@/lib/i18n/enum-labels";
import { can } from "@/lib/permissions/can";
import { RecordRowActions } from "@/components/RecordRowActions";
import { ArchiveRecordControl } from "@/components/ArchiveRecordControl";
import { endPrescriptionToday } from "@/app/prescriptions/actions";
import { ActionLink } from "@/components/ActionLink";
import { SECTION_ICONS } from "@/components/hub-icons";
import type { SectionContext } from "./types";
import { Placeholder, RecordList } from "./shared";

export async function renderPrescriptionsSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, isDeceased, perms, t, locale, supabase, showArchived, canArchive, archivedCount, archivedToggle, archivedList } = ctx;
  const { data, error } = await supabase
    .from("prescriptions")
    .select(
      "id, start_date, end_date, dose_quantity, notes, medication:picker_medications(name, dose_unit, name_th), frequency(label, label_th), clinic_visits(appointment_date)",
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
        clinic_visits: { appointment_date: string } | null;
      }[]
    >();
  const rxCount = await archivedCount("prescriptions");
  const { data: archivedRx } = showArchived
    ? await supabase
        .from("prescriptions")
        .select(
          "id, start_date, end_date, dose_quantity, notes, archive_reason, medication:picker_medications(name, dose_unit, name_th), frequency(label, label_th), clinic_visits(appointment_date)",
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
            clinic_visits: { appointment_date: string } | null;
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
            {row.clinic_visits && (
              <span className="text-xs text-muted">
                {t.residents.sections.linkedVisit(
                  formatDate(row.clinic_visits.appointment_date, locale),
                )}
              </span>
            )}
          </div>
        </div>
        {row.notes && <span className="text-xs text-muted">{row.notes}</span>}
        {!isDeceased && !archived && can(perms, "medical.prescriptions") && (
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
  return (
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
}
