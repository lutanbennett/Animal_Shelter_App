import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { refuseFor } from "@/lib/auth/require-role";
import { canEditItemSettings } from "@/lib/permissions/item-settings";
import { requirePermission } from "@/lib/permissions/require";
import { loadRecipeBook } from "@/lib/diets/recipe-book";
import { RecipeDetail } from "../RecipeDetail";

/** One diet's recipe page: its ingredients, amounts and total daily serve, with Standard, rename and delete. */
export default async function RecipePage(props: PageProps<"/admin/diets/[id]">) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("reference.types");
  if (!canEditItemSettings(perms, "diet")) refuseFor(perms);
  const { t } = await getT();
  const book = await loadRecipeBook(supabase);
  const recipe = book.recipes.find((r) => r.id === id);
  if (!recipe) notFound();
  const standardName = book.recipes.find((r) => r.isStandard)?.name ?? null;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <BackLink href="/admin/diets">{t.admin.diets.book.back}</BackLink>
      {book.error && <p className="text-sm text-danger">{t.management.diets.couldntLoad}: {book.error}</p>}
      <RecipeDetail recipe={recipe} ingredients={book.ingredients} standardName={standardName} />
    </main>
  );
}
