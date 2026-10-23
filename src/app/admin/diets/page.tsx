import Link from "next/link";
import { Boxes } from "lucide-react";
import { ActionLink } from "@/components/ActionLink";
import { getT } from "@/lib/i18n/get-t";
import { dietUnitLabel } from "@/lib/i18n/enum-labels";
import { refuseFor } from "@/lib/auth/require-role";
import { canEditItemSettings } from "@/lib/permissions/item-settings";
import { requirePermission } from "@/lib/permissions/require";
import { amountText, loadRecipeBook } from "@/lib/diets/recipe-book";
import { dayAmount } from "@/lib/diets/servings";
import { AddDietButton } from "./AddButtons";
import { DietTabs } from "./DietTabs";

/**
 * Settings → Diets, the recipe book: a card for each diet (a recipe of ingredients, 0239). Tap a
 * card for that diet's own page. The ingredients themselves are on the other tab. Split from one
 * long page on 2026-10-22 (docs/decisions/2026-10-22-diets-recipe-book.md); the stock half, with
 * cost, counts and the food forecast, is /management/diets.
 *
 * Admin only (item-settings.ts). Built for a phone first: the Director opens it there.
 */
export default async function DietSettingsPage() {
  const { supabase, perms } = await requirePermission("reference.types");
  if (!canEditItemSettings(perms, "diet")) refuseFor(perms);
  const { t } = await getT();
  const book = await loadRecipeBook(supabase);

  const s = t.admin.diets;
  const byId = new Map(book.ingredients.map((i) => [i.id, i]));
  const standard = book.recipes.some((r) => r.isStandard);

  return (
    <main className="flex flex-1 flex-col gap-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
        <p className="text-sm text-muted">{s.subtitle}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionLink href="/management/diets" label={s.stockLink} icon={Boxes} iconOnlyOnMobile={false} />
        </div>
      </div>

      <DietTabs active="diets" />

      {book.error && <p className="text-sm text-danger">{t.management.diets.couldntLoad}: {book.error}</p>}
      {!standard && book.recipes.length > 0 && (
        <p className="rounded border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">{s.recipes.noStandard}</p>
      )}

      <div>
        <AddDietButton />
      </div>

      {book.recipes.length === 0 && <p className="text-sm text-muted">{s.recipes.none}</p>}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {book.recipes.map((recipe) => {
          const serve = recipe.lines
            .map((line) => {
              const ingredient = byId.get(line.ingredientId);
              if (!ingredient) return null;
              return `${amountText(dayAmount(line.qtyPerServing, recipe.servings, "Medium"), line.servingUnit, dietUnitLabel(t, ingredient.unit))} ${ingredient.name}`;
            })
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={recipe.id}>
              <Link
                href={`/admin/diets/${recipe.id}`}
                className="flex h-full flex-col gap-2 rounded border border-border bg-surface p-4 hover:border-primary"
              >
                <span className="flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
                  {recipe.name}
                  {recipe.isStandard && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium">
                      <span aria-hidden>★</span>
                      {t.management.diets.standard.badge}
                    </span>
                  )}
                </span>
                {recipe.nameTh && (
                  <span lang="th" className="text-sm text-foreground">
                    {recipe.nameTh}
                  </span>
                )}
                <span className="text-sm text-foreground">
                  {serve ? (
                    <>
                      <span className="text-muted">{s.book.cardServe} </span>
                      {serve}
                    </>
                  ) : (
                    <span className="text-warning">{s.book.cardNoIngredients}</span>
                  )}
                </span>
                <span className="mt-auto text-xs text-muted">{s.book.cardResidents(recipe.residentsNow)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
