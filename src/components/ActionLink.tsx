import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const VARIANT_CLASSES = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary:
    "border border-border text-foreground hover:bg-surface-hover",
} as const;

/**
 * Button-styled link with a leading icon. Below the `md` breakpoint the label
 * collapses so only the icon shows (the label stays as the accessible name),
 * which keeps rows of actions on one line at phone width.
 */
export function ActionLink({
  href,
  label,
  icon: Icon,
  variant = "secondary",
  iconOnlyOnMobile = true,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  variant?: keyof typeof VARIANT_CLASSES;
  iconOnlyOnMobile?: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      data-action="ActionLink"
      className={`inline-flex items-center gap-2 rounded text-sm font-medium ${
        iconOnlyOnMobile ? "min-h-11 justify-center px-3 py-2 md:min-h-0 md:px-4" : "min-h-11 px-4 py-2 md:min-h-0"
      } ${VARIANT_CLASSES[variant]}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className={iconOnlyOnMobile ? "hidden md:inline" : undefined}>
        {label}
      </span>
    </Link>
  );
}
