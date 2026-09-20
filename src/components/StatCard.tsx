import Link from "next/link";
import { Plus, type LucideIcon } from "lucide-react";

export type StatCardTone = "success" | "warning" | "danger" | "neutral";

const TONE_CLASSES: Record<StatCardTone, string> = {
  success: "border-success/40 bg-success/10",
  warning: "border-primary/40 bg-primary/10",
  danger: "border-danger/40 bg-danger/10",
  neutral: "border-border bg-surface",
};

const TONE_VALUE_CLASSES: Record<StatCardTone, string> = {
  success: "text-success",
  warning: "text-primary",
  danger: "text-danger",
  neutral: "text-foreground",
};

const TONE_DOT_CLASSES: Record<StatCardTone, string> = {
  success: "bg-success",
  warning: "bg-primary",
  danger: "bg-danger",
  neutral: "bg-muted",
};

export function StatCard({
  href,
  title,
  value,
  detail,
  tone = "neutral",
  icon: Icon,
  action,
}: {
  href: string;
  title: string;
  value: string;
  detail?: string;
  tone?: StatCardTone;
  /**
   * Icon standing in for the title below the `md` breakpoint, where the
   * two-column card grid is too narrow for the heading text. Shown next to
   * the title on wider screens.
   */
  icon?: LucideIcon;
  /** Optional secondary link (e.g. "Book vet visit") shown at the foot of the card. */
  action?: { href: string; label: string };
}) {
  // The title link's ::after overlay makes the whole card clickable without
  // nesting <a> inside <a>; the action link is raised above that overlay.
  return (
    <div
      className={`relative flex flex-col gap-2 rounded-lg border p-3 transition hover:brightness-110 md:p-4 ${TONE_CLASSES[tone]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={href}
          title={title}
          aria-label={title}
          className={`flex min-w-0 items-center gap-2 text-sm font-medium after:absolute after:inset-0 after:content-[''] ${
            Icon ? TONE_VALUE_CLASSES[tone] : "text-muted"
          } md:text-muted`}
        >
          {Icon && (
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0 md:h-4 md:w-4" />
          )}
          <span className={Icon ? "hidden truncate md:inline" : "truncate"}>
            {title}
          </span>
        </Link>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT_CLASSES[tone]}`}
          aria-hidden
        />
      </div>
      <span
        className={`break-words text-lg font-semibold md:text-2xl ${TONE_VALUE_CLASSES[tone]}`}
      >
        {value}
      </span>
      {detail && (
        <span className="line-clamp-2 text-xs text-muted">{detail}</span>
      )}
      {action && (
        <Link
          href={action.href}
          title={action.label}
          aria-label={action.label}
          className="relative z-10 mt-auto inline-flex items-center gap-1 self-start rounded-full border border-primary/40 p-1.5 text-xs font-medium text-primary hover:bg-primary/10 md:rounded md:border-0 md:p-0 md:hover:bg-transparent md:hover:underline"
        >
          <Plus aria-hidden="true" className="h-4 w-4 shrink-0 md:h-3.5 md:w-3.5" />
          <span className="hidden md:inline">{action.label}</span>
        </Link>
      )}
    </div>
  );
}
