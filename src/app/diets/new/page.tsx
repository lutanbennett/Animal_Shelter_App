import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadDietTypeOptions } from "@/lib/diets/options";
import { DietForm } from "../DietForm";
import { loadDietResident } from "../resident";

/** Reached from the resident's Diet tab or the hub's Diet card. */
export default async function NewDietPage(props: PageProps<"/diets/new">) {
  const searchParams = await props.searchParams;
  const { t } = await getT();

  const residentId = searchParams.residentId;
  if (typeof residentId !== "string" || !residentId) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.diets.pageTitle}</h1>
        <p className="text-sm text-muted">{t.diets.noResidentSelected}</p>
        <Link href="/residents" className="text-sm font-medium text-primary hover:underline">
          {t.residents.hub.backToResidents}
        </Link>
      </main>
    );
  }

  const supabase = await createClient();
  const [resident, dietTypes] = await Promise.all([
    loadDietResident(supabase, residentId),
    loadDietTypeOptions(supabase),
  ]);

  if (!resident) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.diets.pageTitle}</h1>
        <p className="text-sm text-danger">{t.diets.residentNotFound}</p>
      </main>
    );
  }

  const tabHref = `/residents/${residentId}/diet`;

  // The database would reject the insert anyway (0026 lock); say so up
  // front rather than after the form is filled in.
  if (resident.isDeceased) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.diets.pageTitle}</h1>
        <p className="text-sm text-muted">{t.residents.deceased.recordClosed}</p>
        <Link href={`/residents/${residentId}`} className="text-sm font-medium text-primary hover:underline">
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
        <h1 className="text-2xl font-semibold text-foreground">{t.diets.pageTitle}</h1>
        <p className="text-sm text-muted">{t.diets.pageSubtitle}</p>
      </div>

      {dietTypes.error && (
        <p className="text-sm text-danger">
          {t.diets.couldntLoadDietTypes}: {dietTypes.error.message}
        </p>
      )}

      <DietForm
        residentId={residentId}
        residentDisplayName={resident.displayName}
        residentSize={resident.size}
        dietTypes={dietTypes.data ?? []}
        cancelHref={tabHref}
      />
    </main>
  );
}
