import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

const TONE_CLASSES = {
  default: "border-border text-primary hover:bg-primary/10",
  danger: "border-border text-danger hover:bg-danger/10",
  /** Over a photo or file thumbnail (the remove x): readable on any image. */
  overlay: "border-transparent bg-black/60 text-white hover:bg-danger",
} as const;

// 44 px square on phones (the touch-target rule), a tighter 36 px with a mouse.
const BASE =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border transition disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:w-9";

type Common = {
  /** The action's word, e.g. "Edit". Shown as the tooltip. */
  label: string;
  /**
   * Names the row so a screen reader can tell one Edit from the next, e.g.
   * "Panda's weight on 2 Oct". The accessible name becomes "Edit: Panda's …".
   */
  subject?: string;
  /** Tooltip when it should say more than the word, e.g. why a button is disabled. */
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONE_CLASSES;
};

function names({ label, subject, hint }: Pick<Common, "label" | "subject" | "hint">) {
  return { title: hint ?? label, "aria-label": subject ? `${label}: ${subject}` : label };
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
    <Link href={href} {...names(rest)} data-action="RowActionLink" className={`${BASE} ${TONE_CLASSES[tone]}`}>
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
  hint,
  ...buttonProps
}: Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title" | "aria-label" | "className" | "children">) {
  return (
    <button
      type="button"
      {...buttonProps}
      {...names({ label, subject, hint })}
      data-action="RowActionButton"
      className={`${BASE} ${TONE_CLASSES[tone]}`}
    >
      <Icon aria-hidden="true" className="h-5 w-5 md:h-4 md:w-4" />
    </button>
  );
}
