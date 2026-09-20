import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { NamedEntry } from "@/lib/management/report";

/** "Pancake (2)" when a resident appears more than once in the section. */
export function entryLabel(entry: NamedEntry) {
  return entry.count > 1 ? `${entry.name} (${entry.count})` : entry.name;
}

/** The comma-separated name list the monthly report prints, each a link. */
export function NameList({
  entries,
  none,
}: {
  entries: NamedEntry[];
  none: string;
}) {
  if (entries.length === 0) {
    return <span className="text-xs text-muted">{none}</span>;
  }
  return (
    <span className="text-xs leading-relaxed text-muted">
      {entries.map((entry, i) => (
        <span key={entry.id}>
          {i > 0 && ", "}
          <Link
            href={`/residents/${entry.id}`}
            className="relative z-10 text-foreground hover:text-primary hover:underline"
          >
            {entryLabel(entry)}
          </Link>
        </span>
      ))}
    </span>
  );
}

/**
 * One line of the monthly report: a heading, the count and who it was.
 * Sections with more than one list (fostered new / continuing, procedures
 * by type) pass their rows as `groups` instead.
 */
export function ReportCard({
  title,
  hint,
  icon: Icon,
  count,
  entries,
  groups,
  none,
}: {
  title: string;
  hint?: string;
  icon: LucideIcon;
  count: number;
  entries?: NamedEntry[];
  groups?: { label: string; entries: NamedEntry[] }[];
  none: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 md:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2 text-sm font-medium text-muted">
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="truncate">{title}</span>
          </span>
          {hint && <span className="text-xs text-muted/80">{hint}</span>}
        </div>
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {count}
        </span>
      </div>
      {entries && <NameList entries={entries} none={none} />}
      {groups &&
        (groups.length === 0 ? (
          <span className="text-xs text-muted">{none}</span>
        ) : (
          <dl className="flex flex-col gap-1.5">
            {groups.map((group) => (
              <div key={group.label} className="flex flex-col">
                <dt className="text-xs font-medium text-foreground">
                  {group.label}
                  <span className="ml-1 tabular-nums text-muted">
                    · {group.entries.reduce((n, e) => n + e.count, 0)}
                  </span>
                </dt>
                <dd>
                  <NameList entries={group.entries} none={none} />
                </dd>
              </div>
            ))}
          </dl>
        ))}
    </div>
  );
}
