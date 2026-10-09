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
import { ClinicGrid, type VetSummary } from "./ClinicGrid";

type VetRow = {
  id: string;
  name: string;
  name_th: string | null;
  clinic_name: string | null;
  contact_info: string | null;
};

type VisitRow = ClinicVisit & { clinic_id: string };

export default async function VetsPage() {
  const { t, locale } = await getT();
  const { supabase, perms } = await requirePermission("clinics.list", "read");

  // Every visit is loaded once and bucketed per vet here — the same rows
  // the hub reads, so the numbers on the cards match the numbers inside.
  const [vetsResult, visitsResult] = await Promise.all([
    supabase
      .from("clinics")
      .select("id, name, name_th, clinic_name, contact_info")
      .order("name")
      .returns<VetRow[]>(),
    supabase
      .from("clinic_visits")
      .select("id, clinic_id, resident_id, appointment_date, status, reason")
      .is("archived_at", null)
      .not("clinic_id", "is", null)
      .returns<VisitRow[]>(),
  ]);

  const now = new Date();
  const byVet = new Map<string, ClinicVisit[]>();
  for (const row of visitsResult.data ?? []) {
    const list = byVet.get(row.clinic_id) ?? [];
    list.push(row);
    byVet.set(row.clinic_id, list);
  }

  const vets: VetSummary[] = (vetsResult.data ?? []).map((vet) => {
    const visits = byVet.get(vet.id) ?? [];
    const happened = visitsInPeriod(visits, null, now);
    const schedule = scheduleSummary(visits, now);
    return {
      ...vet,
      name: localLabel(locale, vet.name, vet.name_th),
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

      {vetsResult.error && (
        <p className="text-sm text-danger">
          {t.vets.couldntLoadVets}: {vetsResult.error.message}
        </p>
      )}
      {visitsResult.error && (
        <p className="text-sm text-danger">
          {t.vets.couldntLoadVisits}: {visitsResult.error.message}
        </p>
      )}

      <ClinicGrid vets={vets} />
    </main>
  );
}
