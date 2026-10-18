import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { can } from "@/lib/permissions/can";
import { loadMemes, tagsInUse } from "@/lib/memes/queries";
import { MemeLibrary } from "./MemeLibrary";

/**
 * The meme library (0223): every meme that is not archived, newest first, with where each has been posted. Opens at
 * social.library Read; Add a meme shows at Edit. Never public: the images come through the photo route, which asks
 * the memes table as the caller. docs/decisions/2026-10-18-meme-library-app.md.
 */
export default async function MemesPage() {
  const { supabase, perms } = await requirePermission("social.library", "read");
  const { t } = await getT();
  const { memes, error } = await loadMemes(supabase);
  if (error) throw new Error(`Meme library: could not read the memes: ${error}`);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t.memes.title}</h1>
          <p className="text-base text-muted">{t.memes.intro}</p>
        </div>
        {can(perms, "social.library") && (
          <ActionLink href="/memes/new" label={t.memes.add} icon={ACTION_ICONS.add} variant="primary" iconOnlyOnMobile={false} />
        )}
      </div>
      <MemeLibrary
        memes={memes.map(({ id, drive_file_id, title, caption_en, caption_th, tags, residents, platforms }) => ({
          id,
          drive_file_id,
          title,
          caption_en,
          caption_th,
          tags,
          residents,
          platforms,
        }))}
        tags={tagsInUse(memes)}
      />
    </main>
  );
}
