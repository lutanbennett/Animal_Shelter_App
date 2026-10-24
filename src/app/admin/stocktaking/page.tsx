import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { TWO_STEP_PATH, hasTwoStep } from "@/lib/auth/two-step";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { loadStocktakingSwitches } from "@/lib/management/stocktaking-switches";
import { StocktakingSwitches } from "./StocktakingSwitches";

/**
 * Settings → Stocktaking: the two ON/OFF switches (food; medicines and vaccines), 0254.
 * Admin only and at 2-step, like Security: an Admin rule rather than an activity, and the
 * database refuses anyone else (site_content_stocktaking_guard). Both default ON.
 */
export default async function StocktakingSettingsPage() {
  await requireAdminUser();
  if (!(await hasTwoStep())) redirect(TWO_STEP_PATH);
  const { t } = await getT();
  const switches = await loadStocktakingSwitches(await createClient());

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.admin.stocktaking.title}</h1>
        <p className="text-sm text-muted">{t.admin.stocktaking.subtitle}</p>
      </div>
      <StocktakingSwitches switches={switches} />
    </main>
  );
}
