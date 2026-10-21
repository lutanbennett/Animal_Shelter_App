import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { giftSplit, loadSiteContent } from "@/lib/site/content";

/** "Where your gift goes" (0237): four lines and the year, from Settings → Website. */
export async function GiftSplit() {
  const { t } = await getT();
  const split = giftSplit(await loadSiteContent(await createClient()));
  if (!split) return null;
  const g = t.trustBlock;
  const rows = [
    [g.food, split.food],
    [g.vet, split.vet],
    [g.sterilisation, split.sterilisation],
    [g.running, split.running],
  ] as const;
  const show = (n: number) =>
    split.unit === "percent" ? `${n.toLocaleString("en-US")}%` : `฿${n.toLocaleString("en-US")}`;
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display text-2xl font-bold text-site-ink">{g.giftHeading}</h2>
      <p className="text-sm text-muted">{g.giftYear.replace("{year}", String(split.year))}</p>
      <dl className="flex flex-col gap-1.5">
        {rows.map(([label, n]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-border py-1.5 last:border-0">
            <dt>{label}</dt>
            <dd className="font-semibold tabular-nums">{show(n)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
