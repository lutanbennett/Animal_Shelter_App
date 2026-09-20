import type { Dictionary } from "@/lib/i18n/dictionaries/en";

/**
 * The maintenance_status enum (0001, renamed in 0033), in board-column
 * order. The stored values double as the Drive folder names under
 * .../<Zone>/<Enclosure>/, so they are English and title-cased on purpose;
 * the UI shows them through t.enums.maintenanceStatus.
 */
export const MAINTENANCE_STATUSES = [
  "Not Started",
  "In Progress",
  "Blocked",
  "Completed",
] as const;

export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export function isMaintenanceStatus(value: unknown): value is MaintenanceStatus {
  return (MAINTENANCE_STATUSES as readonly unknown[]).includes(value);
}

export function maintenanceStatusLabel(
  t: Dictionary,
  value: MaintenanceStatus | string,
): string {
  return t.enums.maintenanceStatus[value as MaintenanceStatus] ?? value;
}

/**
 * Colour per column. Tailwind classes are spelled out in full rather than
 * assembled from a token name so the compiler keeps them.
 */
export const STATUS_TONE: Record<
  MaintenanceStatus,
  { dot: string; text: string; badge: string; column: string }
> = {
  "Not Started": {
    dot: "bg-muted",
    text: "text-muted",
    badge: "border-border bg-surface-hover text-muted",
    column: "border-border",
  },
  "In Progress": {
    dot: "bg-info",
    text: "text-info",
    badge: "border-info/40 bg-info/15 text-info",
    column: "border-info/40",
  },
  Blocked: {
    dot: "bg-warning",
    text: "text-warning",
    badge: "border-warning/40 bg-warning/15 text-warning",
    column: "border-warning/40",
  },
  Completed: {
    dot: "bg-success",
    text: "text-success",
    badge: "border-success/40 bg-success/15 text-success",
    column: "border-success/40",
  },
};

/** Jobs due within this many days are flagged as "due soon". */
export const DUE_SOON_DAYS = 3;

export type DueState = "overdue" | "dueSoon" | "none";

/**
 * Overdue / due soon, from the due date and status. A completed job is
 * never overdue, however late it finished — the board is about what still
 * needs doing. Compares calendar dates (ISO yyyy-mm-dd strings), so a job
 * due today is "due soon", not overdue.
 */
export function dueState(
  dueDate: string | null,
  status: MaintenanceStatus | string,
  today: string = todayIsoDate(),
): DueState {
  if (!dueDate || status === "Completed") return "none";
  if (dueDate < today) return "overdue";
  const soon = new Date(today);
  soon.setDate(soon.getDate() + DUE_SOON_DAYS);
  if (dueDate <= soon.toISOString().slice(0, 10)) return "dueSoon";
  return "none";
}

export const DUE_TONE: Record<DueState, { card: string; badge: string }> = {
  overdue: {
    card: "border-l-danger",
    badge: "bg-danger/15 text-danger",
  },
  dueSoon: {
    card: "border-l-primary",
    badge: "bg-primary/15 text-primary",
  },
  none: {
    card: "border-l-transparent",
    badge: "",
  },
};

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
