import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { hasPublicShopLinks } from "@/lib/shop/shop-links";

/**
 * A line under the ways to give that points at /shop (0285), drawn only once the page has an
 * entry to show: a link to an empty page is worse than none.
 */
export async function ShopMention() {
  const supabase = await createClient();
  if (!(await hasPublicShopLinks(supabase))) return null;
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
