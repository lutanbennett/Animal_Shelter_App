import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";

/**
 * The merchandise shop, staff side (0369). Gated on merch.manage, the activity its card (run_merch_shop) carries.
 * A heading only: the route has to exist for the card to open; the screens are the shop-staff stream's (docs/merch-shop.md).
 */
export default async function MerchShopPage() {
  await requirePermission("merch.manage", "read");
  const { t } = await getT();
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-foreground">{t.nav.merchShop}</h1>
    </main>
  );
}
