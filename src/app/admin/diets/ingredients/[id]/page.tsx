import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { refuseFor } from "@/lib/auth/require-role";
import { canEditItemSettings } from "@/lib/permissions/item-settings";
import { requirePermission } from "@/lib/permissions/require";
import { loadRecipeBook } from "@/lib/diets/recipe-book";
import { IngredientDetail, type UsedBy } from "../../IngredientDetail";

/** One ingredient's page: its details, the ways it is measured (a cup, a bag…), and the diets that use it. */
export default async function IngredientPage(props: PageProps<"/admin/diets/ingredients/[id]">) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("reference.types");
  if (!canEditItemSettings(perms, "diet")) refuseFor(perms);
  const { t } = await getT();
  const book = await loadRecipeBook(supabase);
  const ingredient = book.ingredients.find((i) => i.id === id);
  if (!ingredient) notFound();

  const usedBy: UsedBy[] = [];
  for (const recipe of book.recipes) {
    const line = recipe.lines.find((l) => l.ingredientId === id);
    if (line) usedBy.push({ dietId: recipe.id, dietName: recipe.name, line });
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <BackLink href="/admin/diets/ingredients">{t.admin.diets.ingredientBook.back}</BackLink>
      {book.error && <p className="text-sm text-danger">{t.management.diets.couldntLoad}: {book.error}</p>}
      <IngredientDetail ingredient={ingredient} usedBy={usedBy} records={book.recordsByIngredient.get(id) ?? 0} />
    </main>
  );
}
