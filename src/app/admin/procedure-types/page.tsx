import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateProcedureTypeForm } from "./CreateProcedureTypeForm";
import {
  ProcedureTypesTable,
  type ProcedureTypeRow,
} from "./ProcedureTypesTable";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";

export default async function ProcedureTypesPage() {
  await requireAdminUser();
  const { t } = await getT();

  const supabase = await createClient();
  const [typesResult, proceduresResult] = await Promise.all([
    supabase
      .from("procedure_types")
      .select("id, name")
      .order("name")
      .returns<Pick<ProcedureTypeRow, "id" | "name">[]>(),
    // One row per procedure is cheap at shelter scale and gives the
    // reference counts that gate the delete buttons.
    supabase
      .from("procedures")
      .select("procedure_type_id")
      .returns<{ procedure_type_id: string }[]>(),
  ]);

  const counts = new Map<string, number>();
  for (const row of proceduresResult.data ?? []) {
    counts.set(row.procedure_type_id, (counts.get(row.procedure_type_id) ?? 0) + 1);
  }
  const procedureTypes: ProcedureTypeRow[] = (typesResult.data ?? []).map(
    (type) => ({ ...type, procedure_count: counts.get(type.id) ?? 0 }),
  );

  const p = t.admin.procedureTypes;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{p.title}</h1>
        <p className="text-sm text-muted">{p.subtitle}</p>
      </div>

      <LargerScreenNotice>
        {typesResult.error && (
          <p className="text-sm text-danger">
            {p.couldntLoad}: {typesResult.error.message}
          </p>
        )}
        {proceduresResult.error && (
          <p className="text-sm text-danger">
            {p.couldntLoadUsage}: {proceduresResult.error.message}
          </p>
        )}

        <CreateProcedureTypeForm />
        <ProcedureTypesTable procedureTypes={procedureTypes} />
      </LargerScreenNotice>
    </main>
  );
}
