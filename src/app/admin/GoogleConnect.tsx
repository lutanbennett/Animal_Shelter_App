import { getShelterDriveStatus } from "@/lib/google/shelter-drive-status";
import { getShelterCalendarStatus } from "@/lib/google/shelter-calendar-status";
import { connectClient } from "@/lib/google/shelter-google-connect";
import { CONNECT_START_PATH, type ConnectKind } from "@/lib/google/shelter-google-connect-decide";
import { getT } from "@/lib/i18n/get-t";

/**
 * Settings: the Admin connects the shelter's own Google Drive and Calendar here (#drvcl), two buttons because each is its own consent.
 * Each button is an ordinary link to /admin/google/start, whose server check is perms.isAdmin, so the control asks the activity its
 * action asks: Admin alone, no card (docs/decisions/2026-11-22-shelter-google-connect-screen.md). `canConnect` defaults to false so a
 * caller that forgets offers nothing. `result` is the page's ?google= value: "<kind>-<ok|reason>", or "state".
 */
export async function GoogleConnect({ canConnect = false, result }: { canConnect?: boolean; result?: string }) {
  if (!canConnect) return null;
  const { t } = await getT();
  const g = t.admin.landing.googleConnect;
  const [drive, calendar] = await Promise.all([getShelterDriveStatus(), getShelterCalendarStatus()]);
  const configured = connectClient() !== null;

  const [kind, reason] = result === "state" ? ["", "state"] : (result?.split(/-(.+)/) ?? []);
  let message: { text: string; good: boolean } | null = null;
  if (reason === "ok" && (kind === "drive" || kind === "calendar")) message = { text: g.done[kind], good: true };
  else if (reason === "staged" && kind === "drive") message = { text: g.done.driveStaged, good: true };
  else if (reason && reason in g.problems) message = { text: g.problems[reason as keyof typeof g.problems], good: false };

  const row = (k: ConnectKind, title: string, connected: boolean) => (
    <div key={k} className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-foreground">{title}</p>
      {configured ? (
        <a href={`${CONNECT_START_PATH}?kind=${k}`} className="rounded border border-border px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/10">
          {connected ? g.reconnect : g.connect}
        </a>
      ) : null}
    </div>
  );

  return (
    <section className="flex flex-col gap-2 rounded border border-border px-3 py-3">
      <h2 className="text-sm font-semibold text-foreground">{g.title}</h2>
      <p className="text-xs text-muted">{g.intro}</p>
      {message ? <p role="status" className={`text-sm ${message.good ? "text-success" : "font-medium text-danger"}`}>{message.text}</p> : null}
      {!configured ? <p className="text-sm text-muted">{g.notSetUp}</p> : null}
      {row("drive", g.driveTitle, drive?.connected === true)}
      {row("calendar", g.calendarTitle, calendar?.connected === true)}
    </section>
  );
}
