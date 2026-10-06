import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadTranslationQueue } from "@/lib/translations/queries";
import { TranslationQueue } from "./TranslationQueue";
import { requirePermission } from "@/lib/permissions/require";

/**
 * Management → Translations: every public-facing text whose other-language
 * version a manager still has to write or check. The triggers in 0056 put
 * rows here; approving one (in place here, or on the record's own page)
 * takes it out. `?all=1` shows the approved ones too, for correcting a
 * translation that is live.
 */
export default async function TranslationsPage(
  props: PageProps<"/management/translations">,
) {
  await requirePermission("translations.manage");
  const { t } = await getT();
  const searchParams = await props.searchParams;
  const includeApproved = searchParams.all === "1";

  const supabase = await createClient();
  const { rows, error } = await loadTranslationQueue(supabase, { includeApproved });

  // Titles are labels, so they stay a paired column (name_th) rather than
  // joining the prose queue; a note here points at the ones still missing.
  const { data: untitled } = await supabase
    .from("project_folders")
    .select("id, name, name_th")
    .eq("is_public", true)
    .not("parent_folder_id", "is", null)
    .order("name")
    .returns<{ id: string; name: string; name_th: string | null }[]>();
  const missingTitles = (untitled ?? []).filter((p) => !p.name_th?.trim());

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.translations.title}
        </h1>
        <p className="max-w-3xl text-sm text-muted">{t.translations.subtitle}</p>
      </div>

      {error && (
        <p className="text-sm text-danger">
          {t.translations.couldntLoad}: {error}
        </p>
      )}

      {missingTitles.length > 0 && (
        <div className="max-w-3xl rounded border border-border bg-surface p-4 text-sm text-foreground">
          <p>{t.translations.titlesMissing(missingTitles.length)}</p>
          <ul className="mt-2 flex flex-col gap-1">
            {missingTitles.map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="font-medium text-primary hover:underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <TranslationQueue rows={rows} includeApproved={includeApproved} />
    </main>
  );
}
