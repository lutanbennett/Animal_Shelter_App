import { formatDate, todayIso } from "@/lib/format";
import { localLabel } from "@/lib/translations/labels";
import { ArchiveRecordControl } from "@/components/ArchiveRecordControl";
import { ActionLink } from "@/components/ActionLink";
import { SECTION_ICONS } from "@/components/hub-icons";
import type { SectionContext } from "./types";
import { RecordList } from "./shared";

export async function renderImmunizationsSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, isDeceased, t, locale, supabase, showArchived, canArchive, archivedCount, archivedToggle, archivedList } = ctx;
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
  return (
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
}
