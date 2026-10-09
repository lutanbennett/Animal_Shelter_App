import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
import {
  lastVisit,
  scheduleSummary,
  visitsInPeriod,
  type ClinicVisit,
} from "@/lib/clinics/stats";
import { ClinicGrid, type ClinicSummary } from "./ClinicGrid";

type ClinicRow = {
  id: string;
  name: string;
  name_th: string | null;
  contact_info: string | null;
};

type VisitRow = ClinicVisit & { clinic_id: string };

export default async function ClinicsPage() {
  const { t, locale } = await getT();
  const { supabase, perms } = await requirePermission("clinics.list", "read");

  // Every visit is loaded once and bucketed per clinic here — the same rows
  // the hub reads, so the numbers on the cards match the numbers inside.
  const [clinicsResult, visitsResult] = await Promise.all([
    supabase
      .from("clinics")
      .select("id, name, name_th, contact_info")
      .order("name")
      .returns<ClinicRow[]>(),
    supabase
      .from("clinic_visits")
      .select("id, clinic_id, resident_id, appointment_date, status, reason")
      .is("archived_at", null)
      .not("clinic_id", "is", null)
      .returns<VisitRow[]>(),
  ]);

  const now = new Date();
  const byClinic = new Map<string, ClinicVisit[]>();
  for (const row of visitsResult.data ?? []) {
    const list = byClinic.get(row.clinic_id) ?? [];
    list.push(row);
    byClinic.set(row.clinic_id, list);
  }

  const clinics: ClinicSummary[] = (clinicsResult.data ?? []).map((clinic) => {
    const visits = byClinic.get(clinic.id) ?? [];
    const happened = visitsInPeriod(visits, null, now);
    const schedule = scheduleSummary(visits, now);
    return {
      ...clinic,
      name: localLabel(locale, clinic.name, clinic.name_th),
      visitCount: happened.length,
      residentCount: new Set(happened.map((v) => v.resident_id)).size,
      upcomingCount: schedule.upcoming.length,
      overdueCount: schedule.overdue.length,
      lastVisit: lastVisit(visits, now)?.appointment_date ?? null,
    };
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t.vets.pageTitle}
          </h1>
          <p className="text-sm text-muted">{t.vets.pageSubtitle}</p>
        </div>
        {can(perms, "clinics.list") && (
          <ActionLink href="/management/clinics" label={t.vets.manageInAdmin} icon={ACTION_ICONS.manage} iconOnlyOnMobile={false} />
        )}
      </div>

      {clinicsResult.error && (
        <p className="text-sm text-danger">
          {t.vets.couldntLoadVets}: {clinicsResult.error.message}
        </p>
      )}
      {visitsResult.error && (
        <p className="text-sm text-danger">
          {t.vets.couldntLoadVisits}: {visitsResult.error.message}
        </p>
      )}

      <ClinicGrid clinics={clinics} />
    </main>
  );
}
