import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadLinkableVisits } from "@/lib/vets/linkable";
import { WeightForm, type ExistingReading, type WeightInitial } from "../../WeightForm";

/**
 * Reached from a reading's Edit link on the resident's Weight tab, from
 * "Edit weight" on a vet visit that has its reading, and from the same-day
 * notice on /weight/new. Correcting a reading edits its row: a resident has
 * one weight per day and a visit one weight (0106), so a second row is never
 * the way to fix a typo. A deceased resident's record is closed, so the
 * page says so instead of offering a form the database (0026) would reject.
 */
export default async function EditWeightPage(props: PageProps<"/weight/[id]/edit">) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("weight")
    .select("id, resident_id, date, weight_kg, vet_appointment_id, notes")
    .eq("id", id)
    .limit(1)
    .returns<(WeightInitial & { resident_id: string })[]>();
  if (error) throw new Error(error.message);
  const reading = rows?.[0];
  if (!reading) notFound();

  const residentId = reading.resident_id;
  const [residentResult, stateResult, visitsResult, readingsResult] = await Promise.all([
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
    loadLinkableVisits(supabase, residentId, {
      onePerVisit: "weight",
      notInFuture: true,
      keep: reading.vet_appointment_id,
    }),
    supabase
      .from("weight")
      .select("id, date, weight_kg")
      .eq("resident_id", residentId)
      .neq("id", reading.id)
      .returns<ExistingReading[]>(),
  ]);

  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;
  const tabHref = `/residents/${residentId}/weight`;

  if (stateResult.data?.[0]?.is_deceased) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.weight.editPageTitle}
        </h1>
        <p className="text-sm text-muted">{t.residents.deceased.recordClosed}</p>
        <Link href={tabHref} className="text-sm font-medium text-primary hover:underline">
          {t.residents.sections.backTo(displayName)}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link href={tabHref} className="text-sm text-muted hover:text-foreground">
        {t.residents.sections.backTo(displayName)}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.weight.editPageTitle}
        </h1>
        <p className="text-sm text-muted">{t.weight.editPageSubtitle}</p>
      </div>

      {visitsResult.error && (
        <p className="text-sm text-danger">
          {t.weight.couldntLoadVetAppointments}: {visitsResult.error}
        </p>
      )}

      <WeightForm
        residentId={residentId}
        residentDisplayName={displayName}
        vetAppointments={visitsResult.visits}
        readings={readingsResult.data ?? []}
        initial={{
          id: reading.id,
          date: reading.date,
          weight_kg: reading.weight_kg,
          vet_appointment_id: reading.vet_appointment_id,
          notes: reading.notes,
        }}
      />
    </main>
  );
}
