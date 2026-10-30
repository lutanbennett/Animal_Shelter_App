import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { hiddenPagesOf, isPageHidden } from "@/lib/public-pages";
import { loadSiteContent } from "@/lib/site/content";
import { hasPublicShopLinks } from "@/lib/shop/shop-links";

/**
 * A line under the ways to give that points at /shop (0285), drawn only once the page has an
 * entry to show and while it is not hidden (Admin → Website): a link to an empty or Not found page
 * is worse than none.
 */
export async function ShopMention() {
  const supabase = await createClient();
  const [site, hasLinks] = await Promise.all([loadSiteContent(supabase), hasPublicShopLinks(supabase)]);
  if (!hasLinks || isPageHidden("shop", hiddenPagesOf(site?.hidden_public_pages))) return null;
  const { t } = await getT();
  return (
    <p className="text-sm text-site-ink-soft">
      {t.shop.donateLine}{" "}
      <Link href="/shop" className="inline-flex min-h-11 items-center font-medium text-primary hover:underline md:min-h-9">
        {t.shop.donateLink} &rarr;
      </Link>
    </p>
  );
}
