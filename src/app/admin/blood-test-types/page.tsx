import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateBloodTestTypeForm } from "./CreateBloodTestTypeForm";
import {
  BloodTestTypesTable,
  type BloodTestTypeRow,
} from "./BloodTestTypesTable";

export default async function BloodTestTypesPage() {
  await requireAdminUser();
  const { t } = await getT();

  const supabase = await createClient();
  const [typesResult, bloodTestsResult] = await Promise.all([
    supabase
      .from("blood_test_types")
      .select("id, name")
      .order("name")
      .returns<Pick<BloodTestTypeRow, "id" | "name">[]>(),
    // One row per blood test is cheap at shelter scale and gives the
    // reference counts that gate the delete buttons.
    supabase
      .from("blood_tests")
      .select("blood_test_type_id")
      .returns<{ blood_test_type_id: string }[]>(),
  ]);

  const counts = new Map<string, number>();
  for (const row of bloodTestsResult.data ?? []) {
    counts.set(row.blood_test_type_id, (counts.get(row.blood_test_type_id) ?? 0) + 1);
  }
  const bloodTestTypes: BloodTestTypeRow[] = (typesResult.data ?? []).map(
    (type) => ({ ...type, blood_test_count: counts.get(type.id) ?? 0 }),
  );

  const p = t.admin.bloodTestTypes;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{p.title}</h1>
        <p className="text-sm text-muted">{p.subtitle}</p>
      </div>

      {typesResult.error && (
        <p className="text-sm text-danger">
          {p.couldntLoad}: {typesResult.error.message}
        </p>
      )}
      {bloodTestsResult.error && (
        <p className="text-sm text-danger">
          {p.couldntLoadUsage}: {bloodTestsResult.error.message}
        </p>
      )}

      <CreateBloodTestTypeForm />
      <BloodTestTypesTable bloodTestTypes={bloodTestTypes} />
    </main>
  );
}
