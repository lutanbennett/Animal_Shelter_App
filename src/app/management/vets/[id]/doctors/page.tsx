import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
import { BackLink } from "@/components/BackLink";
import { AddDoctorForm } from "./AddDoctorForm";
import { DoctorsTable, type DoctorRow, type ElsewhereDoctor } from "./DoctorsTable";
import { requirePermission } from "@/lib/permissions/require";

type PersonRow = {
  id: string;
  name: string;
  user_id: string | null;
  vet_doctor_clinics: { vet_id: string; active: boolean; vets: { name: string } | null }[];
};

/**
 * One clinic's doctors (vet_doctors, 0102; the clinics a doctor works at are
 * vet_doctor_clinics, 0125). The list fills itself from the names typed on
 * visits; this page is where it is seen and corrected — renamed, merged,
 * marked as left, or a doctor from another clinic added as working here too.
 * Management and admin only: every booking role may write the table under
 * RLS (a visit can add a name), but a rename or merge rewrites past visits,
 * so it is a manager's correction.
 */
export default async function VetDoctorsPage(
  props: PageProps<"/management/vets/[id]/doctors">,
) {
  const { perms } = await requirePermission("clinics.doctors");
  const { id } = await props.params;
  const { t, locale } = await getT();
  const d = t.management.vetDoctors;

  const supabase = await createClient();
  const [vetResult, doctorsResult, visitsResult] = await Promise.all([
    supabase
      .from("vets")
      .select("id, name, name_th, clinic_name")
      .eq("id", id)
      .limit(1)
      .returns<{ id: string; name: string; name_th: string | null; clinic_name: string | null }[]>(),
    // Every doctor with every clinic they work at: this clinic's roster is
    // the ones linked here, the rest are who "same person as…" and "also
    // works here" can pick from.
    supabase
      .from("vet_doctors")
      .select("id, name, user_id, vet_doctor_clinics(vet_id, active, vets(name))")
      .returns<PersonRow[]>(),
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
  const doctors: DoctorRow[] = [];
  const elsewhere: ElsewhereDoctor[] = [];
  for (const person of doctorsResult.data ?? []) {
    const here = person.vet_doctor_clinics.find((link) => link.vet_id === id);
    const otherClinics = person.vet_doctor_clinics
      .filter((link) => link.vet_id !== id)
      .map((link) => link.vets?.name ?? "")
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    if (here) {
      doctors.push({
        id: person.id,
        name: person.name,
        active: here.active,
        hasLogin: person.user_id !== null,
        otherClinics,
        visit_count: stats.get(person.id)?.count ?? 0,
        last_visit: stats.get(person.id)?.last ?? null,
      });
    } else {
      elsewhere.push({ id: person.id, name: person.name, hasLogin: person.user_id !== null, clinics: otherClinics });
    }
  }
  doctors.sort((a, b) => a.name.localeCompare(b.name));
  elsewhere.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <BackLink href="/management/vets">{d.back}</BackLink>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{d.title(localLabel(locale, vet.name, vet.name_th))}</h1>
        {vet.clinic_name && <p className="text-sm text-muted">{vet.clinic_name}</p>}
        <p className="mt-1 max-w-3xl text-sm text-muted">
          {d.subtitle}{" "}
          <Link href={`/vets/${vet.id}`} className="text-primary hover:underline">
            {d.viewHub}
          </Link>
        </p>
      </div>

      {/* No larger-screen notice: opened by Management or the 2IC on a phone (decision 2026-10-07). */}


      <>
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

        <AddDoctorForm vetId={vet.id} elsewhere={elsewhere} />
        <DoctorsTable
          vetId={vet.id}
          doctors={doctors}
          elsewhere={elsewhere}
          isAdmin={perms.isAdmin}
        />
      </>
    </main>
  );
}
