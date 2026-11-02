import Link from "next/link";
import { getT } from "@/lib/i18n/get-t";
import { formatDate } from "@/lib/format";
import type { Mention } from "@/lib/note-tags/load";

/**
 * "Mentioned in" on a resident's hub: notes written on other residents that tag this one, each with a link back to
 * the resident it was written on. Draws nothing when there are none. No control here acts on anything, so there is
 * nothing to gate by card; which links appear was decided by the database (the note's own read activity).
 */
export async function MentionedIn({ mentions }: { mentions: readonly Mention[] }) {
  if (mentions.length === 0) return null;
  const { t } = await getT();
  const m = t.residents.tags;
  return (
    <section aria-labelledby="mentioned-in" className="flex flex-col gap-3 rounded-md border border-border p-4">
      <div>
        <h2 id="mentioned-in" className="text-lg font-semibold">
          {m.mentionedIn}
        </h2>
        <p className="text-sm text-muted">{m.mentionedInHint}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {mentions.map((item) => (
          <li key={item.id} className="flex flex-col gap-1 border-t border-border pt-3 first:border-t-0 first:pt-0">
            <p className="whitespace-pre-wrap text-sm">{item.text}</p>
            <p className="text-xs text-muted">
              {[item.label, formatDate(item.when), item.by ? m.writtenBy(item.by) : null].filter(Boolean).join(" · ")}
            </p>
            <Link
              href={`/residents/${item.fromId}`}
              aria-label={m.openResident(item.fromName)}
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
            >
              {m.writtenOn(item.fromName)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
