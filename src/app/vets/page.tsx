import Link from "next/link";
import { canManage } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  lastVisit,
  scheduleSummary,
  visitsInPeriod,
  type VetVisit,
} from "@/lib/vets/stats";
import { VetGrid, type VetSummary } from "./VetGrid";

type VetRow = {
  id: string;
  name: string;
  clinic_name: string | null;
  contact_info: string | null;
};

type VisitRow = VetVisit & { vet_id: string };

export default async function VetsPage() {
  const { t } = await getT();
  const supabase = await createClient();

  // Every visit is loaded once and bucketed per vet here — the same rows
  // the hub reads, so the numbers on the cards match the numbers inside.
  const [vetsResult, visitsResult, roleResult] = await Promise.all([
    supabase
      .from("vets")
      .select("id, name, clinic_name, contact_info")
      .order("name")
      .returns<VetRow[]>(),
    supabase
      .from("vet_appointments")
      .select("id, vet_id, resident_id, appointment_date, status, reason")
      .not("vet_id", "is", null)
      .returns<VisitRow[]>(),
    supabase.rpc("current_user_role"),
  ]);

  const now = new Date();
  const byVet = new Map<string, VetVisit[]>();
  for (const row of visitsResult.data ?? []) {
    const list = byVet.get(row.vet_id) ?? [];
    list.push(row);
    byVet.set(row.vet_id, list);
  }

  const vets: VetSummary[] = (vetsResult.data ?? []).map((vet) => {
    const visits = byVet.get(vet.id) ?? [];
    const happened = visitsInPeriod(visits, null, now);
    const schedule = scheduleSummary(visits, now);
    return {
      ...vet,
      visitCount: happened.length,
      animalCount: new Set(happened.map((v) => v.resident_id)).size,
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
        {canManage(roleResult.data) && (
          <Link
            href="/management/vets"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            {t.vets.manageInAdmin}
          </Link>
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

      <VetGrid vets={vets} />
    </main>
  );
}
