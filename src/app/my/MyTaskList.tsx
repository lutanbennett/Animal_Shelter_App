"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Users } from "lucide-react";
import { ENCLOSURE_ICONS, NAV_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import {
  MAINTENANCE_STATUSES,
  STATUS_TONE,
  maintenanceStatusLabel,
  type MaintenanceStatus,
} from "@/lib/maintenance/status";
import {
  DUE_BUCKETS,
  dueBucket,
  type DueBucket,
  type MyTask,
  type MyTaskSection,
  type MyTaskSource,
} from "@/lib/my-tasks/types";
import { setMaintenanceStatus } from "../maintenance/actions";

const BUCKET_TONE: Record<DueBucket, { heading: string; edge: string }> = {
  overdue: { heading: "text-danger", edge: "border-l-danger" },
  today: { heading: "text-primary", edge: "border-l-primary" },
  later: { heading: "text-foreground", edge: "border-l-transparent" },
  none: { heading: "text-muted", edge: "border-l-transparent" },
};

/** Per source: its heading icon and where its full list lives. */
const SOURCE_META: Record<MyTaskSource, { icon: typeof NAV_ICONS.maintenance; href: string }> = {
  maintenance: { icon: NAV_ICONS.maintenance, href: "/maintenance?assignee=me" },
};

/**
 * The sections of /my. Status changes go through the source's existing
 * server action (setMaintenanceStatus for maintenance — the same one the
 * board's drag-and-drop calls), land optimistically, and a task marked
 * Completed leaves the list with an Undo in case it was the wrong row.
 */
export function MyTaskList({ sections, today }: { sections: MyTaskSection[]; today: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [driveWarning, setDriveWarning] = useState<string | null>(null);
  const [done, setDone] = useState<{ task: MyTask; previous: MaintenanceStatus } | null>(null);

  const [rows, setOptimistic] = useOptimistic(
    sections,
    (current, change: { key: string; status: MaintenanceStatus }) =>
      current.map((section) => ({
        ...section,
        tasks: section.tasks.map((task) =>
          task.key === change.key && task.action
            ? { ...task, status: change.status, action: { ...task.action, status: change.status } }
            : task,
        ),
      })),
  );

  function changeStatus(task: MyTask, status: MaintenanceStatus) {
    if (!task.action || task.action.status === status) return;
    const previous = task.action.status;
    const jobId = task.action.jobId;
    setError(null);
    setDriveWarning(null);
    // Straight away, not after the action: the Drive folder move inside it
    // can take seconds, and the row has already gone.
    setDone(status === "Completed" ? { task, previous } : null);
    startTransition(async () => {
      setOptimistic({ key: task.key, status });
      const result = await setMaintenanceStatus(jobId, status);
      if (result.error) {
        setError(result.error);
        setDone(null);
      }
      if (result.driveWarning) setDriveWarning(result.driveWarning);
      router.refresh();
    });
  }

  const visible = rows.map((section) => ({
    ...section,
    tasks: section.tasks.filter((task) => task.status !== "Completed"),
  }));
  const total = visible.reduce((sum, section) => sum + section.tasks.length, 0);
  const errors = visible.filter((section) => section.error);

  return (
    <div className="flex flex-col gap-6">
      {errors.map((section) => (
        <p key={section.source} className="text-sm text-danger">
          {t.my.couldntLoad(t.my.sources[section.source])}: {section.error}
        </p>
      ))}
      {error && <p className="text-sm text-danger">{error}</p>}
      {driveWarning && (
        <p className="text-xs text-primary">{t.maintenance.detail.driveWarning(driveWarning)}</p>
      )}
      {done && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-foreground">
          <span>{t.my.markedDone(done.task.title)}</span>
          <button
            type="button"
            onClick={() => {
              const { task, previous } = done;
              setDone(null);
              changeStatus({ ...task, action: task.action && { ...task.action, status: "Completed" } }, previous);
            }}
            className="font-medium text-primary hover:underline"
          >
            {t.my.undo}
          </button>
        </div>
      )}

      {total === 0 && errors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          {t.my.empty}
        </p>
      ) : (
        visible
          .filter((section) => section.tasks.length > 0)
          .map((section) => (
            <Section key={section.source} section={section} today={today} onStatus={changeStatus} />
          ))
      )}
    </div>
  );
}

function Section({
  section,
  today,
  onStatus,
}: {
  section: MyTaskSection;
  today: string;
  onStatus: (task: MyTask, status: MaintenanceStatus) => void;
}) {
  const { t } = useI18n();
  const meta = SOURCE_META[section.source];
  const Icon = meta.icon;

  const groups = useMemo(() => {
    const map = new Map<DueBucket, MyTask[]>(DUE_BUCKETS.map((b) => [b, []]));
    for (const task of section.tasks) map.get(dueBucket(task.due, today))?.push(task);
    // Soonest first within a group; the loaders' own order breaks ties.
    for (const list of map.values()) list.sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));
    return map;
  }, [section.tasks, today]);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Icon aria-hidden="true" className="h-5 w-5 text-muted" />
          {t.my.sources[section.source]}
          <span className="text-sm font-normal text-muted">({section.tasks.length})</span>
        </h2>
        <Link href={meta.href} className="text-sm font-medium text-primary hover:underline">
          {t.my.openFullList[section.source]}
        </Link>
      </header>

      {DUE_BUCKETS.map((bucket) => {
        const tasks = groups.get(bucket) ?? [];
        if (tasks.length === 0) return null;
        return (
          <div key={bucket} className="flex flex-col gap-2">
            <h3 className={`text-sm font-semibold ${BUCKET_TONE[bucket].heading}`}>
              {t.my.buckets[bucket]} <span className="font-normal text-muted">({tasks.length})</span>
            </h3>
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <li key={task.key}>
                  <TaskRow task={task} edge={BUCKET_TONE[bucket].edge} onStatus={onStatus} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

function TaskRow({
  task,
  edge,
  onStatus,
}: {
  task: MyTask;
  edge: string;
  onStatus: (task: MyTask, status: MaintenanceStatus) => void;
}) {
  const { t, locale } = useI18n();

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-l-4 border-border bg-surface p-3 text-sm lg:flex-row lg:items-center lg:justify-between ${edge}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-start gap-2">
          <Link href={task.href} className="font-medium leading-snug text-foreground hover:underline">
            {task.title}
          </Link>
          {task.code && <span className="shrink-0 pt-0.5 font-mono text-[10px] text-muted">{task.code}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1">
            <ENCLOSURE_ICONS.zone aria-hidden="true" className="h-3 w-3 shrink-0" />
            {task.about}
          </span>
          {task.due && (
            <span className="flex items-center gap-1">
              <CalendarClock aria-hidden="true" className="h-3 w-3" />
              {formatDate(task.due, locale)}
            </span>
          )}
          {task.others.length > 0 && (
            <span className="flex items-center gap-1">
              <Users aria-hidden="true" className="h-3 w-3" />
              {t.my.withOthers(task.others.join(", "))}
            </span>
          )}
          {task.status && !task.action && (
            <span className={`flex items-center gap-1 ${STATUS_TONE[task.status].text}`}>
              <span className={`h-2 w-2 rounded-full ${STATUS_TONE[task.status].dot}`} />
              {maintenanceStatusLabel(t, task.status)}
            </span>
          )}
        </div>
      </div>

      {task.action?.kind === "maintenanceStatus" && (
        <div
          role="radiogroup"
          aria-label={t.my.statusFor(task.title)}
          className="flex shrink-0 flex-wrap gap-1"
        >
          {MAINTENANCE_STATUSES.map((status) => {
            const active = task.action?.status === status;
            const tone = STATUS_TONE[status];
            return (
              <button
                key={status}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onStatus(task, status)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  active ? tone.badge : "border-border text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                {maintenanceStatusLabel(t, status)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
