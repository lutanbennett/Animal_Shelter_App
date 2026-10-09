import { requirePermission } from "@/lib/permissions/require";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
import {
  BloodTestForm,
  type BloodTestTypeOption,
  type ClinicVisitOption,
} from "./BloodTestForm";

export default async function NewBloodTestPage(
  props: PageProps<"/blood-tests/new">,
) {
  await requirePermission("medical.blood_tests");
  const searchParams = await props.searchParams;
  const { t, locale } = await getT();

  const residentId = searchParams.residentId;
  const clinicVisitId = searchParams.clinicVisitId;

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

  const [residentResult, clinicVisitsResult, stateResult, typesResult] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name")
      .eq("id", residentId)
      .limit(1)
      .returns<{ id: string; name: string; thai_name: string | null }[]>(),
    supabase
      .from("clinic_visits")
      .select("id, appointment_date, reason")
      .is("archived_at", null)
      .eq("resident_id", residentId)
      .order("appointment_date", { ascending: false })
      .returns<ClinicVisitOption[]>(),
    supabase
      .from("resident_current_state")
      .select("is_deceased")
      .eq("resident_id", residentId)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>(),
    supabase
      .from("blood_test_types")
      .select("id, name, name_th")
      .order("name")
      .returns<(BloodTestTypeOption & { name_th: string | null })[]>(),
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

  // Unlike the immunization and clinic-visit forms, this page is reached with a
  // resident id rather than a picker, so the "no records for the dead" rule
  // (migration 0026, which would reject the insert anyway) is checked here.
  if (stateResult.data?.[0]?.is_deceased) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.bloodTests.pageTitle}
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

  const clinicVisits = clinicVisitsResult.data ?? [];

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

      {clinicVisitsResult.error && (
        <p className="text-sm text-danger">
          {t.bloodTests.couldntLoadVetAppointments}: {clinicVisitsResult.error.message}
        </p>
      )}
      {typesResult.error && (
        <p className="text-sm text-danger">
          {t.bloodTests.couldntLoadTypes}: {typesResult.error.message}
        </p>
      )}

      <BloodTestForm
        residentId={residentId}
        residentDisplayName={displayName}
        bloodTestTypes={(typesResult.data ?? []).map(({ name_th, ...type }) => ({
          ...type,
          name: localLabel(locale, type.name, name_th),
        }))}
        clinicVisits={clinicVisits}
        preselectedClinicVisitId={
          typeof clinicVisitId === "string" && clinicVisitId
            ? clinicVisitId
            : null
        }
      />
    </main>
  );
}
