import { Archive } from "lucide-react";

/**
 * The "Archived" pill an archived contact carries wherever it is still
 * named — the contact lists, its own page, a resident's housing history.
 * Takes the label so server and client components can both render it.
 */
export function ArchivedBadge({ label, title }: { label: string; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-border bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted"
    >
      <Archive aria-hidden="true" className="h-3 w-3" />
      {label}
    </span>
  );
}
