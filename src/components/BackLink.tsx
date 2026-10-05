import Link from "next/link";
import { ACTION_ICONS } from "@/components/hub-icons";

/**
 * "Back to …" on its own line. Navigation, not an action, so it stays a text
 * link; the arrow makes it findable and the 44 px height makes it tappable.
 */
export function BackLink({
  href,
  children,
  className = "text-sm",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = ACTION_ICONS.back;
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center gap-1.5 self-start font-medium text-primary hover:underline md:min-h-0 ${className}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      {children}
    </Link>
  );
}
