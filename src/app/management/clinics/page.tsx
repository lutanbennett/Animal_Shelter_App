import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateClinicForm } from "./CreateClinicForm";
import { ClinicsTable, type ClinicRow } from "./ClinicsTable";
import { requirePermission } from "@/lib/permissions/require";

export default async function ClinicsAdminPage() {
  await requirePermission("clinics.list");
  const { t } = await getT();

  const supabase = await createClient();
  const [clinicsResult, visitsResult, doctorsResult] = await Promise.all([
    supabase
      .from("clinics")
      .select("id, name, name_th, contact_info, notes")
      .order("name")
      .returns<Omit<ClinicRow, "visit_count" | "doctor_count">[]>(),
    // One row per visit is cheap at shelter scale and avoids a view just
    // for the count that gates the delete button.
    supabase
      .from("clinic_visits")
      .select("clinic_id")
      .not("clinic_id", "is", null)
      .returns<{ clinic_id: string }[]>(),
    // A doctor counts at every clinic they work at (doctor_clinics, 0125; 0172 dropped the old single-clinic column).
    supabase.from("doctor_clinics").select("clinic_id").returns<{ clinic_id: string }[]>(),
  ]);

  const counts = new Map<string, number>();
  for (const row of visitsResult.data ?? []) {
    counts.set(row.clinic_id, (counts.get(row.clinic_id) ?? 0) + 1);
  }
  const doctorCounts = new Map<string, number>();
  for (const row of doctorsResult.data ?? []) {
    doctorCounts.set(row.clinic_id, (doctorCounts.get(row.clinic_id) ?? 0) + 1);
  }
  const clinics: ClinicRow[] = (clinicsResult.data ?? []).map((clinic) => ({
    ...clinic,
    visit_count: counts.get(clinic.id) ?? 0,
    doctor_count: doctorCounts.get(clinic.id) ?? 0,
  }));

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.management.vets.title}
        </h1>
        <p className="text-sm text-muted">
          {t.management.vets.subtitle}{" "}
          <Link href="/clinics" className="text-primary hover:underline">
            {t.management.vets.viewHub}
          </Link>
        </p>
      </div>

      {/* No larger-screen notice: opened by Management or the 2IC on a phone (decision 2026-10-07). */}


      <>
        {clinicsResult.error && (
          <p className="text-sm text-danger">
            {t.management.vets.couldntLoad}: {clinicsResult.error.message}
          </p>
        )}
        {visitsResult.error && (
          <p className="text-sm text-danger">
            {t.management.vets.couldntLoadVisits}: {visitsResult.error.message}
          </p>
        )}

        <CreateClinicForm />
        <ClinicsTable clinics={clinics} />
      </>
    </main>
  );
}
