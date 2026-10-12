import { localLabel } from "@/lib/translations/labels";
import { ProcedureList, type ProcedureRow } from "@/components/ProcedureList";
import { ActionLink } from "@/components/ActionLink";
import { SECTION_ICONS } from "@/components/hub-icons";
import type { SectionContext } from "./types";

export async function renderProceduresSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, isDeceased, t, locale, supabase } = ctx;
  const { data: procedureRows, error } = await supabase
    .from("procedures")
    .select(
      "id, date, notes, procedure_types(name, name_th), clinic_visits(appointment_date, reason)",
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
        clinic_visits: { appointment_date: string; reason: string | null } | null;
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
    clinic_visits: row.clinic_visits,
    attachments: (procedureFiles ?? [])
      .filter((a) => a.owner_id === row.id)
      .map((a) => ({ id: a.id, drive_file_id: a.drive_file_id, file_name: a.file_name })),
  }));

  return (
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
}
