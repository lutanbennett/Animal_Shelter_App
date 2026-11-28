import { PRODUCT_COOPER, PRODUCT_COOPER_PAGE, PRODUCT_FEATURE_SLUGS, PRODUCT_HOME, productFeaturePath } from "@/lib/platform-features";
import { createClient } from "@/lib/supabase/server";
import { loadProductPage, productText } from "@/lib/site/product-content";
import { cooperHasContent } from "@/lib/site/cooper-page";
import { ProductMenu } from "./ProductMenu";

/**
 * The product site's header nav (#pfive, mega menu since #pmega): a disclosure holding every subject page with a line about each,
 * and, beside them, the pages that are not features (the overview, and Cooper's page once it has words).
 * Built from PRODUCT_FEATURE_SLUGS, the same list that drives the routes and robots.txt, so a page added there appears
 * here with no second list to keep in step. Names and lines come from the home page's bands, matched by slug.
 * Every link is in the HTML: the panel is a native <details>, so it opens with JavaScript off and search engines read it.
 * Cooper's entry is drawn only when cooperHasContent() is true, so the menu never offers a link to a not-found page.
 * Plain links only; it reads no table but the product page rows and asks no card.
 */
export async function ProductNav({
  bands,
  homeLabel,
  navLabel,
  menuButton,
  menuFeatures,
  menuAbout,
  current,
  th,
}: {
  bands: { slug: string; name: string; text: string }[];
  homeLabel: string;
  navLabel: string;
  menuButton: string;
  menuFeatures: string;
  menuAbout: string;
  /** "home" on the home page, "cooper" on Cooper's page, else the subject's slug. */
  current: string;
  th: boolean;
}) {
  const prefix = th ? "/th" : "";
  const cooper = await loadProductPage(await createClient(), PRODUCT_COOPER_PAGE);
  const cooperLabel = cooperHasContent(cooper) ? productText(cooper, "heading", th ? "th" : "en", "") : null;
  const features = PRODUCT_FEATURE_SLUGS.map((slug) => {
    const band = bands.find((b) => b.slug === slug);
    return { key: slug as string, href: productFeaturePath(slug, th), label: band?.name ?? slug, text: band?.text ?? "" };
  });
  const about = [
    { key: "home", href: `${prefix}${PRODUCT_HOME}`, label: homeLabel },
    ...(cooperLabel ? [{ key: "cooper", href: `${prefix}${PRODUCT_COOPER}`, label: cooperLabel }] : []),
  ];
  const mark = (key: string) => (key === current ? "page" : undefined);
  const linkClass = (key: string) => (key === current ? "font-semibold text-primary underline" : "font-medium text-foreground hover:text-primary");
  return (
    <nav aria-label={navLabel} className="relative border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-6 py-2 text-sm">
        <a href={about[0].href} aria-current={mark("home")} className={linkClass("home")}>
          {homeLabel}
        </a>
        <ProductMenu label={menuButton}>
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{menuFeatures}</h2>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {features.map((f) => (
                  <li key={f.key}>
                    <a href={f.href} aria-current={mark(f.key)} className="block rounded p-2 hover:bg-background focus:bg-background">
                      <span className={linkClass(f.key)}>{f.label}</span>
                      {f.text && <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{f.text}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{menuAbout}</h2>
              <ul className="mt-2 grid gap-1">
                {about.map((i) => (
                  <li key={i.key}>
                    <a href={i.href} aria-current={mark(i.key)} className={`block rounded p-2 hover:bg-background focus:bg-background ${linkClass(i.key)}`}>
                      {i.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </ProductMenu>
      </div>
    </nav>
  );
}
