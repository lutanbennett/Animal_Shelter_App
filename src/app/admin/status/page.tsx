import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { formatDate, formatDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n/get-t";
import { getHealthReport } from "@/lib/status/health";
import type { CheckResult, CheckState } from "@/lib/status/run";
import { USAGE_PERIODS, getUsageReport, parsePeriod, type UsagePeriod } from "@/lib/status/usage";
import { checkNow } from "./actions";

type T = Awaited<ReturnType<typeof getT>>["t"];
type Locale = Awaited<ReturnType<typeof getT>>["locale"];

/**
 * Settings → System status: is everything working, and how much is the app
 * used. Read-only. The checks live in src/lib/status/ as small functions
 * (so a later "alert me" can reuse them); this page only lays them out.
 *
 * Admin only, checked here and not just by the Settings tile that links to
 * it — the page names where secrets live and what's misconfigured.
 */
export default async function SystemStatusPage(props: PageProps<"/admin/status">) {
  await requireAdminUser();
  const { t, locale } = await getT();
  const s = t.admin.status;
  const days = parsePeriod((await props.searchParams).days);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
          <p className="text-sm text-muted">{s.subtitle}</p>
        </div>
        <form action={checkNow}>
          <button
            type="submit"
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            {s.checkNow}
          </button>
        </form>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">{s.healthHeading}</h2>
        <Suspense fallback={<p className="text-sm text-muted">{s.checking}</p>}>
          <Health t={t} locale={locale} />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">{s.usageHeading}</h2>
          <nav aria-label={s.periodLabel} className="flex gap-1">
            {USAGE_PERIODS.map((p) => (
              <Link
                key={p}
                href={`/admin/status?days=${p}`}
                aria-current={p === days ? "page" : undefined}
                className={
                  p === days
                    ? "rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                    : "rounded border border-border px-3 py-1 text-sm text-foreground hover:bg-surface-hover"
                }
              >
                {s.periodDays({ days: p })}
              </Link>
            ))}
          </nav>
        </div>
        <Suspense key={days} fallback={<p className="text-sm text-muted">{s.checking}</p>}>
          <Usage t={t} locale={locale} days={days} />
        </Suspense>
      </section>
    </main>
  );
}

const STATE_STYLES: Record<CheckState, { box: string; dot: string; label: string }> = {
  ok: { box: "border-success/40", dot: "bg-success", label: "text-success" },
  warn: { box: "border-warning/60 bg-warning/5", dot: "bg-warning", label: "text-warning" },
  fail: { box: "border-danger/50 bg-danger/5", dot: "bg-danger", label: "text-danger" },
  off: { box: "border-border", dot: "bg-muted", label: "text-muted" },
};

function Tile({
  title,
  result,
  t,
  locale,
  children,
}: {
  title: string;
  result: CheckResult<unknown>;
  t: T;
  locale: Locale;
  children?: ReactNode;
}) {
  const style = STATE_STYLES[result.state];
  return (
    <div className={`flex flex-col gap-2 rounded border bg-surface p-4 ${style.box}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-foreground">{title}</h3>
        <span className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${style.label}`}>
          <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
          {t.admin.status.states[result.state]}
        </span>
      </div>
      <div className="flex flex-col gap-1 text-sm text-foreground">{children}</div>
      {result.error && result.state !== "ok" && (
        <p className="break-words rounded bg-background px-2 py-1 font-mono text-xs text-muted">{result.error}</p>
      )}
      <p className="mt-auto text-xs text-muted">
        {t.admin.status.checkedAt({ time: formatDateTime(result.checkedAt, locale) })} · {result.durationMs} ms
      </p>
    </div>
  );
}

function ageText(t: T, ageDays: number) {
  const b = t.admin.status.tiles.backup;
  return ageDays < 1 ? b.ageToday : b.ageDays({ days: Math.floor(ageDays) });
}

async function Health({ t, locale }: { t: T; locale: Locale }) {
  const r = await getHealthReport();
  const x = t.admin.status.tiles;

  const db = r.database.facts;
  const drive = r.drive.facts;
  const mig = r.migrations.facts;
  const rel = r.release.facts;
  const mail = r.releaseMail.facts;
  const backup = r.backup.facts;
  const origin = r.origin.facts;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Tile title={x.database.title} result={r.database} t={t} locale={locale}>
        <p>
          {r.database.state === "fail" || !db
            ? x.database.fail
            : r.database.state === "warn"
              ? x.database.slow({ ms: db.latencyMs })
              : x.database.ok({ ms: db.latencyMs })}
        </p>
      </Tile>

      <Tile title={x.drive.title} result={r.drive} t={t} locale={locale}>
        <p>{r.drive.state === "ok" ? x.drive.ok : drive?.notConnected ? x.drive.notConnected : x.drive.failed}</p>
      </Tile>

      <Tile title={x.migrations.title} result={r.migrations} t={t} locale={locale}>
        {!mig ? (
          <p>{x.migrations.fail}</p>
        ) : (
          <>
            {mig.unapplied.length > 0 && (
              <p>{x.migrations.behind({ count: mig.unapplied.length, names: mig.unapplied.join(", ") })}</p>
            )}
            {mig.missingFile.length > 0 && (
              <p>{x.migrations.ahead({ count: mig.missingFile.length, names: mig.missingFile.join(", ") })}</p>
            )}
            {mig.unapplied.length === 0 && mig.missingFile.length === 0 && (
              <p>{x.migrations.ok({ expected: mig.expected })}</p>
            )}
          </>
        )}
      </Tile>

      <Tile title={x.release.title} result={r.release} t={t} locale={locale}>
        {rel && (
          <>
            <p>
              {x.release.version({ version: rel.version, title: rel.title, date: formatDate(rel.releasedOn, locale) })}
            </p>
            <p className="text-muted">
              {rel.deployedAt ? x.release.deployed({ time: formatDateTime(rel.deployedAt, locale) }) : x.release.notDeployed}
            </p>
            {rel.unreleased > 0 && <p className="text-muted">{x.release.unreleased({ count: rel.unreleased })}</p>}
            {r.release.state === "warn" && <p>{x.release.mismatch}</p>}
          </>
        )}
      </Tile>

      <Tile title={x.releaseMail.title} result={r.releaseMail} t={t} locale={locale}>
        <p>
          {r.releaseMail.state === "ok" && mail
            ? x.releaseMail.ok({ label: mail.label ?? "", from: mail.from ?? "" })
            : r.releaseMail.state === "off"
              ? mail?.runtime === "worker"
                ? x.releaseMail.offHere
                : x.releaseMail.offElsewhere
              : x.releaseMail.fail}
        </p>
      </Tile>

      <Tile title={x.backup.title} result={r.backup} t={t} locale={locale}>
        <p>
          {!backup
            ? x.backup.fail
            : !backup.newest
              ? r.backup.state === "off"
                ? x.backup.none
                : x.backup.fail
              : r.backup.state === "ok"
                ? x.backup.ok({
                    time: formatDateTime(backup.newest.createdAt, locale),
                    age: ageText(t, backup.newest.ageDays),
                    count: backup.count,
                  })
                : x.backup.stale({ age: ageText(t, backup.newest.ageDays) })}
        </p>
      </Tile>

      <Tile title={x.origin.title} result={r.origin} t={t} locale={locale}>
        <p>
          {!origin?.host
            ? x.origin.off
            : r.origin.state === "ok"
              ? x.origin.ok({ host: origin.host })
              : x.origin.fallback({ host: origin.host })}
        </p>
      </Tile>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

async function Usage({ t, locale, days }: { t: T; locale: Locale; days: UsagePeriod }) {
  const r = await getUsageReport(days);
  const u = t.admin.status.usage;
  const unavailable = <p className="text-muted">{t.admin.status.unavailable}</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Tile title={u.signIns.title} result={r.signIns} t={t} locale={locale}>
        {r.signIns.facts ? (
          <>
            <p>{u.signIns.value(r.signIns.facts)}</p>
            <p className="text-xs text-muted">{u.signIns.note}</p>
          </>
        ) : (
          unavailable
        )}
      </Tile>

      <Tile title={u.records.title} result={r.records} t={t} locale={locale}>
        {r.records.facts ? (
          <>
            <Figure label={u.records.residents} value={r.records.facts.residents} />
            <Figure label={u.records.vetVisits} value={r.records.facts.vetVisits} />
            <Figure label={u.records.weights} value={r.records.facts.weights} />
            <Figure label={u.records.maintenanceJobs} value={r.records.facts.maintenanceJobs} />
          </>
        ) : (
          unavailable
        )}
      </Tile>

      <Tile title={u.uploads.title} result={r.uploads} t={t} locale={locale}>
        {r.uploads.facts ? <p>{u.uploads.value(r.uploads.facts)}</p> : unavailable}
      </Tile>

      <Tile title={u.assistant.title} result={r.assistant} t={t} locale={locale}>
        {r.assistant.facts ? <p>{u.assistant.value(r.assistant.facts)}</p> : unavailable}
      </Tile>

      <Tile title={u.visitors.title} result={r.visitors} t={t} locale={locale}>
        {r.visitors.state === "off" ? (
          <p className="text-muted">{u.visitors.off}</p>
        ) : r.visitors.facts ? (
          <>
            <p>
              {u.visitors.value({
                pageViews: r.visitors.facts.pageViews,
                visitors: r.visitors.facts.dailyVisitorsSummed,
              })}
            </p>
            <p className="text-xs text-muted">{u.visitors.note}</p>
          </>
        ) : (
          unavailable
        )}
      </Tile>
    </div>
  );
}
