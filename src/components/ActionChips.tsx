import Link from "next/link";
import type { ReactNode } from "react";

export type ActionChip = { href: string; label: ReactNode };

/**
 * A row of pill-shaped links to the pages that hang off a screen. The caller decides which to pass
 * (from the route registry, so a chip and its page read one entry); nothing here checks access.
 */
export function ActionChips({ chips }: { chips: ActionChip[] }) {
  if (chips.length === 0) return null;
  return (
    <nav className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium text-primary hover:bg-surface-hover"
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
