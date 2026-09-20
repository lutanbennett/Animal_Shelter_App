"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Camera, Plus } from "lucide-react";
import { ENCLOSURE_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatBaht, formatDate } from "@/lib/format";
import type { EnclosureOption, ZoneOption } from "@/lib/enclosures/options";
import type { MaintenanceJob } from "@/lib/maintenance/queries";
import {
  DUE_SOON_DAYS,
  DUE_TONE,
  MAINTENANCE_STATUSES,
  STATUS_TONE,
  dueState,
  maintenanceStatusLabel,
  type MaintenanceStatus,
} from "@/lib/maintenance/status";
import { setMaintenanceStatus } from "./actions";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:opacity-50";

/** The Completed column only shows this many days back unless asked for all. */
const RECENT_COMPLETED_DAYS = 30;

type Filters = {
  zoneId: string | null;
  enclosureId: string | null;
  allCompleted: boolean;
};

/**
 * The maintenance board. On a desktop it's a four-column Kanban — drag a
 * card to another column to change its status (native HTML5 drag and
 * drop; no library, and nothing to fall back to on touch since phones get
 * the other layout). Below the `md` breakpoint it's a single list with
 * status chips, and a tap opens the job page where the status buttons
 * live. Both read from the same filtered list, so the two layouts can't
 * disagree.
 *
 * Colour: the column header says the status (grey / blue / yellow /
 * green); a card's left edge says urgency (red = overdue, orange = due
 * within DUE_SOON_DAYS). Completed jobs are never overdue.
 */
export function MaintenanceBoard({
  jobs,
  zones,
  enclosures,
  canWrite,
  initialFilters,
}: {
  jobs: MaintenanceJob[];
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  canWrite: boolean;
  initialFilters: Filters;
}) {
  const { t, locale } = useI18n();
  const m = t.maintenance;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [driveWarning, setDriveWarning] = useState<string | null>(null);

  // A link straight to an enclosure (the hub's "View all") carries only
  // the enclosure id; its zone is filled in so the dependent dropdown reads
  // right.
  const [filters, setFilters] = useState<Filters>(() => ({
    ...initialFilters,
    zoneId:
      initialFilters.zoneId ??
      enclosures.find((e) => e.id === initialFilters.enclosureId)?.zoneId ??
      null,
  }));
  // Phone list only: which status chip is active (null = every open job).
  const [mobileStatus, setMobileStatus] = useState<MaintenanceStatus | null>(null);

  // A dropped card lands in its column at once; the server's rows replace
  // the optimistic copy when the refresh inside the same transition lands.
  const [rows, moveOptimistically] = useOptimistic(
    jobs,
    (current, move: { jobId: string; status: MaintenanceStatus }) =>
      current.map((j) => (j.id === move.jobId ? { ...j, status: move.status } : j)),
  );

  // Keep the URL in step so the board can be linked to filtered (the
  // enclosure hub's "View all" does) without a server round-trip per click.
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.zoneId) params.set("zone", filters.zoneId);
    if (filters.enclosureId) params.set("enclosure", filters.enclosureId);
    if (filters.allCompleted) params.set("completed", "all");
    const search = params.toString();
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  }, [filters]);

  const enclosuresInZone = useMemo(
    () => enclosures.filter((e) => e.zoneId === filters.zoneId),
    [enclosures, filters.zoneId],
  );

  const recentCutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - RECENT_COMPLETED_DAYS);
    return d.toISOString().slice(0, 10);
  }, []);

  const visible = useMemo(
    () =>
      rows.filter((job) => {
        if (filters.zoneId && job.zone_id !== filters.zoneId) return false;
        if (filters.enclosureId && job.enclosure_id !== filters.enclosureId) return false;
        if (
          !filters.allCompleted &&
          job.status === "Completed" &&
          (job.date_completed ?? job.updated_at.slice(0, 10)) < recentCutoff
        ) {
          return false;
        }
        return true;
      }),
    [rows, filters, recentCutoff],
  );

  const byStatus = useMemo(() => {
    const map = new Map<MaintenanceStatus, MaintenanceJob[]>(
      MAINTENANCE_STATUSES.map((s) => [s, []]),
    );
    for (const job of visible) map.get(job.status)?.push(job);
    // Completed reads newest first; open columns keep the due-date order.
    map.get("Completed")?.sort((a, b) =>
      (b.date_completed ?? "").localeCompare(a.date_completed ?? ""),
    );
    return map;
  }, [visible]);

  function moveJob(jobId: string, status: MaintenanceStatus) {
    const job = rows.find((j) => j.id === jobId);
    if (!job || job.status === status) return;
    setError(null);
    setDriveWarning(null);
    startTransition(async () => {
      moveOptimistically({ jobId, status });
      const result = await setMaintenanceStatus(jobId, status);
      if (result.error) setError(result.error);
      if (result.driveWarning) setDriveWarning(result.driveWarning);
      router.refresh();
    });
  }

  const newJobHref = filters.enclosureId
    ? `/maintenance/new?enclosureId=${filters.enclosureId}`
    : filters.zoneId
      ? `/maintenance/new?zoneId=${filters.zoneId}`
      : "/maintenance/new";

  const filtered = !!filters.zoneId || !!filters.enclosureId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 md:flex-row md:flex-wrap md:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-zone" className="text-xs font-medium text-muted">
            {m.filters.zone}
          </label>
          <select
            id="filter-zone"
            value={filters.zoneId ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, zoneId: e.target.value || null, enclosureId: null }))
            }
            className={inputClass}
          >
            <option value="">{m.filters.allZones}</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-enclosure" className="text-xs font-medium text-muted">
            {m.filters.enclosure}
          </label>
          <select
            id="filter-enclosure"
            value={filters.enclosureId ?? ""}
            disabled={!filters.zoneId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, enclosureId: e.target.value || null }))
            }
            className={inputClass}
          >
            <option value="">{m.filters.allEnclosures}</option>
            {enclosuresInZone.map((enclosure) => (
              <option key={enclosure.id} value={enclosure.id}>
                {enclosure.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 py-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={filters.allCompleted}
            onChange={(e) => setFilters((f) => ({ ...f, allCompleted: e.target.checked }))}
          />
          {m.filters.showAllCompleted}
        </label>
        {filtered && (
          <button
            type="button"
            onClick={() => setFilters({ zoneId: null, enclosureId: null, allCompleted: false })}
            className="py-2 text-left text-sm text-muted hover:text-foreground"
          >
            {m.filters.clear}
          </button>
        )}
        {canWrite && (
          <Link
            href={newJobHref}
            className="flex items-center justify-center gap-1 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover md:ml-auto"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {m.newJob}
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="h-3 w-1 rounded-full bg-danger" /> {m.legend.overdue}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-1 rounded-full bg-primary" /> {m.legend.dueSoon(DUE_SOON_DAYS)}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-warning" /> {m.legend.blocked}
        </span>
        {!filters.allCompleted && <span>{m.filters.recentCompletedHint(RECENT_COMPLETED_DAYS)}</span>}
        {canWrite && <span className="hidden md:inline">{m.boardHint}</span>}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {driveWarning && (
        <p className="text-xs text-primary">{m.detail.driveWarning(driveWarning)}</p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          {m.empty}
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          {m.emptyFiltered}
        </p>
      ) : (
        <>
          {/* Desktop: Kanban */}
          <div className="hidden gap-4 md:grid md:grid-cols-4">
            {MAINTENANCE_STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                jobs={byStatus.get(status) ?? []}
                canDrop={canWrite && !isPending}
                onDrop={(jobId) => moveJob(jobId, status)}
                locale={locale}
              />
            ))}
          </div>

          {/* Phone: chips + list */}
          <div className="flex flex-col gap-3 md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Chip active={mobileStatus === null} onClick={() => setMobileStatus(null)}>
                {m.filters.allOpen}
              </Chip>
              {MAINTENANCE_STATUSES.map((status) => (
                <Chip
                  key={status}
                  active={mobileStatus === status}
                  onClick={() => setMobileStatus(status)}
                  dot={STATUS_TONE[status].dot}
                >
                  {maintenanceStatusLabel(t, status)}{" "}
                  <span className="opacity-70">({byStatus.get(status)?.length ?? 0})</span>
                </Chip>
              ))}
            </div>
            <ul className="flex flex-col gap-2">
              {(mobileStatus
                ? (byStatus.get(mobileStatus) ?? [])
                : visible.filter((job) => job.status !== "Completed")
              ).map((job) => (
                <li key={job.id}>
                  <JobCard job={job} locale={locale} showStatus={!mobileStatus} />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  dot,
  children,
}: {
  active: boolean;
  onClick: () => void;
  dot?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted hover:bg-surface-hover"
      }`}
    >
      {dot && <span className={`h-2 w-2 rounded-full ${active ? "bg-primary-foreground" : dot}`} />}
      {children}
    </button>
  );
}

function Column({
  status,
  jobs,
  canDrop,
  onDrop,
  locale,
}: {
  status: MaintenanceStatus;
  jobs: MaintenanceJob[];
  canDrop: boolean;
  onDrop: (jobId: string) => void;
  locale: "en" | "th";
}) {
  const { t } = useI18n();
  const [over, setOver] = useState(false);
  const tone = STATUS_TONE[status];
  const estimated = jobs.reduce((sum, job) => sum + (job.estimated_cost ?? 0), 0);

  return (
    <section
      onDragOver={(e) => {
        if (!canDrop) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!canDrop) return;
        e.preventDefault();
        setOver(false);
        const jobId = e.dataTransfer.getData("application/x-maintenance-job");
        if (jobId) onDrop(jobId);
      }}
      className={`flex min-h-64 flex-col gap-2 rounded-lg border-t-4 bg-surface/60 p-2 transition ${tone.column} ${
        over ? "bg-primary/10 ring-2 ring-primary/40" : ""
      }`}
    >
      <header className="flex items-center justify-between gap-2 px-1 pt-1">
        <h2 className={`flex items-center gap-2 text-sm font-semibold ${tone.text}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
          {maintenanceStatusLabel(t, status)}
          <span className="font-normal text-muted">({jobs.length})</span>
        </h2>
        {estimated > 0 && (
          <span className="text-xs text-muted">
            {t.maintenance.estimatedTotal(formatBaht(estimated, locale))}
          </span>
        )}
      </header>
      {jobs.length === 0 ? (
        <p className="rounded border border-dashed border-border px-2 py-6 text-center text-xs text-muted">
          {t.maintenance.emptyColumn}
        </p>
      ) : (
        jobs.map((job) => (
          <JobCard key={job.id} job={job} locale={locale} draggable={canDrop} />
        ))
      )}
    </section>
  );
}

function JobCard({
  job,
  locale,
  draggable = false,
  showStatus = false,
}: {
  job: MaintenanceJob;
  locale: "en" | "th";
  draggable?: boolean;
  /** Phone list with every open status mixed: say which this one is. */
  showStatus?: boolean;
}) {
  const { t } = useI18n();
  const due = dueState(job.due_date, job.status);
  const photos = job.attachments.length;

  return (
    <Link
      href={`/maintenance/${job.id}`}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-maintenance-job", job.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`flex flex-col gap-1.5 rounded-lg border border-l-4 border-border bg-surface p-3 text-sm transition hover:bg-surface-hover ${DUE_TONE[due].card} ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium leading-snug text-foreground">{job.title}</span>
        <span className="shrink-0 font-mono text-[10px] text-muted">{job.job_code}</span>
      </div>
      <span className="flex items-center gap-1 truncate text-xs text-muted">
        <ENCLOSURE_ICONS.zone aria-hidden="true" className="h-3 w-3 shrink-0" />
        {job.zone_name}
        {" › "}
        {job.enclosure_name ?? t.maintenance.zoneWide}
      </span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {showStatus && (
          <span className={`flex items-center gap-1 ${STATUS_TONE[job.status].text}`}>
            <span className={`h-2 w-2 rounded-full ${STATUS_TONE[job.status].dot}`} />
            {maintenanceStatusLabel(t, job.status)}
          </span>
        )}
        {job.due_date && (
          <span
            className={`flex items-center gap-1 ${
              due !== "none" ? `rounded px-1 font-medium ${DUE_TONE[due].badge}` : ""
            }`}
          >
            <CalendarClock aria-hidden="true" className="h-3 w-3" />
            {formatDate(job.due_date, locale)}
          </span>
        )}
        {job.estimated_cost != null && <span>{formatBaht(job.estimated_cost, locale)}</span>}
        {photos > 0 && (
          <span className="flex items-center gap-1">
            <Camera aria-hidden="true" className="h-3 w-3" />
            {photos}
          </span>
        )}
      </div>
    </Link>
  );
}
