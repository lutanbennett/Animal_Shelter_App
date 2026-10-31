import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadSiteContent } from "@/lib/site/content";
import { SITE_PAGE_PATHS, isPagePhotoSlug, isSitePageSlug } from "@/lib/site/pages";
import en from "@/lib/i18n/dictionaries/en";
import { sitePageStarter } from "@/lib/site/starter";
import { loadTranslations, translationKey } from "@/lib/translations/queries";
import { requirePermission } from "@/lib/permissions/require";
import { can } from "@/lib/permissions/can";
import { hasPublicFriends } from "@/lib/shelter-friends/public";
import { SitePageForm, type SitePageRow } from "../../SitePageForm";
import { PagePhotoCard } from "../../PagePhotoCard";
import { pickPreviewContact, pagePhotoOf } from "../../preview-context";
import { PageEditPanel } from "./PageEditPanel";

/**
 * One public page's wording, on a page of its own (Settings → Website → Pages → Edit).
 * It replaces the popup the Pages tab used to open: the standard admin frame, a Back
 * link, and — for the four pages that take one — the photo beside the heading, which
 * used to sit in a separate list on the tab above the editor.
 *
 * Reading needs website.content at read, as the tab does. Every control here asks
 * website.content at the level its own action asks: updateSitePage, uploadPagePhoto,
 * removePagePhoto and savePagePhotoAlt all ask `website.content` (actions.ts), and the
 * translation panels ask translations.manage, which is their own save's activity.
 */
export default async function SitePageEditPage(props: PageProps<"/admin/website/pages/[slug]">) {
  const { slug } = await props.params;
  const { perms } = await requirePermission("website.content", "read");
  const canContent = can(perms, "website.content");
  const canTranslations = can(perms, "translations.manage");
  const { t } = await getT();
  const p = t.admin.website.pages;

  if (!isSitePageSlug(slug)) notFound();

  const supabase = await createClient();
  const [content, pageResult] = await Promise.all([
    loadSiteContent(supabase),
    supabase
      .from("site_pages")
      .select("id, slug, title, body, updated_at")
      .eq("slug", slug)
      .limit(1)
      .returns<SitePageRow[]>(),
  ]);

  // An editor that shows an empty box on a failed read invites the admin to re-type what is
  // already saved, so a failed read stops the page (docs/decisions/2026-10-11-silent-empty-reads.md).
  if (pageResult.error) {
    throw new Error(`Website admin: could not read page ${slug}: ${pageResult.error.message}`);
  }
  const page = pageResult.data?.[0];
  if (!page) notFound();
  if (!content) {
    return (
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <p className="text-sm text-danger">{t.admin.website.couldntLoad}</p>
      </main>
    );
  }

  const translations = await loadTranslations(supabase, "site_pages", [page.id]);
  const tr = [
    translations.get(translationKey(page.id, "title")),
    translations.get(translationKey(page.id, "body")),
  ];
  // The preview shows the Shelter Friends mention on Donate only once there are friends, as
  // the public page does.
  const friendsPublic = await hasPublicFriends();
  const label = p.slugs[page.slug] ?? page.slug;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <PageEditPanel
        backHref="/admin/website?tab=pages"
        photo={
          isPagePhotoSlug(page.slug) ? (
            <PagePhotoCard
              page={page.slug}
              photo={{
                fileId: content[`${page.slug}_photo_drive_file_id`],
                alt: content[`${page.slug}_photo_alt`],
                altTh: content[`${page.slug}_photo_alt_th`],
              }}
              canEdit={canContent}
            />
          ) : undefined
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-foreground">{p.editTitle(label)}</h1>
            <p className="text-sm text-muted">{p.subtitle}</p>
            <Link
              href={SITE_PAGE_PATHS[page.slug]}
              target="_blank"
              className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline"
            >
              {t.admin.website.published.view}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          <SitePageForm
            page={page}
            translations={{ title: tr[0], body: tr[1] }}
            // The panels save through approveTranslation, which asks translations.manage.
            canManageTranslations={canTranslations}
            canEdit={canContent}
            // In English whatever language the admin reads the app in: pages are written in
            // English and translated through the queue.
            starterBody={sitePageStarter(en, page.slug)?.body}
            previewContext={{
              contact: pickPreviewContact(content),
              photo: pagePhotoOf(content, page.slug),
              showFriends: page.slug === "donate" && friendsPublic,
              thai:
                tr[0]?.text?.trim() || tr[1]?.text?.trim()
                  ? { title: tr[0]?.text?.trim() ?? "", body: tr[1]?.text?.trim() ?? "" }
                  : null,
            }}
          />
        </div>
      </PageEditPanel>
    </main>
  );
}
