"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES, WEBSITE_IMAGE_MIME_TYPES } from "@/lib/uploads/limits";
import { getT } from "@/lib/i18n/get-t";
import { isSitePageSlug, type SitePageSlug } from "@/lib/site/pages";
import { parseBahtAmount } from "@/lib/format";
import {
  checkFacebookUrl,
  checkInstagramUrl,
  FACEBOOK_HOSTS,
  INSTAGRAM_HOSTS,
  linkErrorText,
} from "@/lib/links/validate";
import {
  findOrCreateFolder,
  getDriveClient,
  uploadImageToFolder,
} from "@/lib/google/drive";

export type SiteContentFormState = { error: string } | { success: string } | undefined;

/** Every public page reads site_content (the footer), so all of them. */
function revalidateWebsitePages() {
  revalidatePath("/admin/website");
  revalidatePath("/");
  revalidatePath("/adopt");
  revalidatePath("/adopt/[id]", "page");
  revalidatePath("/our-work");
  revalidatePath("/foster");
  revalidatePath("/volunteer");
  revalidatePath("/donate");
}

/**
 * Take a project story off /our-work from the Website admin page. The
 * reverse of the "Show on website" tick on /projects/[id], kept here as a
 * separate admin-only action so an admin can pull something quickly
 * without finding the folder in the tree; the folder itself is untouched
 * and staff can re-publish it from there.
 */
export async function unpublishProject(
  folderId: string,
): Promise<SiteContentFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_folders")
    .update({ is_public: false })
    .eq("id", folderId)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) return { error: error.message };
  if (!data?.length) return { error: t.admin.website.published.notFound };

  revalidateWebsitePages();
  revalidatePath("/our-work");
  revalidatePath(`/our-work/${folderId}`);
  revalidatePath(`/projects/${folderId}`);
  return { success: t.admin.website.published.removed };
}

export async function updateSiteContent(
  _state: SiteContentFormState,
  formData: FormData,
): Promise<SiteContentFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const text = (name: string) => (formData.get(name) as string | null)?.trim() ?? "";
  const optional = (name: string) => text(name) || null;

  // The form checks these as they are typed; this is the same rule again
  // for a request that skipped the form. The database's own check (0080)
  // is looser on purpose — see src/lib/links/validate.ts.
  const s = t.admin.website.settings;
  const facebook = checkFacebookUrl(text("facebook_url"));
  const instagram = checkInstagramUrl(text("instagram_url"));
  if (!facebook.ok) {
    return { error: `${s.facebookUrl}: ${linkErrorText(t.linkErrors, facebook, FACEBOOK_HOSTS)}` };
  }
  if (!instagram.ok) {
    return { error: `${s.instagramUrl}: ${linkErrorText(t.linkErrors, instagram, INSTAGRAM_HOSTS)}` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("site_content")
    .update({
      tagline: text("tagline"),
      tagline_th: optional("tagline_th"),
      hero_alt: text("hero_alt"),
      hero_alt_th: optional("hero_alt_th"),
      visiting_hours: optional("visiting_hours"),
      visiting_hours_th: optional("visiting_hours_th"),
      contact_email: optional("contact_email"),
      contact_address: optional("contact_address"),
      contact_phone: optional("contact_phone"),
      contact_line: optional("contact_line"),
      contact_map_url: optional("contact_map_url"),
      facebook_url: facebook.url,
      instagram_url: instagram.url,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", true);

  if (error) return { error: error.message };

  revalidateWebsitePages();
  return { success: t.common.saved };
}

/**
 * The typical-vet-visit estimate (0071) — the flat figure the cashflow
 * forecast stands in for a booked-but-not-yet-invoiced visit. Its own
 * action rather than a field on updateSiteContent: it is an operational
 * number, not website copy, and only the forecast reads it, so saving it
 * has no reason to revalidate every public page.
 *
 * Blank clears it back to "not priced yet", which the forecast shows as a
 * gap. A zero would read as "vet visits are free".
 */
export async function updateVetVisitEstimate(
  _state: SiteContentFormState,
  formData: FormData,
): Promise<SiteContentFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const estimate = parseBahtAmount(formData.get("vetVisitEstimate") as string | null);
  if (!estimate.ok) return { error: t.admin.website.vetVisit.invalid };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("site_content")
    .update({
      vet_visit_estimate: estimate.value,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", true);

  if (error) return { error: error.message };

  revalidatePath("/admin/website");
  // The forecast page reads this figure (next branch); it is not on any
  // public page, so revalidateWebsitePages() is deliberately not called.
  revalidatePath("/management/cashflow");
  return { success: t.common.saved };
}

/**
 * One of the site's long-form pages (0059). The slug set is fixed by the
 * app; only the words change. The queueing trigger re-queues the page's
 * translations when the title or body changes.
 */
export async function updateSitePage(
  slug: SitePageSlug,
  _state: SiteContentFormState,
  formData: FormData,
): Promise<SiteContentFormState> {
  await assertAdminRole();
  const { t } = await getT();
  if (!isSitePageSlug(slug)) return { error: t.admin.website.pages.unknownPage };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  if (!title) return { error: t.admin.website.pages.titleRequired };

  const { error } = await supabase
    .from("site_pages")
    .update({
      title,
      body: (formData.get("body") as string | null)?.trim() ?? "",
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("slug", slug);

  if (error) return { error: error.message };

  revalidateWebsitePages();
  revalidatePath("/management/translations");
  return { success: t.common.saved };
}

/**
 * Set (or clear, with null) the "Pet of the week" on the home page. The
 * choice is checked against public_resident_profiles so only a resident the
 * public adoption pages already show can be featured — the same rule the
 * home page applies when it renders the card.
 */
export async function setFeaturedResident(
  residentId: string | null,
): Promise<SiteContentFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const supabase = await createClient();

  if (residentId) {
    const { data: visible, error: lookupError } = await supabase
      .from("public_resident_profiles")
      .select("id")
      .eq("id", residentId)
      .limit(1)
      .returns<{ id: string }[]>();
    if (lookupError) return { error: lookupError.message };
    if (!visible?.length) return { error: t.admin.website.featured.notPublic };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("site_content")
    .update({
      featured_resident_id: residentId,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", true);

  if (error) return { error: error.message };

  revalidateWebsitePages();
  return {
    success: residentId
      ? t.admin.website.featured.updated
      : t.admin.website.featured.cleared,
  };
}

async function uploadToWebsiteFolder(file: File) {
  const { t } = await getT();
  if (!WEBSITE_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error(
      t.admin.website.errors.unsupportedFileType(file.type || "unknown"),
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(t.admin.website.errors.fileTooLarge);
  }

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) throw new Error(t.admin.website.errors.driveNotConfigured);

  const drive = getDriveClient();
  const folderId = await findOrCreateFolder(drive, rootId, "Website");
  return uploadImageToFolder(drive, folderId, {
    name: file.name,
    mimeType: file.type,
    content: file,
  });
}

async function deleteFromDrive(fileId: string) {
  try {
    await getDriveClient().deleteFile(fileId);
  } catch {
    // Best-effort — an orphaned Drive file is a minor cleanup issue, not
    // worth failing the user-facing action over (same call this project
    // already makes for resident photos, see residents/[id]/photos/actions.ts).
  }
}

export async function uploadHeroPhoto(
  formData: FormData,
): Promise<SiteContentFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: t.admin.website.errors.noFile };
  }

  let driveFileId: string;
  try {
    driveFileId = await uploadToWebsiteFolder(file);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : t.admin.website.errors.uploadFailed,
    };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("site_content")
    .select("hero_drive_file_id")
    .eq("id", true)
    .limit(1)
    .returns<{ hero_drive_file_id: string | null }[]>();

  const { error } = await supabase
    .from("site_content")
    .update({ hero_drive_file_id: driveFileId })
    .eq("id", true);

  if (error) return { error: error.message };

  const previousFileId = current?.[0]?.hero_drive_file_id;
  if (previousFileId) await deleteFromDrive(previousFileId);

  revalidateWebsitePages();
  return { success: t.admin.website.hero.updated };
}

export async function removeHeroPhoto() {
  await assertAdminRole();

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("site_content")
    .select("hero_drive_file_id")
    .eq("id", true)
    .limit(1)
    .returns<{ hero_drive_file_id: string | null }[]>();

  const { error } = await supabase
    .from("site_content")
    .update({ hero_drive_file_id: null })
    .eq("id", true);

  if (error) throw new Error(error.message);

  const previousFileId = current?.[0]?.hero_drive_file_id;
  if (previousFileId) await deleteFromDrive(previousFileId);

  revalidateWebsitePages();
}

export async function uploadGalleryPhoto(
  formData: FormData,
): Promise<SiteContentFormState> {
  await assertAdminRole();
  const { t } = await getT();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: t.admin.website.errors.noFile };
  }

  let driveFileId: string;
  try {
    driveFileId = await uploadToWebsiteFolder(file);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : t.admin.website.errors.uploadFailed,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: maxRow } = await supabase
    .from("site_content_photos")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .returns<{ sort_order: number }[]>();

  const nextSortOrder = (maxRow?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("site_content_photos").insert({
    drive_file_id: driveFileId,
    sort_order: nextSortOrder,
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidateWebsitePages();
  return { success: t.admin.website.gallery.photoAdded };
}

export async function deleteGalleryPhoto(photoId: string) {
  await assertAdminRole();

  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("site_content_photos")
    .select("drive_file_id")
    .eq("id", photoId)
    .limit(1)
    .returns<{ drive_file_id: string }[]>();

  const { error } = await supabase
    .from("site_content_photos")
    .delete()
    .eq("id", photoId);

  if (error) throw new Error(error.message);

  const driveFileId = photo?.[0]?.drive_file_id;
  if (driveFileId) await deleteFromDrive(driveFileId);

  revalidateWebsitePages();
}

export async function moveGalleryPhoto(
  photoId: string,
  direction: "up" | "down",
) {
  await assertAdminRole();

  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("site_content_photos")
    .select("id, sort_order")
    .order("sort_order", { ascending: true })
    .returns<{ id: string; sort_order: number }[]>();

  if (!photos) return;

  const index = photos.findIndex((p) => p.id === photoId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= photos.length) return;

  const a = photos[index];
  const b = photos[swapWith];

  const [{ error: errorA }, { error: errorB }] = await Promise.all([
    supabase
      .from("site_content_photos")
      .update({ sort_order: b.sort_order })
      .eq("id", a.id),
    supabase
      .from("site_content_photos")
      .update({ sort_order: a.sort_order })
      .eq("id", b.id),
  ]);

  if (errorA || errorB) {
    const { t } = await getT();
    throw new Error(errorA?.message ?? errorB?.message ?? t.common.failedToReorder);
  }

  revalidateWebsitePages();
}
