import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  ProcedureForm,
  type ProcedureTypeOption,
  type VetAppointmentOption,
} from "./ProcedureForm";

/**
 * /procedures/new?residentId=…[&vetAppointmentId=…] — reached from the hub's
 * Procedures card and tab, or from a vet appointment row (which preselects
 * the visit and defaults the date to it) — same shape as /weight/new.
 */
export default async function NewProcedurePage(props: PageProps<"/procedures/new">) {
  const searchParams = await props.searchParams;
  const { t } = await getT();

  const residentId = searchParams.residentId;
  const vetAppointmentId = searchParams.vetAppointmentId;

  if (typeof residentId !== "string" || !residentId) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.procedures.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.procedures.noResidentSelected}</p>
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

  const [residentResult, typesResult, vetAppointmentsResult, stateResult] =
    await Promise.all([
      supabase
        .from("residents")
        .select("id, name, thai_name")
        .eq("id", residentId)
        .limit(1)
        .returns<{ id: string; name: string; thai_name: string | null }[]>(),
      supabase
        .from("procedure_types")
        .select("id, name")
        .order("name", { ascending: true })
        .returns<ProcedureTypeOption[]>(),
      supabase
        .from("vet_appointments")
        .select("id, appointment_date, reason")
        .eq("resident_id", residentId)
        .order("appointment_date", { ascending: false })
        .returns<VetAppointmentOption[]>(),
      supabase
        .from("resident_current_state")
        .select("is_deceased")
        .eq("resident_id", residentId)
        .limit(1)
        .returns<{ is_deceased: boolean }[]>(),
    ]);

  const resident = residentResult.data?.[0];
  if (!resident) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.procedures.pageTitle}
        </h1>
        <p className="text-sm text-danger">{t.procedures.residentNotFound}</p>
      </main>
    );
  }

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;

  // Reached with a resident id rather than a picker, so the "no records for
  // the dead" rule (migration 0026, which would reject the insert anyway)
  // is checked here, as the weight and blood-test forms do.
  if (stateResult.data?.[0]?.is_deceased) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.procedures.pageTitle}
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

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={`/residents/${residentId}/procedures`}
        className="text-sm text-muted hover:text-foreground"
      >
        {t.residents.sections.backTo(displayName)}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.procedures.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.procedures.pageSubtitle}</p>
      </div>

      {typesResult.error && (
        <p className="text-sm text-danger">
          {t.procedures.couldntLoadTypes}: {typesResult.error.message}
        </p>
      )}
      {vetAppointmentsResult.error && (
        <p className="text-sm text-danger">
          {t.procedures.couldntLoadVetAppointments}: {vetAppointmentsResult.error.message}
        </p>
      )}

      <ProcedureForm
        residentId={residentId}
        residentDisplayName={displayName}
        procedureTypes={typesResult.data ?? []}
        vetAppointments={vetAppointmentsResult.data ?? []}
        preselectedVetAppointmentId={
          typeof vetAppointmentId === "string" && vetAppointmentId
            ? vetAppointmentId
            : null
        }
      />
    </main>
  );
}
