import Link from "next/link";
import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateVetForm } from "./CreateVetForm";
import { VetsTable, type VetRow } from "./VetsTable";

export default async function VetsAdminPage() {
  await requireManagementUser();
  const { t } = await getT();

  const supabase = await createClient();
  const [vetsResult, visitsResult] = await Promise.all([
    supabase
      .from("vets")
      .select("id, name, clinic_name, contact_info")
      .order("name")
      .returns<Omit<VetRow, "visit_count">[]>(),
    // One row per visit is cheap at shelter scale and avoids a view just
    // for the count that gates the delete button.
    supabase
      .from("vet_appointments")
      .select("vet_id")
      .not("vet_id", "is", null)
      .returns<{ vet_id: string }[]>(),
  ]);

  const counts = new Map<string, number>();
  for (const row of visitsResult.data ?? []) {
    counts.set(row.vet_id, (counts.get(row.vet_id) ?? 0) + 1);
  }
  const vets: VetRow[] = (vetsResult.data ?? []).map((vet) => ({
    ...vet,
    visit_count: counts.get(vet.id) ?? 0,
  }));

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.management.vets.title}
        </h1>
        <p className="text-sm text-muted">
          {t.management.vets.subtitle}{" "}
          <Link href="/vets" className="text-primary hover:underline">
            {t.management.vets.viewHub}
          </Link>
        </p>
      </div>

      {vetsResult.error && (
        <p className="text-sm text-danger">
          {t.management.vets.couldntLoad}: {vetsResult.error.message}
        </p>
      )}
      {visitsResult.error && (
        <p className="text-sm text-danger">
          {t.management.vets.couldntLoadVisits}: {visitsResult.error.message}
        </p>
      )}

      <CreateVetForm />
      <VetsTable vets={vets} />
    </main>
  );
}
