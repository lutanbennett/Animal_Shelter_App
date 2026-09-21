import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { VetOption } from "@/app/vet-visits/new/VetVisitForm";
import { VetVisitEditForm, type VetVisitInitial } from "./VetVisitEditForm";

/** Reached from a row's Edit link on the resident's Vet Appointments tab. */
export default async function EditVetVisitPage(props: PageProps<"/vet-visits/[id]/edit">) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("vet_appointments")
    .select("id, resident_id, vet_id, appointment_date, status, reason, notes, cost")
    .eq("id", id)
    .limit(1)
    .returns<VetVisitInitial[]>();
  if (error) throw new Error(error.message);
  const visit = rows?.[0];
  if (!visit) notFound();

  const [residentResult, stateResult, vetsResult] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name")
      .eq("id", visit.resident_id)
      .limit(1)
      .returns<{ id: string; name: string; thai_name: string | null }[]>(),
    supabase
      .from("resident_current_state")
      .select("is_deceased")
      .eq("resident_id", visit.resident_id)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>(),
    supabase.from("vets").select("id, name, clinic_name").order("name").returns<VetOption[]>(),
  ]);
  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  const displayName = resident.thai_name ? `${resident.name} (${resident.thai_name})` : resident.name;
  const tabHref = `/residents/${visit.resident_id}/vet-appointments`;

  if (stateResult.data?.[0]?.is_deceased) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.vetVisits.editPageTitle}</h1>
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
        <h1 className="text-2xl font-semibold text-foreground">{t.vetVisits.editPageTitle}</h1>
        <p className="text-sm text-muted">{t.vetVisits.editPageSubtitle}</p>
      </div>

      {vetsResult.error && (
        <p className="text-sm text-danger">
          {t.vetVisits.couldntLoadVets}: {vetsResult.error.message}
        </p>
      )}

      <VetVisitEditForm
        visit={{ ...visit, cost: visit.cost == null ? null : Number(visit.cost) }}
        vets={vetsResult.data ?? []}
        residentDisplayName={displayName}
        cancelHref={tabHref}
      />
    </main>
  );
}
