import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

export type SectionTile = {
  href: string;
  /** Reuses the nav label, so the tile and the menu entry always read alike. */
  label: string;
  /** One sentence on what the page is for — the tiles teach as well as navigate. */
  description: string;
  icon: LucideIcon;
};

/**
 * The card grid behind the Management and Admin landing pages: one big
 * target per destination the matching nav group lists, in the same order.
 * One column on a phone, two from `sm` and three from `lg`.
 */
export function SectionTiles({ tiles }: { tiles: SectionTile[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map(({ href, label, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 transition hover:bg-surface-hover"
        >
          <span className="flex items-center gap-2">
            <Icon
              aria-hidden="true"
              className="h-6 w-6 shrink-0 text-primary"
            />
            <span className="min-w-0 flex-1 font-medium text-foreground">
              {label}
            </span>
            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <p className="text-xs text-muted">{description}</p>
        </Link>
      ))}
    </div>
  );
}
