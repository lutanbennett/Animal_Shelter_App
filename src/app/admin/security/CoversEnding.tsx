"use client";

import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { roleOptionLabel, type RoleOption } from "./role-options";

/** A second role (a cover, 0196) that stops counting within the week. */
export type EndingCover = { userId: string; who: string; role: string; endsOn: string };

/**
 * Covers that run out in the next seven days, soonest first, so nobody is surprised on the day the extra role stops
 * counting. Says nothing when there are none. \`endsOn\` is the last day the role counts: it works that day and stops
 * the day after.
 */
export function CoversEnding({ covers, roles }: { covers: EndingCover[]; roles: RoleOption[] }) {
  const { t, locale } = useI18n();
  if (covers.length === 0) return null;
  const w = t.admin.security.table.cover;
  return (
    <section className="rounded-lg border border-border bg-surface p-4" aria-labelledby="covers-ending">
      <h2 id="covers-ending" className="font-semibold text-foreground">
        {w.endingTitle}
      </h2>
      <p className="text-sm text-muted">{w.endingIntro}</p>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground">
        {covers.map((c) => (
          <li key={`${c.userId}:${c.role}`}>
            {w.endingRow(
              c.who,
              roleOptionLabel(t, locale, roles.find((r) => r.key === c.role) ?? { key: c.role, name: c.role, nameTh: null }),
              formatDate(c.endsOn, locale),
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
