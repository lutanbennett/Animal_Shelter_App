"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Clock, Hourglass, MessageSquarePlus, SkipForward, Users } from "lucide-react";
import { ENCLOSURE_ICONS, NAV_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import {
  MAINTENANCE_STATUSES,
  STATUS_TONE,
  maintenanceStatusLabel,
  type MaintenanceStatus,
} from "@/lib/maintenance/status";
import { daysBetween } from "@/lib/recurring-jobs/rule";
import {
  DUE_BUCKETS,
  dueBucket,
  type DueBucket,
  type MyTask,
  type MyTaskSection,
  type MyTaskSource,
} from "@/lib/my-tasks/types";
import { setMaintenanceStatus } from "../maintenance/actions";
import { recordRecurringJob } from "../management/recurring-jobs/actions";

const BUCKET_TONE: Record<DueBucket, { heading: string; edge: string }> = {
  overdue: { heading: "text-danger", edge: "border-l-danger" },
  today: { heading: "text-primary", edge: "border-l-primary" },
  later: { heading: "text-foreground", edge: "border-l-transparent" },
  none: { heading: "text-muted", edge: "border-l-transparent" },
};

/**
 * Per source: its heading icon, the icon beside its "about" line, and where
 * its full list lives — only for the roles that can open it.
 */
const SOURCE_META: Record<
  MyTaskSource,
  { icon: typeof NAV_ICONS.maintenance; aboutIcon: typeof NAV_ICONS.maintenance; href: string; managersOnly?: boolean }
> = {
  maintenance: { icon: NAV_ICONS.maintenance, aboutIcon: ENCLOSURE_ICONS.zone, href: "/maintenance?assignee=me" },
  recurring: {
    icon: NAV_ICONS.recurringJobs,
    aboutIcon: Clock,
    href: "/management/recurring-jobs",
    managersOnly: true,
  },
};

type Outcome = "done" | "skipped";

/** What the banner above the list offers to undo. */
type Undoable =
  | { kind: "maintenance"; task: MyTask; previous: MaintenanceStatus }
  | { kind: "recurring"; task: MyTask; outcome: Outcome };

/**
 * The sections of /my. Changes go through the source's existing server
 * action (setMaintenanceStatus for maintenance — the same one the board's
 * drag-and-drop calls; recordRecurringJob for recurring jobs), land
 * optimistically, and a task that is finished leaves the list with an Undo
 * in case it was the wrong row.
 */
export function MyTaskList({
  sections,
  today,
  canManage,
}: {
  sections: MyTaskSection[];
  today: string;
  canManage: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [driveWarning, setDriveWarning] = useState<string | null>(null);
  const [undoable, setUndoable] = useState<Undoable | null>(null);

  const [rows, setOptimistic] = useOptimistic(
    sections,
    (current, change: { key: string; status: MaintenanceStatus } | { key: string; hidden: boolean }) =>
      current.map((section) => ({
        ...section,
        tasks: section.tasks.flatMap((task) => {
          if (task.key !== change.key) return [task];
          if ("hidden" in change) return change.hidden ? [] : [task];
          return task.action?.kind === "maintenanceStatus"
            ? [{ ...task, status: change.status, action: { ...task.action, status: change.status } }]
            : [task];
        }),
      })),
  );

  function changeStatus(task: MyTask, status: MaintenanceStatus) {
    if (task.action?.kind !== "maintenanceStatus" || task.action.status === status) return;
    const previous = task.action.status;
    const jobId = task.action.jobId;
    setError(null);
    setDriveWarning(null);
    // Straight away, not after the action: the Drive folder move inside it
    // can take seconds, and the row has already gone.
    setUndoable(status === "Completed" ? { kind: "maintenance", task, previous } : null);
    startTransition(async () => {
      setOptimistic({ key: task.key, status });
      const result = await setMaintenanceStatus(jobId, status);
      if (result.error) {
        setError(result.error);
        setUndoable(null);
      }
      if (result.driveWarning) setDriveWarning(result.driveWarning);
      router.refresh();
    });
  }

  /** Done / skipped for one date, or null to clear it again (Undo). */
  function record(task: MyTask, outcome: Outcome | null, note: string | null) {
    if (task.action?.kind !== "recurringOutcome") return;
    const { jobId, occursOn } = task.action;
    setError(null);
    setUndoable(outcome ? { kind: "recurring", task, outcome } : null);
    startTransition(async () => {
      if (outcome) setOptimistic({ key: task.key, hidden: true });
      const result = await recordRecurringJob(jobId, occursOn, outcome, note);
      if (result.error) {
        setError(result.error);
        setUndoable(null);
      }
      router.refresh();
    });
  }

  function undo() {
    if (!undoable) return;
    setUndoable(null);
    if (undoable.kind === "maintenance") {
      const { task, previous } = undoable;
      if (task.action?.kind !== "maintenanceStatus") return;
      changeStatus({ ...task, action: { ...task.action, status: "Completed" } }, previous);
    } else {
      record(undoable.task, null, null);
    }
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
      {undoable && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-foreground">
          <span>
            {undoable.kind === "maintenance"
              ? t.my.markedDone(undoable.task.title)
              : undoable.outcome === "done"
                ? t.my.recurring.markedDone(undoable.task.title)
                : t.my.recurring.markedSkipped(undoable.task.title)}
          </span>
          <button type="button" onClick={undo} className="font-medium text-primary hover:underline">
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
            <Section
              key={section.source}
              section={section}
              today={today}
              canManage={canManage}
              onStatus={changeStatus}
              onRecord={record}
            />
          ))
      )}
    </div>
  );
}

function Section({
  section,
  today,
  canManage,
  onStatus,
  onRecord,
}: {
  section: MyTaskSection;
  today: string;
  canManage: boolean;
  onStatus: (task: MyTask, status: MaintenanceStatus) => void;
  onRecord: (task: MyTask, outcome: Outcome, note: string | null) => void;
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
        {(!meta.managersOnly || canManage) && (
          <Link href={meta.href} className="text-sm font-medium text-primary hover:underline">
            {t.my.openFullList[section.source]}
          </Link>
        )}
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
                  <TaskRow
                    task={task}
                    today={today}
                    edge={BUCKET_TONE[bucket].edge}
                    onStatus={onStatus}
                    onRecord={onRecord}
                  />
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
  today,
  edge,
  onStatus,
  onRecord,
}: {
  task: MyTask;
  today: string;
  edge: string;
  onStatus: (task: MyTask, status: MaintenanceStatus) => void;
  onRecord: (task: MyTask, outcome: Outcome, note: string | null) => void;
}) {
  const { t, locale } = useI18n();
  const AboutIcon = SOURCE_META[task.source].aboutIcon;
  const late = task.due && task.due < today ? daysBetween(task.due, today) : 0;

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-l-4 border-border bg-surface p-3 text-sm lg:flex-row lg:items-center lg:justify-between ${edge}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-start gap-2">
          {task.href ? (
            <Link href={task.href} className="font-medium leading-snug text-foreground hover:underline">
              {task.title}
            </Link>
          ) : (
            <span className="font-medium leading-snug text-foreground">{task.title}</span>
          )}
          {task.code && <span className="shrink-0 pt-0.5 font-mono text-[10px] text-muted">{task.code}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {task.about && (
            <span className="flex items-center gap-1">
              <AboutIcon aria-hidden="true" className="h-3 w-3 shrink-0" />
              {task.about}
            </span>
          )}
          {task.due && (
            <span className="flex items-center gap-1">
              <CalendarClock aria-hidden="true" className="h-3 w-3" />
              {formatDate(task.due, locale)}
              {late > 0 && <span className="font-medium text-danger">· {t.my.daysLate(late)}</span>}
            </span>
          )}
          {task.others.length > 0 && (
            <span className="flex items-center gap-1">
              <Users aria-hidden="true" className="h-3 w-3" />
              {t.my.withOthers(task.others.join(", "))}
            </span>
          )}
          {task.waitingFor && (
            <span className="flex items-center gap-1 font-medium text-warning">
              <Hourglass aria-hidden="true" className="h-3 w-3" />
              {t.my.waitingFor(task.waitingFor)}
            </span>
          )}
          {task.status && task.action?.kind !== "maintenanceStatus" && (
            <span className={`flex items-center gap-1 ${STATUS_TONE[task.status].text}`}>
              <span className={`h-2 w-2 rounded-full ${STATUS_TONE[task.status].dot}`} />
              {maintenanceStatusLabel(t, task.status)}
            </span>
          )}
        </div>
        {task.description && (
          <p className="whitespace-pre-line text-xs text-foreground/80">{task.description}</p>
        )}
      </div>

      {task.action?.kind === "maintenanceStatus" && (
        <div
          role="radiogroup"
          aria-label={t.my.statusFor(task.title)}
          className="flex shrink-0 flex-wrap gap-1"
        >
          {MAINTENANCE_STATUSES.map((status) => {
            const active = task.action?.kind === "maintenanceStatus" && task.action.status === status;
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

      {task.action?.kind === "recurringOutcome" && (
        <RecurringButtons task={task} canMarkDone={task.action.canMarkDone} onRecord={onRecord} />
      )}
    </div>
  );
}

/** Done / Skip, with an optional note that goes on the record with either. */
function RecurringButtons({
  task,
  canMarkDone,
  onRecord,
}: {
  task: MyTask;
  canMarkDone: boolean;
  onRecord: (task: MyTask, outcome: Outcome, note: string | null) => void;
}) {
  const { t } = useI18n();
  const r = t.my.recurring;
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const send = (outcome: Outcome) => onRecord(task, outcome, note.trim() || null);

  return (
    <div className="flex shrink-0 flex-col gap-2 lg:items-end">
      <div role="group" aria-label={r.outcomeFor(task.title)} className="flex flex-wrap items-center gap-1">
        {!noteOpen && (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <MessageSquarePlus aria-hidden="true" className="h-3.5 w-3.5" />
            {r.addNote}
          </button>
        )}
        <button
          type="button"
          onClick={() => send("skipped")}
          className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground"
        >
          <SkipForward aria-hidden="true" className="h-3.5 w-3.5" />
          {r.skip}
        </button>
        <button
          type="button"
          onClick={() => send("done")}
          disabled={!canMarkDone}
          title={canMarkDone ? undefined : r.notYet}
          className="flex items-center gap-1.5 rounded-full border border-success/50 bg-success/10 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
          {r.done}
        </button>
      </div>
      {noteOpen && (
        <input
          type="text"
          value={note}
          maxLength={2000}
          onChange={(event) => setNote(event.target.value)}
          placeholder={r.notePlaceholder}
          aria-label={r.addNote}
          autoFocus
          className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary lg:w-64"
        />
      )}
    </div>
  );
}
