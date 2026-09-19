import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateImmunizationTypeForm } from "./CreateImmunizationTypeForm";
import {
  ImmunizationTypesTable,
  type ImmunizationTypeRow,
} from "./ImmunizationTypesTable";

export default async function ImmunizationTypesPage() {
  await requireAdminUser();
  const { t } = await getT();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("immunization_types")
    .select("id, name, is_mandatory, interval_months")
    .order("name")
    .returns<ImmunizationTypeRow[]>();

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

      {error && (
        <p className="text-sm text-danger">
          {t.admin.immunizationTypes.couldntLoad}: {error.message}
        </p>
      )}

      <CreateImmunizationTypeForm />
      <ImmunizationTypesTable immunizationTypes={data ?? []} />
    </main>
  );
}
