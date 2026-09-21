import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadTranslationQueue } from "@/lib/translations/queries";
import { TranslationQueue } from "./TranslationQueue";

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
  await requireManagementUser();
  const { t } = await getT();
  const searchParams = await props.searchParams;
  const includeApproved = searchParams.all === "1";

  const supabase = await createClient();
  const { rows, error } = await loadTranslationQueue(supabase, { includeApproved });

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

      <TranslationQueue rows={rows} includeApproved={includeApproved} />
    </main>
  );
}
