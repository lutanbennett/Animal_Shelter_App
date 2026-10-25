import { ActionLink } from "@/components/ActionLink";
import { CLINIC_ICONS } from "@/components/hub-icons";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import { formatDate, todayIso } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { visitDate } from "@/lib/clinics/linkable";
import { loadShelterVisits, shelterTime } from "@/lib/clinics/shelter-visits";
import { calendarConfigured } from "@/lib/clinics/calendar-sync";
import { listToConfirm } from "@/lib/clinics/calendar-import";
import { ConfirmList } from "./ConfirmList";
import { VetVisitsView, type VisitRow } from "./VetVisitsView";

/**
 * /upcoming-visits — every visit at every clinic, for whoever books them (the Director, Management,
 * Admin): `medical.visits` read at the shelter-wide scope. A clinic login holds the activity at
 * the "own clinic" scope and is refused here; its page is /appointments.
 *
 * Phone first: a list grouped by day with an overdue group at the top, and a calendar from md up.
 * Every visit is loaded and handed to the view whole; hiding overdue, Completed and Cancelled
 * happens in the browser and always says how many are hidden, so no visit is lost from sight.
 */
export default async function VetVisitsPage() {
  const { supabase, perms } = await requirePermission("medical.visits", "read");
  const { t, locale } = await getT();
  const v = t.shelterVisits;
  const { visits, error } = await loadShelterVisits(supabase);
  const today = todayIso();
  // Entries typed into the shelter calendar that did not read as one clear visit (calendar-import.ts), for whoever
  // books visits and only where the calendar is switched on.
  const toConfirm = can(perms, "visit.book") && calendarConfigured() ? await listToConfirm() : null;
  const confirmIds = [...new Set((toConfirm?.items ?? []).flatMap((i) => i.decision.matches.flatMap((m) => m.candidates.map((r) => r.id))))];
  const photoRows = confirmIds.length ? ((await supabase.from("residents").select("id, profile_photo_drive_file_id").in("id", confirmIds)).data ?? []) : [];
  const photos: Record<string, string | null> = Object.fromEntries(photoRows.map((r: { id: string; profile_photo_drive_file_id: string | null }) => [r.id, r.profile_photo_drive_file_id]));

  const rows: VisitRow[] = visits.map((visit) => {
    const r = visit.residents;
    const day = visitDate(visit);
    const residentName = r ? (r.thai_name ? `${r.name} (${r.thai_name})` : r.name) : v.unknownResident;
    const clinicName = visit.clinics ? (locale === "th" && visit.clinics.name_th ? visit.clinics.name_th : visit.clinics.name) : "—";
    return {
      id: visit.id,
      residentId: visit.resident_id,
      residentName: r ? (r.thai_name ? `${r.name} (${r.thai_name})` : r.name) : v.unknownResident,
      photoUrl: r?.profile_photo_drive_file_id ? driveImageUrl(r.profile_photo_drive_file_id, 160) : null,
      clinicId: visit.clinic_id,
      clinicName: visit.clinics ? (locale === "th" && visit.clinics.name_th ? visit.clinics.name_th : visit.clinics.name) : "—",
      doctor: visit.doctor_name,
      reason: visit.reason,
      status: visit.status,
      appointmentDate: visit.appointment_date,
      day,
      time: shelterTime(visit.appointment_date),
    };
  });

  // A label per day present, computed here so Thai years are Buddhist Era like the rest of the app.
  const dayLabels: Record<string, string> = {};
  for (const row of rows) {
    dayLabels[row.day] ??= formatDate(`${row.day}T12:00:00+07:00`, locale);
  }
  const clinics = [...new Map(rows.map((r) => [r.clinicId, r.clinicName])).entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{v.pageTitle}</h1>
          <p className="text-sm text-muted">{v.pageSubtitle}</p>
        </div>
        {can(perms, "visit.book") && (
          <div>
            <ActionLink href="/clinic-visits/new?from=/upcoming-visits" label={t.vetVisits.bookAppointment} icon={CLINIC_ICONS.visits} variant="primary" iconOnlyOnMobile={false} />
          </div>
        )}
      </div>
      {toConfirm?.error && (
        <p className="text-sm text-danger">
          {v.confirm.couldntRead}: {toConfirm.error}
        </p>
      )}
      {toConfirm && (
        <ConfirmList
          t={t}
          locale={locale}
          items={toConfirm.items}
          clinics={toConfirm.refs.clinics}
          liveResidents={toConfirm.refs.residents.filter((r) => r.status !== "Deceased" && r.status !== "Adopted")}
          photos={photos}
        />
      )}
      {error && (
        <p className="text-sm text-danger">
          {v.couldntLoad}: {error}
        </p>
      )}
      <VetVisitsView
        rows={rows}
        today={today}
        dayLabels={dayLabels}
        clinics={clinics}
        locale={locale}
        labels={{
          viewList: v.viewList, viewCalendar: v.viewCalendar, viewWeek: v.viewWeek, viewMonth: v.viewMonth,
          today: v.today, tomorrow: v.tomorrow, overdue: v.overdue, overdueHint: v.overdueHint, earlier: v.earlier,
          allClinics: v.allClinics, clinicFilter: v.clinicFilter, showCompleted: v.showCompleted,
          showCancelled: v.showCancelled, hideOverdue: v.hideOverdue, showOverdue: v.showOverdue,
          empty: v.empty, emptyDay: v.emptyDay, previous: v.previous, next: v.next, openResident: v.openResident,
          edit: v.edit, view: t.vetVisits.record.view, fallbackReason: v.fallbackReason, noPhoto: v.noPhoto, weekOf: v.weekOf,
          weekdays: v.weekdays, status: v.status,
        }}
        overdueHiddenTemplate={v.overdueHidden(999999)}
      />
    </main>
  );
}
