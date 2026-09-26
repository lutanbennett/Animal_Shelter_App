import type { MaintenanceStatus } from "@/lib/maintenance/status";

/**
 * The common shape of "something assigned to me" on /my (docs/decisions.md,
 * 2026-09-26). Every source — maintenance and recurring jobs today; vet
 * trips, medication rounds and stock orders later — is one small loader
 * that returns `MyTask[]`, and the page renders each source as its own
 * section grouped by `due`. A new source adds a member to `MyTaskSource`, a
 * loader beside ./maintenance.ts and, if it has a quick action, a member to
 * `MyTaskAction` with its handler in src/app/my/MyTaskList.tsx. Nothing
 * else on the page changes.
 *
 * Text is already in the reader's language when it leaves the loader (the
 * page is a server component and re-renders on a language switch), so the
 * list never needs to know where a title came from.
 */
export type MyTaskSource = "maintenance" | "recurring";

/**
 * What the row's buttons do. Always an existing server action — /my has no
 * write path of its own. `null` when the reader may look but not act (a
 * volunteer on a maintenance team: RLS lets them read the job, not move it).
 */
export type MyTaskAction =
  | {
      kind: "maintenanceStatus";
      jobId: string;
      status: MaintenanceStatus;
    }
  | {
      /** Done / skipped for one date of a recurring job (0095, record_recurring_job). */
      kind: "recurringOutcome";
      jobId: string;
      occursOn: string;
      /** False for a date still ahead: it can be skipped, not done. */
      canMarkDone: boolean;
    };

export type MyTask = {
  /** Unique across sources, e.g. "maintenance:<uuid>". */
  key: string;
  source: MyTaskSource;
  /** What to do, e.g. "Gate latch broken". */
  title: string;
  /** A short reference shown beside the title, e.g. a job code. */
  code?: string;
  /** What it is about — a place, a resident, a zone, a time of day. */
  about: string;
  /** When it is due, YYYY-MM-DD shelter date; null = no date set. */
  due: string | null;
  /** Where the full record, or the screen the job is done on, lives; null = nowhere to go. */
  href: string | null;
  /** Who else is on it; empty when it's mine alone. */
  others: string[];
  /** The status as a label, when the source has one. */
  status: MaintenanceStatus | null;
  /** Another task that should be finished first ("waiting for Stocktake"). */
  waitingFor?: string | null;
  /** Longer instructions, shown under the row when there are any. */
  description?: string | null;
  action: MyTaskAction | null;
};

export type MyTaskSection = {
  source: MyTaskSource;
  tasks: MyTask[];
  error: string | null;
};

export type DueBucket = "overdue" | "today" | "later" | "none";

/** In the order the page shows them: most urgent first, undated last. */
export const DUE_BUCKETS: DueBucket[] = ["overdue", "today", "later", "none"];

/** Which group a task falls in, comparing shelter calendar dates. */
export function dueBucket(due: string | null, today: string): DueBucket {
  if (!due) return "none";
  if (due < today) return "overdue";
  if (due === today) return "today";
  return "later";
}
