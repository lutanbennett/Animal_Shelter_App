import Link from "next/link";

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
  action,
}: {
  href: string;
  title: string;
  value: string;
  detail?: string;
  tone?: StatCardTone;
  /** Optional secondary link (e.g. "+ Book vet visit") shown at the foot of the card. */
  action?: { href: string; label: string };
}) {
  // The title link's ::after overlay makes the whole card clickable without
  // nesting <a> inside <a>; the action link is raised above that overlay.
  return (
    <div
      className={`relative flex flex-col gap-2 rounded-lg border p-4 transition hover:brightness-110 ${TONE_CLASSES[tone]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={href}
          className="text-sm font-medium text-muted after:absolute after:inset-0 after:content-['']"
        >
          {title}
        </Link>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT_CLASSES[tone]}`}
          aria-hidden
        />
      </div>
      <span className={`text-2xl font-semibold ${TONE_VALUE_CLASSES[tone]}`}>
        {value}
      </span>
      {detail && <span className="text-xs text-muted">{detail}</span>}
      {action && (
        <Link
          href={action.href}
          className="relative z-10 mt-auto self-start text-xs font-medium text-primary hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
