import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateImmunizationTypeForm } from "./CreateImmunizationTypeForm";
import {
  ImmunizationTypesTable,
  type ImmunizationTypeRow,
} from "./ImmunizationTypesTable";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";

export default async function ImmunizationTypesPage() {
  await requireAdminUser();
  const { t } = await getT();

  const supabase = await createClient();
  // cost is numeric(12, 2); PostgREST normally sends a JSON number but can
  // send a string, so it is normalised once here.
  const { data, error } = await supabase
    .from("immunization_types")
    .select("id, name, is_mandatory, interval_months, cost")
    .order("name")
    .returns<(Omit<ImmunizationTypeRow, "cost"> & { cost: number | string | null })[]>();

  const immunizationTypes: ImmunizationTypeRow[] = (data ?? []).map((row) => ({
    ...row,
    cost: row.cost == null ? null : Number(row.cost),
  }));

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.admin.immunizationTypes.title}
        </h1>
        <p className="text-sm text-muted">
          {t.admin.immunizationTypes.subtitle}
        </p>
      </div>

      <LargerScreenNotice>
        {error && (
          <p className="text-sm text-danger">
            {t.admin.immunizationTypes.couldntLoad}: {error.message}
          </p>
        )}

        <CreateImmunizationTypeForm />
        <ImmunizationTypesTable immunizationTypes={immunizationTypes} />
      </LargerScreenNotice>
    </main>
  );
}
