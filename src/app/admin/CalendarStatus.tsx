import { getShelterCalendarStatus } from "@/lib/google/shelter-calendar-status";
import { getT } from "@/lib/i18n/get-t";

/**
 * One line on Settings saying which calendar this shelter's vet visits go to and whether its connection works. Shows stored
 * status only (no call to Google). A shelter with no row is the fallback case (environment variables), not an error, so it
 * draws nothing. Admin only by the database function; the caller also gates on Admin.
 */
export async function CalendarStatus() {
  const { t } = await getT();
  const c = t.admin.landing.calendarConnection;
  const s = await getShelterCalendarStatus();
  if (!s) return null;
  const dead = s.tokenStatus === "dead" || !s.connected;
  return (
    <div className={dead ? "flex flex-col gap-1 rounded border border-danger/40 bg-danger/5 px-3 py-2" : "flex flex-col gap-1"}>
      <p className={dead ? "text-sm font-medium text-danger" : "text-sm text-success"}>
        {dead ? c.failed : c.ok}
        {s.calendarAccountEmail ? <span className="text-muted"> ({s.calendarAccountEmail})</span> : null}
      </p>
      {s.calendarId ? <p className="break-words text-xs text-muted">{c.calendarLabel}: {s.calendarId}</p> : null}
      {dead && s.lastError ? <p className="break-words text-xs text-muted">{s.lastError}</p> : null}
    </div>
  );
}
