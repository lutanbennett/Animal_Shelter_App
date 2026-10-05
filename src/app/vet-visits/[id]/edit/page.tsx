import { requirePermission } from "@/lib/permissions/require";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadDoctorNamesByVet } from "@/lib/vets/doctors";
import { loadVetScope } from "@/lib/vets/scope";
import type { VetOption } from "@/app/vet-visits/new/VetVisitForm";
import { MicrochipLine } from "@/components/MicrochipForm";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { VetVisitEditForm, type VetVisitInitial } from "./VetVisitEditForm";

/** Reached from a row's Edit link on the resident's Vet Appointments tab. */
export default async function EditVetVisitPage(props: PageProps<"/vet-visits/[id]/edit">) {
  await requirePermission("medical.visits", "read");
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("vet_appointments")
    .select("id, resident_id, vet_id, appointment_date, status, reason, doctor_name, notes, cost")
    .eq("id", id)
    .limit(1)
    .returns<VetVisitInitial[]>();
  if (error) throw new Error(error.message);
  const visit = rows?.[0];
  if (!visit) notFound();

  const scope = await loadVetScope(supabase);
  if (scope.kind === "unlinked") {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.vetVisits.editPageTitle}</h1>
        <p className="max-w-2xl text-sm text-muted">{t.vetVisits.noClinicForAccount}</p>
      </main>
    );
  }

  // Another clinic's visit is read-only to a vet (0110): the database would
  // refuse the save, so say so rather than show a form that can only fail.
  if (scope.kind === "clinics" && (!visit.vet_id || !scope.vetIds.includes(visit.vet_id))) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.vetVisits.editPageTitle}</h1>
        <p className="max-w-2xl text-sm text-muted">{t.vetVisits.otherClinicReadOnly}</p>
      </main>
    );
  }

  let vetsQuery = supabase.from("vets").select("id, name, clinic_name").order("name");
  if (scope.kind === "clinics") vetsQuery = vetsQuery.in("id", scope.vetIds);

  const [residentResult, stateResult, vetsResult, doctorNamesByVet, perms] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, thai_name, microchip_number, microchip_implanted_on")
      .eq("id", visit.resident_id)
      .limit(1)
      .returns<
        {
          id: string;
          name: string;
          thai_name: string | null;
          microchip_number: string | null;
          microchip_implanted_on: string | null;
        }[]
      >(),
    supabase
      .from("resident_current_state")
      .select("is_deceased")
      .eq("resident_id", visit.resident_id)
      .limit(1)
      .returns<{ is_deceased: boolean }[]>(),
    vetsQuery.returns<VetOption[]>(),
    loadDoctorNamesByVet(supabase),
    loadPermissions(),
  ]);
  const resident = residentResult.data?.[0];
  if (!resident) notFound();
  const vets = vetsResult.data ?? [];

  const displayName = resident.thai_name ? `${resident.name} (${resident.thai_name})` : resident.name;
  const tabHref = `/residents/${visit.resident_id}/vet-appointments`;

  if (stateResult.data?.[0]?.is_deceased) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.vetVisits.editPageTitle}</h1>
        <p className="text-sm text-muted">{t.residents.deceased.recordClosed}</p>
        <div>
          <ActionLink href={tabHref} label={t.residents.sections.backTo(displayName)} icon={ACTION_ICONS.back} iconOnlyOnMobile={false} />
        </div>
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

      {/* The chip beside the visit it was checked or implanted at (0116). */}
      <MicrochipLine
        residentId={visit.resident_id}
        number={resident.microchip_number}
        implantedOn={resident.microchip_implanted_on}
        canEdit={can(perms, "resident.microchip")}
      />

      {vetsResult.error && (
        <p className="text-sm text-danger">
          {t.vetVisits.couldntLoadVets}: {vetsResult.error.message}
        </p>
      )}

      <VetVisitEditForm
        visit={{ ...visit, cost: visit.cost == null ? null : Number(visit.cost) }}
        vets={vets}
        fixedVet={scope.kind === "clinics" && vets.length === 1 ? vets[0] : null}
        lockedDoctor={scope.kind === "clinics" ? (visit.doctor_name ?? scope.doctorName) : null}
        doctorNamesByVet={doctorNamesByVet}
        residentDisplayName={displayName}
        cancelHref={tabHref}
      />
    </main>
  );
}
