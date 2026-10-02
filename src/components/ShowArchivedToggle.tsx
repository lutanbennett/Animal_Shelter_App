import Link from "next/link";

/**
 * "Show archived" under a record list, as on contacts: a link to the same
 * page with ?archived=1 (so the choice survives a refresh and can be
 * shared), shown only when something is archived. Server-rendered, so it
 * takes the labels.
 */
export function ShowArchivedToggle({
  count,
  shown,
  href,
  labels,
}: {
  count: number;
  shown: boolean;
  href: string;
  labels: { hidden: (n: number) => string; show: string; hide: string };
}) {
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      {!shown && <span>{labels.hidden(count)}</span>}
      <Link href={href} className="font-medium text-primary hover:underline">
        {shown ? labels.hide : labels.show}
      </Link>
    </div>
  );
}
