import Link from "next/link";
import type { HomeTile } from "@/lib/home/tiles";

/**
 * A home screen: one big target per job, an icon and a word (§8). Two across at 375 px, three
 * from `sm`. The word may be long in Thai and has no spaces to break at, so it wraps anywhere
 * rather than pushing the tile wider than its column.
 */
export function HomeTiles({ tiles }: { tiles: HomeTile[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map(({ href, label, icon: Icon }) => (
        <li key={href} className="min-w-0">
          <Link
            href={href}
            className="flex h-full min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface p-3 text-center transition hover:bg-surface-hover"
          >
            <Icon aria-hidden="true" className="h-9 w-9 shrink-0 text-primary" />
            <span className="min-w-0 text-base font-medium leading-tight text-foreground [overflow-wrap:anywhere]">
              {label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
