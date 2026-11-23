import { PRODUCT_FEATURE_SLUGS, PRODUCT_HOME, productFeaturePath } from "@/lib/platform-features";

/**
 * The product site's header nav (#pfive): every subject page, the current one marked, and the way back to the home page.
 * Built from PRODUCT_FEATURE_SLUGS, the same list that drives the routes and robots.txt, so a page added there appears
 * here with no second list to keep in step. Names come from the home page's bands, matched by slug.
 * Plain links only; it reads no table and asks no card.
 */
export function ProductNav({
  bands,
  homeLabel,
  navLabel,
  current,
  th,
}: {
  bands: { slug: string; name: string }[];
  homeLabel: string;
  navLabel: string;
  /** "home" on the home page, else the subject's slug. */
  current: string;
  th: boolean;
}) {
  const prefix = th ? "/th" : "";
  const items = [
    { key: "home", href: `${prefix}${PRODUCT_HOME}`, label: homeLabel },
    ...PRODUCT_FEATURE_SLUGS.map((slug) => ({ key: slug as string, href: productFeaturePath(slug, th), label: bands.find((b) => b.slug === slug)?.name ?? slug })),
  ];
  return (
    <nav aria-label={navLabel} className="border-b border-border bg-surface">
      <ul className="mx-auto flex w-full max-w-6xl flex-wrap gap-x-5 gap-y-1 px-6 py-2 text-sm">
        {items.map((i) => (
          <li key={i.key}>
            <a href={i.href} aria-current={i.key === current ? "page" : undefined} className={i.key === current ? "font-semibold text-primary underline" : "text-foreground hover:text-primary"}>
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
