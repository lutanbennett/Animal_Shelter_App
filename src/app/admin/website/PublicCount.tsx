/**
 * "N animals in care, M public": the gap between the two is the work left for whoever is publishing.
 * Drawn only where the login may read residents (page.tsx asks resident.record at read, the activity the
 * residents table's own read rule asks, 0249), and nothing at all where it may not.
 */
export function PublicCount({
  inCare,
  isPublic,
  labels,
}: {
  inCare: number;
  isPublic: number;
  labels: { heading: string; subtitle: string; inCare: string; public: string; gap: string };
}) {
  const gap = Math.max(inCare - isPublic, 0);
  return (
    <section className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{labels.heading}</h2>
        <p className="text-sm text-muted">{labels.subtitle}</p>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted">{labels.inCare}</dt>
          <dd className="text-2xl font-semibold text-foreground">{inCare}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{labels.public}</dt>
          <dd className="text-2xl font-semibold text-foreground">{isPublic}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{labels.gap}</dt>
          <dd className="text-2xl font-semibold text-foreground">{gap}</dd>
        </div>
      </dl>
    </section>
  );
}
