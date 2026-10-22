import Link from "next/link";
import { Boxes } from "lucide-react";
import { ActionLink } from "@/components/ActionLink";
import { getT } from "@/lib/i18n/get-t";
import { dietUnitLabel } from "@/lib/i18n/enum-labels";
import { refuseFor } from "@/lib/auth/require-role";
import { canEditItemSettings } from "@/lib/permissions/item-settings";
import { requirePermission } from "@/lib/permissions/require";
import { loadRecipeBook } from "@/lib/diets/recipe-book";
import { AddIngredientButton } from "../AddButtons";
import { DietTabs } from "../DietTabs";

/** Settings → Diets, the ingredients tab: what is bought and counted. Tap one for its own page. */
export default async function IngredientsPage() {
  const { supabase, perms } = await requirePermission("reference.types");
  if (!canEditItemSettings(perms, "diet")) refuseFor(perms);
  const { t } = await getT();
  const book = await loadRecipeBook(supabase);
  const s = t.admin.diets;

  const dietsUsing = new Map<string, number>();
  for (const recipe of book.recipes) {
    for (const line of recipe.lines) dietsUsing.set(line.ingredientId, (dietsUsing.get(line.ingredientId) ?? 0) + 1);
  }

  return (
    <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
        <p className="text-sm text-muted">{s.ingredientsSubtitle}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionLink href="/management/diets" label={s.stockLink} icon={Boxes} iconOnlyOnMobile={false} />
        </div>
      </div>

      <DietTabs active="ingredients" />

      {book.error && <p className="text-sm text-danger">{t.management.diets.couldntLoad}: {book.error}</p>}

      <div>
        <AddIngredientButton />
      </div>

      {book.ingredients.length === 0 && <p className="text-sm text-muted">{s.ingredientBook.none}</p>}
      <ul className="flex flex-col divide-y divide-border rounded border border-border bg-surface">
        {book.ingredients.map((ingredient) => (
          <li key={ingredient.id}>
            <Link
              href={`/admin/diets/ingredients/${ingredient.id}`}
              className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface-hover"
            >
              <span className="flex flex-col">
                <span className="font-medium text-foreground">{ingredient.name}</span>
                {ingredient.nameTh && (
                  <span lang="th" className="text-sm text-foreground">
                    {ingredient.nameTh}
                  </span>
                )}
              </span>
              <span className="flex flex-col items-end text-xs text-muted">
                <span>{s.ingredientBook.boughtBy(dietUnitLabel(t, ingredient.unit).replace("(s)", ""))}</span>
                <span>{s.ingredientBook.usedIn(dietsUsing.get(ingredient.id) ?? 0)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
