import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadPrescriptionOptions } from "@/lib/prescriptions/options";
import { PrescriptionForm, type PrescriptionInitial } from "../../PrescriptionForm";

/**
 * Reached from a row's Edit link on the resident's Prescriptions tab. Same
 * form as /prescriptions/new, prefilled; a deceased resident's record is
 * closed, so the page says so instead of offering a form the database
 * (0026) would reject.
 */
export default async function EditPrescriptionPage(
  props: PageProps<"/prescriptions/[id]/edit">,
) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("prescriptions")
    .select(
      "id, resident_id, medication_id, frequency_id, vet_appointment_id, dose_quantity, start_date, end_date, notes",
    )
    .eq("id", id)
    .limit(1)
    .returns<(PrescriptionInitial & { resident_id: string })[]>();
  if (error) throw new Error(error.message);
  const prescription = rows?.[0];
  if (!prescription) notFound();

  const residentId = prescription.resident_id;
  const [residentResult, stateResult, options] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name")
      .eq("id", residentId)
      .limit(1)
      .returns<{ id: string; name: string; thai_name: string | null }[]>(),
    supabase
      .from("resident_current_state")
      .select("is_deceased")
      .eq("resident_id", residentId)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>(),
    loadPrescriptionOptions(supabase, residentId),
  ]);
  const { medications, frequencies, vetAppointments } = options;

  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;
  const tabHref = `/residents/${residentId}/prescriptions`;

  if (stateResult.data?.[0]?.is_deceased) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.prescriptions.editPageTitle}
        </h1>
        <p className="text-sm text-muted">{t.residents.deceased.recordClosed}</p>
        <Link href={tabHref} className="text-sm font-medium text-primary hover:underline">
          {t.residents.sections.backTo(displayName)}
        </Link>
      </main>
    );
  }

  const loadErrors = [
    [t.prescriptions.couldntLoadMedications, medications.error],
    [t.prescriptions.couldntLoadFrequencies, frequencies.error],
    [t.prescriptions.couldntLoadVetAppointments, vetAppointments.error],
  ] as const;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link href={tabHref} className="text-sm text-muted hover:text-foreground">
        {t.residents.sections.backTo(displayName)}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.prescriptions.editPageTitle}
        </h1>
        <p className="text-sm text-muted">{t.prescriptions.editPageSubtitle}</p>
      </div>

      {loadErrors.map(
        ([label, error]) =>
          error && (
            <p key={label} className="text-sm text-danger">
              {label}: {error.message}
            </p>
          ),
      )}

      <PrescriptionForm
        mode="edit"
        residentId={residentId}
        residentDisplayName={displayName}
        medications={medications.data ?? []}
        frequencies={frequencies.data ?? []}
        vetAppointments={vetAppointments.data ?? []}
        initial={prescription}
        cancelHref={tabHref}
      />
    </main>
  );
}
