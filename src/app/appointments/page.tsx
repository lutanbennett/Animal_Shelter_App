import Link from "next/link";
import { refuseFor } from "@/lib/auth/require-role";
import { requirePermission } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import { formatDateTime, todayIso } from "@/lib/format";
import { loadClinicScope } from "@/lib/clinics/scope";
import { visitDate } from "@/lib/clinics/linkable";
import { loadClinicAppointments, type ClinicAppointment } from "@/lib/clinics/appointments";

/**
 * /appointments — a vet's home: the visits booked with their clinic, split
 * into ones still to write up, upcoming, and recently done. Each row opens
 * the resident and offers the records a vet adds, every link carrying
 * `vetAppointmentId` so the record is linked to the visit.
 *
 * Nothing here depends on the visit's status: the forms it links to list a
 * resident's visits whatever their status, so marking a visit completed
 * while a vet has a form open does not lose what they are typing.
 *
 * Clinic-scoped logins only (a vet: `medical.visits` read with the "own
 * clinic" scope, Appendix A) — the shelter's own people book and read visits from the
 * resident hub. Tasks stay shelter operations (Lutan, 2026-09-29).
 */
export default async function AppointmentsPage() {
  const { supabase, perms } = await requirePermission("medical.visits", "read");
  // The scope is what makes this a vet's page: shelter staff hold the activity too and book from the hub.
  if (perms.scopes.clinical !== "own_clinic") refuseFor(perms);
  const { t, locale } = await getT();
  const a = t.vetAppointments;
  const scope = await loadClinicScope(supabase);

  const shell = (body: React.ReactNode) => (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{a.pageTitle}</h1>
        <p className="text-sm text-muted">{a.pageSubtitle}</p>
      </div>
      {body}
    </main>
  );

  if (scope.kind !== "clinics") return shell(<p className="text-sm text-muted">{a.unlinked}</p>);

  const { toWriteUp, upcoming, recentlyDone, error } = await loadClinicAppointments(
    supabase,
    scope.clinicIds,
  );
  const today = todayIso();

  // `overdue`: the to-write-up list, whose rows are past their date. Its count
  // and dates are in the danger colour, as on the clinic's own page.
  const section = (
    title: string,
    rows: ClinicAppointment[],
    empty: string,
    hint?: string,
    overdue = false,
  ) => (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-foreground">
        {title}{" "}
        <span
          className={`text-sm ${
            overdue && rows.length > 0 ? "font-medium text-danger" : "font-normal text-muted"
          }`}
        >
          ({rows.length})
        </span>
      </h2>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-border rounded border border-border bg-surface">
          {rows.map((row) => {
            const name = row.residents
              ? row.residents.thai_name
                ? `${row.residents.name} (${row.residents.thai_name})`
                : row.residents.name
              : a.unknownResident;
            const link = (path: string) =>
              `${path}?residentId=${row.resident_id}&vetAppointmentId=${row.id}`;
            const started = visitDate(row) <= today;
            const actionClass = "text-xs font-medium text-primary hover:underline";
            return (
              <li key={row.id} className="flex flex-col gap-2 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <Link
                    href={`/residents/${row.resident_id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {name}
                  </Link>
                  <span className={`text-xs ${overdue ? "font-medium text-danger" : "text-muted"}`}>
                    {formatDateTime(row.appointment_date, locale)}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {[row.reason ?? t.residents.sections.vetVisitFallback, row.doctor_name]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <Link href={link("/procedures/new")} className={actionClass}>
                    {t.residents.sections.logProcedure}
                  </Link>
                  <Link href={link("/blood-tests/new")} className={actionClass}>
                    {t.residents.sections.logBloodTest}
                  </Link>
                  {started && (
                    <Link href={link("/prescriptions/new")} className={actionClass}>
                      {t.residents.sections.addPrescription}
                    </Link>
                  )}
                  {started && (
                    <Link href={link("/weight/new")} className={actionClass}>
                      {t.residents.sections.logWeight}
                    </Link>
                  )}
                  <Link href={`/clinic-visits/${row.id}/edit`} className={actionClass}>
                    {t.common.edit}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return shell(
    <>
      {error && (
        <p className="text-sm text-danger">
          {a.couldntLoad}: {error}
        </p>
      )}
      {section(a.toWriteUp, toWriteUp, a.emptyToWriteUp, a.toWriteUpHint, true)}
      {section(a.upcoming, upcoming, a.emptyUpcoming)}
      {section(a.recentlyDone, recentlyDone, a.emptyRecentlyDone, a.recentlyDoneHint)}
    </>,
  );
}
