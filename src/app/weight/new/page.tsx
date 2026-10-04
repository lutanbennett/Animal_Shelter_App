import { requirePermission } from "@/lib/permissions/require";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { formatDate, formatWeightKg } from "@/lib/format";
import { loadLinkableVisits } from "@/lib/vets/linkable";
import { WeightForm, type ExistingReading } from "../WeightForm";

export default async function NewWeightPage(props: PageProps<"/weight/new">) {
  await requirePermission("medical.weight");
  const searchParams = await props.searchParams;
  const { t, locale } = await getT();

  const residentId = searchParams.residentId;
  const vetAppointmentId = searchParams.vetAppointmentId;

  if (typeof residentId !== "string" || !residentId) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.weight.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.weight.noResidentSelected}</p>
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

  // "Log weight" on a visit that already has its reading goes to that
  // reading instead: one weight per visit (0106), so the only thing to do
  // there is correct it.
  if (typeof vetAppointmentId === "string" && vetAppointmentId) {
    const { data: onVisit } = await supabase
      .from("weight")
      .select("id")
      .is("archived_at", null)
      .eq("vet_appointment_id", vetAppointmentId)
      .limit(1)
      .returns<{ id: string }[]>();
    if (onVisit?.[0]) redirect(`/weight/${onVisit[0].id}/edit`);
  }

  const [residentResult, vetAppointmentsResult, stateResult, readingsResult] =
    await Promise.all([
      supabase
        .from("residents")
        .select("id, name, thai_name")
        .eq("id", residentId)
        .limit(1)
        .returns<{ id: string; name: string; thai_name: string | null }[]>(),
      loadLinkableVisits(supabase, residentId, { onePerVisit: "weight", notInFuture: true }),
      supabase
        .from("resident_current_state")
        .select("is_deceased")
        .eq("resident_id", residentId)
        .limit(1)
        .returns<{ is_deceased: boolean }[]>(),
      supabase
        .from("weight")
        .select("id, date, weight_kg")
        .is("archived_at", null)
        .eq("resident_id", residentId)
        .order("date", { ascending: false })
        .returns<ExistingReading[]>(),
    ]);

  const resident = residentResult.data?.[0];
  if (!resident) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.weight.pageTitle}
        </h1>
        <p className="text-sm text-danger">{t.weight.residentNotFound}</p>
      </main>
    );
  }

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;

  // Reached with a resident id rather than a picker, so the "no records for
  // the dead" rule (migration 0026, which would reject the insert anyway)
  // is checked here, as the blood-test form does.
  if (stateResult.data?.[0]?.is_deceased) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.weight.pageTitle}
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

  const readings = readingsResult.data ?? [];
  const latest = readings[0];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={`/residents/${residentId}/weight`}
        className="text-sm text-muted hover:text-foreground"
      >
        {t.residents.sections.backTo(displayName)}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.weight.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.weight.pageSubtitle}</p>
      </div>

      {vetAppointmentsResult.error && (
        <p className="text-sm text-danger">
          {t.weight.couldntLoadVetAppointments}: {vetAppointmentsResult.error}
        </p>
      )}

      <WeightForm
        residentId={residentId}
        residentDisplayName={displayName}
        vetAppointments={vetAppointmentsResult.visits}
        readings={readings}
        preselectedVetAppointmentId={
          typeof vetAppointmentId === "string" && vetAppointmentId
            ? vetAppointmentId
            : null
        }
        previousReading={
          latest
            ? t.weight.previousReading(
                formatWeightKg(latest.weight_kg, locale),
                formatDate(latest.date, locale),
              )
            : null
        }
      />
    </main>
  );
}
