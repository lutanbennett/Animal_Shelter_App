import { canTagNote } from "@/lib/note-tags/can";
import { loadTagsForNote } from "@/lib/note-tags/sync";
import { requirePermission } from "@/lib/permissions/require";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
import { loadDoctorNamesByClinic } from "@/lib/clinics/doctors";
import type { ClinicOption } from "@/app/clinic-visits/new/ClinicVisitForm";
import { MicrochipLine } from "@/components/MicrochipForm";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { BillPhotosSection } from "@/components/BillPhotosSection";
import { loadBillPhotos } from "@/lib/bills/photos";
import { ClinicVisitEditForm, type ClinicVisitInitial } from "./ClinicVisitEditForm";

/** Reached from a row's Edit link on the resident's clinic visits tab. */
export default async function EditClinicVisitPage(props: PageProps<"/clinic-visits/[id]/edit">) {
  await requirePermission("medical.visits");
  const { id } = await props.params;
  const { t, locale } = await getT();
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("clinic_visits")
    .select("id, resident_id, clinic_id, appointment_date, status, reason, doctor_name, notes, cost")
    .eq("id", id)
    .limit(1)
    .returns<ClinicVisitInitial[]>();
  if (error) throw new Error(error.message);
  const visit = rows?.[0];
  if (!visit) notFound();

  const clinicsQuery = supabase.from("clinics").select("id, name, name_th").order("name");

  const [residentResult, stateResult, clinicsResult, doctorNamesByClinic, perms] = await Promise.all([
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
    clinicsQuery.returns<(ClinicOption & { name_th: string | null })[]>(),
    loadDoctorNamesByClinic(supabase),
    loadPermissions(),
  ]);
  const resident = residentResult.data?.[0];
  if (!resident) notFound();
  const clinics: ClinicOption[] = (clinicsResult.data ?? []).map(({ name_th, ...clinic }) => ({
    ...clinic,
    name: localLabel(locale, clinic.name, name_th),
  }));

  // The invoice photo(s): record_attachment() asks medical.visits to file a bill (0190).
  const showBills = can(perms, "medical.visits", "edit");
  const billPhotos = showBills ? ((await loadBillPhotos(supabase, "clinic_visit", [visit.id])).get(visit.id) ?? []) : [];

  const displayName = resident.thai_name ? `${resident.name} (${resident.thai_name})` : resident.name;
  const tabHref = `/residents/${visit.resident_id}/clinic-visits`;

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
      <Link href={tabHref} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground md:min-h-0">
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

      {clinicsResult.error && (
        <p className="text-sm text-danger">
          {t.vetVisits.couldntLoadVets}: {clinicsResult.error.message}
        </p>
      )}

      <ClinicVisitEditForm
        canTagNotes={canTagNote(perms, ["medical.visits"])}
        noteTags={await loadTagsForNote(supabase, "clinic_visits", "notes", visit.id)}
        visit={{ ...visit, cost: visit.cost == null ? null : Number(visit.cost) }}
        clinics={clinics}
        doctorNamesByClinic={doctorNamesByClinic}
        canAddDoctor={can(perms, "clinics.doctors")}
        residentDisplayName={displayName}
        cancelHref={tabHref}
      />

      {showBills && (
        <section className="flex max-w-2xl flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">{t.bills.photo.title}</h2>
          <p className="text-xs text-muted">{t.bills.photo.hint}</p>
          <BillPhotosSection kind="clinic_visit" ownerId={visit.id} photos={billPhotos} canAdd={showBills} />
        </section>
      )}
    </main>
  );
}
