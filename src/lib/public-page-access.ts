import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { loadSiteContent } from "@/lib/site/content";
import { hiddenPagesOf, isPageHidden, type PublicSection } from "@/lib/public-pages";

/**
 * Whether the viewer may see a hidden page: signed in and able to change Admin → Website, so the
 * Director can check a page before switching it on. Nobody else may.
 */
export async function canSeeHiddenPages(): Promise<boolean> {
  return can(await loadPermissions(), "website.content");
}

/**
 * Called first by every public page that is on the list (and by the pages under one): a hidden
 * page's address shows the normal Not found page, not a "coming soon" one, because a hidden page
 * should not be findable. A website editor passes, and the header shows them the banner.
 */
export async function requirePageVisible(key: PublicSection): Promise<void> {
  const site = await loadSiteContent(await createClient());
  if (!isPageHidden(key, hiddenPagesOf(site?.hidden_public_pages))) return;
  if (await canSeeHiddenPages()) return;
  notFound();
}
