import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import { AddDoctorForm } from "./AddDoctorForm";
import { DoctorsTable, type DoctorRow } from "./DoctorsTable";

/**
 * One clinic's doctors (vet_doctors, 0102). The list fills itself from the
 * names typed on visits; this page is where it is seen and corrected —
 * renamed, merged, marked as left. Management and admin only: every
 * booking role may write the table under RLS (a visit can add a name), but
 * a rename or merge rewrites past visits, so it is a manager's correction.
 */
export default async function VetDoctorsPage(
  props: PageProps<"/management/vets/[id]/doctors">,
) {
  await requireManagementUser();
  const { id } = await props.params;
  const { t } = await getT();
  const d = t.management.vetDoctors;

  const supabase = await createClient();
  const [vetResult, doctorsResult, visitsResult] = await Promise.all([
    supabase
      .from("vets")
      .select("id, name, clinic_name")
      .eq("id", id)
      .limit(1)
      .returns<{ id: string; name: string; clinic_name: string | null }[]>(),
    supabase
      .from("vet_doctors")
      .select("id, name, active")
      .eq("vet_id", id)
      .returns<Omit<DoctorRow, "visit_count" | "last_visit">[]>(),
    supabase
      .from("vet_appointments")
      .select("doctor_id, appointment_date")
      .eq("vet_id", id)
      .not("doctor_id", "is", null)
      .returns<{ doctor_id: string; appointment_date: string }[]>(),
  ]);

  if (vetResult.error) throw new Error(vetResult.error.message);
  const vet = vetResult.data?.[0];
  if (!vet) notFound();

  const stats = new Map<string, { count: number; last: string }>();
  for (const visit of visitsResult.data ?? []) {
    const s = stats.get(visit.doctor_id);
    stats.set(visit.doctor_id, {
      count: (s?.count ?? 0) + 1,
      last: s && s.last > visit.appointment_date ? s.last : visit.appointment_date,
    });
  }
  const doctors: DoctorRow[] = (doctorsResult.data ?? [])
    .map((doctor) => ({
      ...doctor,
      visit_count: stats.get(doctor.id)?.count ?? 0,
      last_visit: stats.get(doctor.id)?.last ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link href="/management/vets" className="text-sm text-muted hover:text-foreground">
        {d.back}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{d.title(vet.name)}</h1>
        {vet.clinic_name && <p className="text-sm text-muted">{vet.clinic_name}</p>}
        <p className="mt-1 max-w-3xl text-sm text-muted">
          {d.subtitle}{" "}
          <Link href={`/vets/${vet.id}`} className="text-primary hover:underline">
            {d.viewHub}
          </Link>
        </p>
      </div>

      <LargerScreenNotice>
        {doctorsResult.error && (
          <p className="text-sm text-danger">
            {d.couldntLoad}: {doctorsResult.error.message}
          </p>
        )}
        {visitsResult.error && (
          <p className="text-sm text-danger">
            {d.couldntLoadVisits}: {visitsResult.error.message}
          </p>
        )}

        <AddDoctorForm vetId={vet.id} />
        <DoctorsTable vetId={vet.id} doctors={doctors} />
      </LargerScreenNotice>
    </main>
  );
}
