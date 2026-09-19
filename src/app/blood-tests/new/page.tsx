import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { BloodTestForm, type VetAppointmentOption } from "./BloodTestForm";

export default async function NewBloodTestPage(
  props: PageProps<"/blood-tests/new">,
) {
  const searchParams = await props.searchParams;
  const { t } = await getT();

  const residentId = searchParams.residentId;
  const vetAppointmentId = searchParams.vetAppointmentId;

  if (typeof residentId !== "string" || !residentId) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.bloodTests.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.bloodTests.noResidentSelected}</p>
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

  const [residentResult, vetAppointmentsResult] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name")
      .eq("id", residentId)
      .limit(1)
      .returns<{ id: string; name: string; thai_name: string | null }[]>(),
    supabase
      .from("vet_appointments")
      .select("id, appointment_date, reason")
      .eq("resident_id", residentId)
      .order("appointment_date", { ascending: false })
      .returns<VetAppointmentOption[]>(),
  ]);

  const resident = residentResult.data?.[0];
  if (!resident) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.bloodTests.pageTitle}
        </h1>
        <p className="text-sm text-danger">{t.bloodTests.residentNotFound}</p>
      </main>
    );
  }

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;

  const vetAppointments = vetAppointmentsResult.data ?? [];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={`/residents/${residentId}/blood-tests`}
        className="text-sm text-muted hover:text-foreground"
      >
        {t.residents.sections.backTo(displayName)}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.bloodTests.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.bloodTests.pageSubtitle}</p>
      </div>

      {vetAppointmentsResult.error && (
        <p className="text-sm text-danger">
          {t.bloodTests.couldntLoadVetAppointments}: {vetAppointmentsResult.error.message}
        </p>
      )}

      <BloodTestForm
        residentId={residentId}
        residentDisplayName={displayName}
        vetAppointments={vetAppointments}
        preselectedVetAppointmentId={
          typeof vetAppointmentId === "string" && vetAppointmentId
            ? vetAppointmentId
            : null
        }
      />
    </main>
  );
}
