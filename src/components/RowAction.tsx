import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

const TONE_CLASSES = {
  default: "text-primary hover:bg-primary/10",
  danger: "text-danger hover:bg-danger/10",
} as const;

// 44 px square on phones (the touch-target rule), a tighter 36 px with a mouse.
const BASE =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border border-border transition disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:w-9";

type Common = {
  /** The action's word, e.g. "Edit". Shown as the tooltip. */
  label: string;
  /**
   * Names the row so a screen reader can tell one Edit from the next, e.g.
   * "Panda's weight on 2 Oct". The accessible name becomes "Edit: Panda's …".
   */
  subject?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONE_CLASSES;
};

function names({ label, subject }: Pick<Common, "label" | "subject">) {
  return { title: label, "aria-label": subject ? `${label}: ${subject}` : label };
}

/**
 * Icon-only link for an action repeated on every row of a list (edit, log a
 * reading). Icon-only is reserved for this: an icon alone means nothing to a
 * screen reader, hence `subject`. Pages that need a word beside the icon use
 * ActionLink instead.
 */
export function RowActionLink({
  href,
  icon: Icon,
  tone = "default",
  ...rest
}: Common & { href: string }) {
  return (
    <Link href={href} {...names(rest)} className={`${BASE} ${TONE_CLASSES[tone]}`}>
      <Icon aria-hidden="true" className="h-5 w-5 md:h-4 md:w-4" />
    </Link>
  );
}

/** The `<button>` twin of RowActionLink, for actions that do something in place. */
export function RowActionButton({
  icon: Icon,
  tone = "default",
  label,
  subject,
  ...buttonProps
}: Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title" | "aria-label" | "className" | "children">) {
  return (
    <button
      type="button"
      {...buttonProps}
      {...names({ label, subject })}
      className={`${BASE} ${TONE_CLASSES[tone]}`}
    >
      <Icon aria-hidden="true" className="h-5 w-5 md:h-4 md:w-4" />
    </button>
  );
}
