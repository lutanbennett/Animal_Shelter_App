import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadDietTypeOptions } from "@/lib/diets/options";
import { DietForm, type DietInitial } from "../../DietForm";
import { loadDietResident } from "../../resident";

/** Reached from a row's Edit link on the resident's Diet tab. */
export default async function EditDietPage(props: PageProps<"/diets/[id]/edit">) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("resident_diets")
    .select("id, resident_id, diet_type_id, start_date, end_date, meals_per_day, daily_quantity, notes")
    .eq("id", id)
    .limit(1)
    .returns<(DietInitial & { resident_id: string })[]>();
  if (error) throw new Error(error.message);
  const diet = rows?.[0];
  if (!diet) notFound();

  const [resident, dietTypes] = await Promise.all([
    loadDietResident(supabase, diet.resident_id),
    loadDietTypeOptions(supabase),
  ]);
  if (!resident) notFound();

  const tabHref = `/residents/${diet.resident_id}/diet`;

  if (resident.isDeceased) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.diets.editPageTitle}</h1>
        <p className="text-sm text-muted">{t.residents.deceased.recordClosed}</p>
        <Link href={tabHref} className="text-sm font-medium text-primary hover:underline">
          {t.residents.sections.backTo(resident.displayName)}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link href={tabHref} className="text-sm text-muted hover:text-foreground">
        {t.residents.sections.backTo(resident.displayName)}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.diets.editPageTitle}</h1>
        <p className="text-sm text-muted">{t.diets.editPageSubtitle}</p>
      </div>

      {dietTypes.error && (
        <p className="text-sm text-danger">
          {t.diets.couldntLoadDietTypes}: {dietTypes.error.message}
        </p>
      )}

      <DietForm
        mode="edit"
        residentId={diet.resident_id}
        residentDisplayName={resident.displayName}
        residentSize={resident.size}
        dietTypes={dietTypes.data ?? []}
        initial={diet}
        cancelHref={tabHref}
      />
    </main>
  );
}
