import { requirePermission } from "@/lib/permissions/require";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadPrescriptionOptions } from "@/lib/prescriptions/options";
import { PrescriptionForm } from "../PrescriptionForm";

/**
 * Reached from the resident's Prescriptions tab, the hub's prescriptions
 * card, or a row on the Vet Appointments tab (which also preselects the
 * visit and defaults the start date to it) — same shape as /blood-tests/new.
 */
export default async function NewPrescriptionPage(
  props: PageProps<"/prescriptions/new">,
) {
  await requirePermission("medical.prescriptions");
  const searchParams = await props.searchParams;
  const { t } = await getT();

  const residentId = searchParams.residentId;
  const vetAppointmentId = searchParams.vetAppointmentId;

  if (typeof residentId !== "string" || !residentId) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.prescriptions.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.prescriptions.noResidentSelected}</p>
        <Link
          href="/residents"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t.residents.hub.backToResidents}
        </Link>
      </main>
    );
  }

  const supabase = await createClient();

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
  if (!resident) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.prescriptions.pageTitle}
        </h1>
        <p className="text-sm text-danger">{t.prescriptions.residentNotFound}</p>
      </main>
    );
  }

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;

  // The database would reject the insert anyway (migration 0026); say so
  // up front rather than after the form is filled in.
  if (stateResult.data?.[0]?.is_deceased) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.prescriptions.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.residents.deceased.recordClosed}</p>
        <Link
          href={`/residents/${residentId}`}
          className="text-sm font-medium text-primary hover:underline"
        >
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
      <Link
        href={`/residents/${residentId}/prescriptions`}
        className="text-sm text-muted hover:text-foreground"
      >
        {t.residents.sections.backTo(displayName)}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.prescriptions.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.prescriptions.pageSubtitle}</p>
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
        residentId={residentId}
        residentDisplayName={displayName}
        medications={medications.data ?? []}
        frequencies={frequencies.data ?? []}
        vetAppointments={vetAppointments.data ?? []}
        preselectedVetAppointmentId={
          typeof vetAppointmentId === "string" && vetAppointmentId
            ? vetAppointmentId
            : null
        }
        cancelHref={`/residents/${residentId}/prescriptions`}
      />
    </main>
  );
}
