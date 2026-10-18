import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/require";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { appointmentStatusLabel } from "@/lib/i18n/enum-labels";
import { localLabel } from "@/lib/translations/labels";
import { formatBaht, formatDateTime, formatDate, formatWeightKg, todayIso } from "@/lib/format";
import { visitDate } from "@/lib/clinics/linkable";
import { loadClinicScope } from "@/lib/clinics/scope";
import { loadBillPhotos } from "@/lib/bills/photos";
import { driveImageUrl } from "@/lib/google/drive-client";
import { BillPhotosSection } from "@/components/BillPhotosSection";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS, SECTION_ICONS } from "@/components/hub-icons";
import { ReportSection, type ReportPage } from "./ReportSection";

type Visit = {
  id: string;
  resident_id: string;
  clinic_id: string | null;
  appointment_date: string;
  status: string;
  reason: string | null;
  doctor_name: string | null;
  notes: string | null;
  cost: number | null;
  residents: { name: string; thai_name: string | null; resident_code: string; profile_photo_drive_file_id: string | null } | null;
  clinics: { name: string; name_th: string | null } | null;
};

/**
 * The read-only record of one clinic visit: what it was, the bill photos, the doctor's report, and
 * everything logged at it. Read access (`medical.visits`) is enough to open it, a dead resident's
 * visit opens too, and a doctor login sees only its own clinics' visits: the check is made here, on
 * the server, not by hiding a button. Writing stays behind `medical.visits` edit.
 */
export default async function ClinicVisitPage(props: PageProps<"/clinic-visits/[id]">) {
  await requirePermission("medical.visits");
  const { id } = await props.params;
  const { t, locale } = await getT();
  const v = t.vetVisits.record;
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("clinic_visits")
    .select(
      "id, resident_id, clinic_id, appointment_date, status, reason, doctor_name, notes, cost, residents(name, thai_name, resident_code, profile_photo_drive_file_id), clinics(name, name_th)",
    )
    .eq("id", id)
    .limit(1)
    .returns<Visit[]>();
  if (error) throw new Error(error.message);
  const visit = rows?.[0];
  if (!visit || !visit.residents) notFound();

  // A doctor login reads its own clinics' visits only. RLS lets it see its past patients elsewhere,
  // so the page narrows further, and says nothing about what the other visit holds.
  const scope = await loadClinicScope(supabase);
  if (scope.kind === "unlinked" || (scope.kind === "clinics" && (!visit.clinic_id || !scope.clinicIds.includes(visit.clinic_id)))) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{v.title}</h1>
        <p className="max-w-2xl text-sm text-muted">{scope.kind === "unlinked" ? t.vetVisits.noClinicForAccount : v.otherClinic}</p>
      </main>
    );
  }

  const perms = await loadPermissions();
  const canEdit = can(perms, "medical.visits", "edit");
  const rid = visit.resident_id;

  const [stateRes, reportRes, billMap, bloodRes, procRes, rxRes, weightRes] = await Promise.all([
    supabase.from("resident_current_state").select("is_deceased").eq("resident_id", rid).limit(1).returns<{ is_deceased: boolean }[]>(),
    supabase
      .from("attachments")
      .select("id, drive_file_id, file_name, caption")
      .eq("owner_type", "clinic_visit")
      .eq("owner_id", id)
      .eq("purpose", "report")
      .order("uploaded_at", { ascending: true })
      .returns<{ id: string; drive_file_id: string; file_name: string | null; caption: string | null }[]>(),
    scope.kind === "clinics" ? Promise.resolve(new Map()) : loadBillPhotos(supabase, "clinic_visit", [id]),
    supabase
      .from("blood_tests")
      .select("id, date, blood_test_types(name, name_th)")
      .eq("clinic_visit_id", id)
      .returns<{ id: string; date: string; blood_test_types: { name: string; name_th: string | null } | null }[]>(),
    supabase
      .from("procedures")
      .select("id, date, procedure_types(name, name_th)")
      .eq("clinic_visit_id", id)
      .returns<{ id: string; date: string; procedure_types: { name: string; name_th: string | null } | null }[]>(),
    supabase
      .from("prescriptions")
      .select("id, start_date, dose_quantity, medication:picker_medications(name, dose_unit, name_th)")
      .eq("clinic_visit_id", id)
      .is("archived_at", null)
      .returns<{ id: string; start_date: string; dose_quantity: number | null; medication: { name: string; dose_unit: string | null; name_th: string | null } | null }[]>(),
    supabase
      .from("weight")
      .select("id, date, weight_kg")
      .eq("clinic_visit_id", id)
      .is("archived_at", null)
      .returns<{ id: string; date: string; weight_kg: number }[]>(),
  ]);

  const isDeceased = stateRes.data?.[0]?.is_deceased === true;
  const r = visit.residents;
  const name = r.thai_name ? `${r.name} (${r.thai_name})` : r.name;
  const clinicName = visit.clinics ? localLabel(locale, visit.clinics.name, visit.clinics.name_th) : null;
  const tabHref = `/residents/${rid}/clinic-visits`;
  const billPhotos = billMap.get(id) ?? [];
  const reports: ReportPage[] = (reportRes.data ?? []).map((a) => ({
    id: a.id,
    driveFileId: a.drive_file_id,
    name: a.file_name ?? "",
    isPdf: /\.pdf$/i.test(a.file_name ?? ""),
    caption: a.caption,
  }));
  const blood = bloodRes.data ?? [];
  const procs = procRes.data ?? [];
  const rxs = rxRes.data ?? [];
  const weights = weightRes.data ?? [];
  const anyRecorded = blood.length + procs.length + rxs.length + weights.length > 0;
  const writable = canEdit && !isDeceased;
    const started = visitDate(visit) <= todayIso();

  const recordLink = "text-primary hover:underline";
  const field = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm text-foreground">{value ?? v.none}</dd>
    </div>
  );
  const group = (title: string, items: React.ReactNode[], href: string) =>
    items.length > 0 && (
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <ul className="flex flex-col gap-1 text-sm">
          {items.map((item, i) => (
            <li key={i}>
              <Link href={href} className={`${recordLink} inline-flex min-h-11 items-center md:min-h-0`}>
                {item}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link href={tabHref} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground md:min-h-0">
        {v.backTo(name)}
      </Link>

      <div className="flex items-center gap-3">
        <Link href={`/residents/${rid}`} className="flex items-center gap-3 hover:underline">
          {r.profile_photo_drive_file_id ? (
            <img src={driveImageUrl(r.profile_photo_drive_file_id, 160)} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <span aria-hidden="true" className="h-14 w-14 rounded-full bg-surface-hover" />
          )}
          <span className="flex flex-col">
            <span className="text-lg font-semibold text-foreground">{name}</span>
            <span className="text-xs text-muted">{r.resident_code}</span>
          </span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">{visit.reason ?? t.residents.sections.vetVisitFallback}</h1>
      </div>

      {isDeceased && <p className="text-sm text-muted">{v.deceasedNote}</p>}

      <dl className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {field(v.clinic, clinicName)}
        {field(v.doctor, visit.doctor_name)}
        {field(v.when, formatDateTime(visit.appointment_date, locale))}
        {field(v.status, <span className="capitalize">{appointmentStatusLabel(t, visit.status)}</span>)}
        {field(v.cost, visit.cost == null ? null : formatBaht(Number(visit.cost), locale))}
        <div className="sm:col-span-2">{field(v.notes, visit.notes ? <span className="whitespace-pre-wrap">{visit.notes}</span> : null)}</div>
      </dl>

      {scope.kind !== "clinics" && (
        <section className="flex max-w-2xl flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">{v.bills}</h2>
          {billPhotos.length === 0 && <p className="text-sm text-muted">{v.noBills}</p>}
          <BillPhotosSection kind="clinic_visit" ownerId={id} photos={billPhotos} canAdd={writable} />
        </section>
      )}

      <section className="flex max-w-2xl flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{v.reports.title}</h2>
        {writable && <p className="text-xs text-muted">{v.reports.hint}</p>}
        <ReportSection visitId={id} pages={reports} defaultDate={visitDate(visit)} canEdit={writable} />
      </section>

      <section className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">{v.recordedHeading}</h2>
        {!anyRecorded && <p className="text-sm text-muted">{v.nothingRecorded}</p>}
        {group(
          v.bloodTests,
          blood.map((b) => `${b.blood_test_types ? localLabel(locale, b.blood_test_types.name, b.blood_test_types.name_th) : v.bloodTests} · ${formatDate(b.date, locale)}`),
          `/residents/${rid}/blood-tests`,
        )}
        {group(
          v.procedures,
          procs.map((p) => `${p.procedure_types ? localLabel(locale, p.procedure_types.name, p.procedure_types.name_th) : v.procedures} · ${formatDate(p.date, locale)}`),
          `/residents/${rid}/procedures`,
        )}
        {group(
          v.prescriptions,
          rxs.map((p) => `${p.medication ? localLabel(locale, p.medication.name, p.medication.name_th) : v.prescriptions} · ${formatDate(p.start_date, locale)}`),
          `/residents/${rid}/prescriptions`,
        )}
        {group(
          v.weight,
          weights.map((w) => `${formatWeightKg(Number(w.weight_kg), locale)} · ${formatDate(w.date, locale)}`),
          `/residents/${rid}/weight`,
        )}
      </section>

      {writable && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">{v.actions}</h2>
          <div className="flex flex-wrap gap-2">
            <ActionLink href={`/clinic-visits/${id}/edit`} label={t.common.edit} icon={ACTION_ICONS.edit} iconOnlyOnMobile={false} />
            <ActionLink href={`/blood-tests/new?residentId=${rid}&clinicVisitId=${id}`} label={t.residents.sections.logBloodTest} icon={SECTION_ICONS["blood-tests"]} iconOnlyOnMobile={false} />
            {started && (
              <ActionLink href={`/prescriptions/new?residentId=${rid}&clinicVisitId=${id}`} label={t.residents.sections.addPrescription} icon={SECTION_ICONS.prescriptions} iconOnlyOnMobile={false} />
            )}
            {started && weights.length === 0 && (
              <ActionLink href={`/weight/new?residentId=${rid}&clinicVisitId=${id}`} label={t.residents.sections.logWeight} icon={SECTION_ICONS.weight} iconOnlyOnMobile={false} />
            )}
            <ActionLink href={`/procedures/new?residentId=${rid}&clinicVisitId=${id}`} label={t.residents.sections.logProcedure} icon={SECTION_ICONS.procedures} iconOnlyOnMobile={false} />
          </div>
        </section>
      )}
    </main>
  );
}
