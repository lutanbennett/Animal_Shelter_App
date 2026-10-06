import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

const VARIANT_CLASSES = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "border border-border text-foreground hover:bg-surface-hover",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
} as const;

/**
 * The `<button>` twin of ActionLink: an icon and the word, for an action that
 * does something in place (Save, Add, Issue password) rather than going to
 * another page. The word always shows: icon-only is kept for actions repeated
 * on every row, which use RowActionButton. 44 px tall on phones, 36 px with a
 * mouse. Submit buttons pass `type="submit"`.
 */
export function ActionButton({
  icon: Icon,
  variant = "secondary",
  compact = false,
  type = "button",
  children,
  ...buttonProps
}: {
  icon: LucideIcon;
  variant?: keyof typeof VARIANT_CLASSES;
  /** Table cells and small panels: smaller type and padding. */
  compact?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  return (
    <button
      type={type}
      {...buttonProps}
      data-action="ActionButton"
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded font-medium transition disabled:cursor-not-allowed disabled:opacity-50 md:min-h-9 ${
        compact ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm"
      } ${VARIANT_CLASSES[variant]}`}
    >
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0 md:h-4 md:w-4" />
      {children}
    </button>
  );
}
