import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { placeName } from "@/lib/enclosures/names";
import { formatDate, todayIso } from "@/lib/format";
import { HOSPITAL_ROLES } from "@/lib/placements/hospital";
import { PLACEMENT_ICONS } from "@/components/hub-icons";
import { SendToHospitalForm } from "./SendToHospitalForm";

type VetAppointment = {
  id: string;
  appointment_date: string;
  reason: string | null;
  vets: { name: string } | null;
};

export default async function SendToHospitalPage(
  props: PageProps<"/residents/[id]/hospital">,
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const { t, locale } = await getT();
  const supabase = await createClient();

  // Reached from a vet visit record: the visit pre-fills the date and notes
  // so the placement says why the resident went in.
  const vetAppointmentId =
    typeof searchParams.vetAppointmentId === "string"
      ? searchParams.vetAppointmentId
      : null;

  const [residentResult, statusResult, placementResult, roleResult, visitResult] =
    await Promise.all([
      supabase
        .from("residents")
        .select("id, name, thai_name, resident_code")
        .eq("id", id)
        .limit(1)
        .returns<
          { id: string; name: string; thai_name: string | null; resident_code: string }[]
        >(),
      supabase
        .from("resident_list_view")
        .select("current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_name, zone_name_th")
        .eq("resident_id", id)
        .limit(1)
        .returns<
          {
            current_status: string | null;
            enclosure_id: string | null;
            enclosure_name: string | null;

            enclosure_name_th: string | null;
            zone_name: string | null;
            zone_name_th: string | null;
          }[]
        >(),
      supabase
        .from("placement_history")
        .select("start_date")
        .eq("resident_id", id)
        .is("end_date", null)
        .limit(1)
        .returns<{ start_date: string }[]>(),
      supabase.rpc("current_user_role"),
      vetAppointmentId
        ? supabase
            .from("vet_appointments")
            .select("id, appointment_date, reason, vets(name)")
            .eq("id", vetAppointmentId)
            .eq("resident_id", id)
            .limit(1)
            .returns<VetAppointment[]>()
        : Promise.resolve({ data: null }),
    ]);

  // A query error (e.g. a migration not yet applied) must not look like a
  // missing resident — surface it instead of a 404.
  if (residentResult.error) throw new Error(residentResult.error.message);
  const resident = residentResult.data?.[0];
  if (!resident) notFound();

  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;
  const status = statusResult.data?.[0];
  const currentStatus = status?.current_status ?? null;
  const canSend = HOSPITAL_ROLES.has(roleResult.data ?? "");
  const Icon = PLACEMENT_ICONS.hospital;

  const visit = visitResult.data?.[0] ?? null;
  const today = todayIso();
  const visitDate = visit?.appointment_date.slice(0, 10) ?? null;
  const defaultDate = visitDate && visitDate <= today ? visitDate : today;
  const defaultNotes = visit
    ? t.residents.hospital.visitNote(
        formatDate(visit.appointment_date, locale),
        visit.reason,
        visit.vets?.name ?? null,
      )
    : "";

  const blocked =
    !canSend
      ? t.residents.hospital.notAuthorized
      : currentStatus === "Deceased"
        ? t.residents.hospital.errors.deceased
        : currentStatus === "Hospitalised"
          ? t.residents.hospital.errors.alreadyInHospital
          : currentStatus === "Adopted"
            ? t.residents.hospital.errors.adopted
            : null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={`/residents/${id}`}
        className="text-sm text-muted hover:text-foreground"
      >
        {t.residents.sections.backTo(displayName)}
      </Link>
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
          <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-muted" />
          {t.residents.hospital.pageTitle(displayName)}{" "}
          <span className="text-lg font-normal text-muted">
            ({resident.resident_code})
          </span>
        </h1>
        <p className="text-sm text-muted">{t.residents.hospital.pageSubtitle}</p>
      </div>

      {blocked ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          {blocked}
        </p>
      ) : (
        <SendToHospitalForm
          residentId={id}
          current={{
            enclosureId: status?.enclosure_id ?? null,
            enclosureName: placeName(locale, status?.enclosure_name, status?.enclosure_name_th) || null,
            zoneName: placeName(locale, status?.zone_name, status?.zone_name_th) || null,
            since: placementResult.data?.[0]?.start_date ?? null,
          }}
          defaultDate={defaultDate}
          defaultNotes={defaultNotes}
          today={today}
        />
      )}
    </main>
  );
}
