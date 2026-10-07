"use server";

import { revalidatePath } from "next/cache";
import {
  runAction,
  type ActionRefusal,
  type ActionResult,
} from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES, WEBSITE_IMAGE_MIME_TYPES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { getT } from "@/lib/i18n/get-t";
import { isContactChannel } from "@/lib/site/channels";
import { isSitePageSlug, type SitePageSlug } from "@/lib/site/pages";
import { parseBahtAmount, todayIso } from "@/lib/format";
import {
  checkFacebookUrl,
  checkHttpsUrl,
  checkInstagramUrl,
  checkMessengerUrl,
  checkWhatsAppNumber,
  checkXUrl,
  FACEBOOK_HOSTS,
  INSTAGRAM_HOSTS,
  linkErrorText,
  MESSENGER_HOSTS,
  X_HOSTS,
} from "@/lib/links/validate";
import {
  confirmUploaded,
  findOrCreateFolder,
  getDriveClient,
  uploadImageToFolder,
} from "@/lib/google/drive";
import { driveErrorMessage } from "@/lib/google/drive-errors";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

export type SiteContentFormState = ActionResult<{ success: string }> | undefined;

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

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
  revalidatePath("/adopt/international");
  revalidatePath("/friends/join");
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
): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  return runAction("website.unpublishProject", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("project_folders")
      .update({ is_public: false })
      .eq("id", folderId)
      .select("id")
      .returns<{ id: string }[]>();

    if (error) return refuse(error.message);
    if (!data?.length) return refuse(t.admin.website.published.notFound);

    revalidateWebsitePages();
    revalidatePath("/our-work");
    revalidatePath(`/our-work/${folderId}`);
    revalidatePath(`/projects/${folderId}`);
    return { ok: true, success: t.admin.website.published.removed };
  });
}

export async function updateSiteContent(
  _state: SiteContentFormState,
  formData: FormData,
): Promise<SiteContentFormState> {
  const { t } = await getT();
  return runAction("website.updateSiteContent", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);

    const text = (name: string) => (formData.get(name) as string | null)?.trim() ?? "";
    const optional = (name: string) => text(name) || null;

    // The form checks these as they are typed; this is the same rule again
    // for a request that skipped the form. The database's own check (0080)
    // is looser on purpose — see src/lib/links/validate.ts. The WhatsApp
    // check also turns "+66 81 234 5678" into the digits 0092 stores.
    const s = t.admin.website.settings;
    const links = [
      ["facebook_url", s.facebookUrl, checkFacebookUrl, FACEBOOK_HOSTS],
      ["instagram_url", s.instagramUrl, checkInstagramUrl, INSTAGRAM_HOSTS],
      ["x_url", s.xUrl, checkXUrl, X_HOSTS],
      ["messenger_url", s.messengerUrl, checkMessengerUrl, MESSENGER_HOSTS],
      // Any https host: maps.app.goo.gl and google.com/maps both appear.
      ["contact_map_url", s.contactMapUrl, (v: string) => checkHttpsUrl(v), undefined],
    ] as const;
    const checked: Record<string, string | null> = {};
    for (const [name, label, check, hosts] of links) {
      const result = check(text(name));
      if (!result.ok) return refuse(`${label}: ${linkErrorText(t.linkErrors, result, hosts)}`);
      checked[name] = result.url;
    }
    const whatsapp = checkWhatsAppNumber(text("whatsapp_number"));
    if (!whatsapp.ok) return refuse(`${s.whatsappNumber}: ${t.linkErrors.whatsappNumber}`);

    // The picker's whole order, comma-separated. Unknown names are dropped
    // and repeats collapsed; whether a channel has a value is not checked
    // here, so clearing a link never makes this save fail (0111).
    const preferred = [
      ...new Set(text("preferred_channels").split(",").map((c) => c.trim()).filter(isContactChannel)),
    ];

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
        preferred_channels: preferred,
        ...checked,
        whatsapp_number: whatsapp.number,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      })
      .eq("id", true);

    if (error) return refuse(error.message);

    revalidateWebsitePages();
    return { ok: true, success: t.common.saved };
  });
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
  const { t } = await getT();
  return runAction("website.updateVetVisitEstimate", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);

    const estimate = parseBahtAmount(formData.get("vetVisitEstimate") as string | null);
    if (!estimate.ok) return refuse(t.admin.website.vetVisit.invalid);

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

    if (error) return refuse(error.message);

    revalidatePath("/admin/website");
    // The forecast page reads this figure (next branch); it is not on any
    // public page, so revalidateWebsitePages() is deliberately not called.
    revalidatePath("/management/cashflow");
    return { ok: true, success: t.common.saved };
  });
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
  const { t } = await getT();
  return runAction("website.updateSitePage", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);
    if (!isSitePageSlug(slug)) return refuse(t.admin.website.pages.unknownPage);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const title = (formData.get("title") as string | null)?.trim() ?? "";
    if (!title) return refuse(t.admin.website.pages.titleRequired);

    const { error } = await supabase
      .from("site_pages")
      .update({
        title,
        body: (formData.get("body") as string | null)?.trim() ?? "",
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      })
      .eq("slug", slug);

    if (error) return refuse(error.message);

    revalidateWebsitePages();
    revalidatePath("/management/translations");
    return { ok: true, success: t.common.saved };
  });
}

/**
 * Set (or clear, with null) the "Pet of the week" on the home page. The
 * choice is checked against public_resident_profiles so only a resident the
 * public adoption pages already show can be featured — the same rule the
 * home page applies when it renders the card.
 */
export async function setFeaturedResident(
  residentId: string | null,
): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  return runAction("website.setFeaturedResident", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();

    if (residentId) {
      const { data: visible, error: lookupError } = await supabase
        .from("public_resident_profiles")
        .select("id")
        .eq("id", residentId)
        .limit(1)
        .returns<{ id: string }[]>();
      if (lookupError) return refuse(lookupError.message);
      if (!visible?.length) return refuse(t.admin.website.featured.notPublic);
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

    if (error) return refuse(error.message);

    revalidateWebsitePages();
    return {
      ok: true,
      success: residentId
        ? t.admin.website.featured.updated
        : t.admin.website.featured.cleared,
    };
  });
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
  // The type above is the browser's guess from the name; the bytes decide.
  // A zero-filled "mid3.jpg" became the hero on 2026-09-25 (file-signature.ts).
  const mimeType = await checkFileSignature(file, WEBSITE_IMAGE_MIME_TYPES);
  if (!mimeType) {
    throw new Error(t.uploads.notReadable(file.name, formatNames(WEBSITE_IMAGE_MIME_TYPES)));
  }

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) throw new Error(t.admin.website.errors.driveNotConfigured);

  const drive = getDriveClient();
  const folderId = await findOrCreateFolder(drive, rootId, "Website");
  const fileId = await uploadImageToFolder(drive, folderId, {
    name: file.name,
    mimeType,
    content: file,
  });
  // Read it back before anything points at it or the old photo is trashed.
  try {
    await confirmUploaded(drive, fileId, file.size);
  } catch (err) {
    console.error("Website upload did not land whole:", err);
    await trashInDrive(fileId);
    throw new Error(t.admin.website.errors.uploadFailed);
  }
  return fileId;
}

/**
 * Moves a replaced or removed Website photo to Drive's trash, not a
 * permanent delete: replacing the hero on 2026-09-25 deleted the only copy
 * of the real photo, so a bad replacement could not be undone. The trash
 * keeps it for 30 days (docs/decisions.md, 2026-09-26).
 */
async function trashInDrive(fileId: string) {
  try {
    await getDriveClient().trashFile(fileId);
  } catch {
    // Best-effort — an orphaned Drive file is a minor cleanup issue, not
    // worth failing the user-facing action over (same call this project
    // already makes for resident photos, see residents/[id]/photos/actions.ts).
  }
}

export async function uploadHeroPhoto(formData: FormData): Promise<SiteContentFormState> {
  const { t } = await getT();
  return runAction("website.uploadHeroPhoto", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return refuse(t.admin.website.errors.noFile);
    }

    let driveFileId: string;
    try {
      driveFileId = await uploadToWebsiteFolder(file);
    } catch (err) {
      return refuse(await driveErrorMessage(err, t.admin.website.errors.uploadFailed));
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

    if (error) return refuse(error.message);

    const previousFileId = current?.[0]?.hero_drive_file_id;
    if (previousFileId) await trashInDrive(previousFileId);

    revalidateWebsitePages();
    return { ok: true, success: t.admin.website.hero.updated };
  });
}

export async function removeHeroPhoto(): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("website.removeHeroPhoto", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);

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

    if (error) return refuse(error.message);

    const previousFileId = current?.[0]?.hero_drive_file_id;
    if (previousFileId) await trashInDrive(previousFileId);

    revalidateWebsitePages();
    return { ok: true };
  });
}

export async function uploadGalleryPhoto(formData: FormData): Promise<SiteContentFormState> {
  const { t } = await getT();
  return runAction("website.uploadGalleryPhoto", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return refuse(t.admin.website.errors.noFile);
    }

    let driveFileId: string;
    try {
      driveFileId = await uploadToWebsiteFolder(file);
    } catch (err) {
      return refuse(await driveErrorMessage(err, t.admin.website.errors.uploadFailed));
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

    if (error) return refuse(error.message);

    revalidateWebsitePages();
    return { ok: true, success: t.admin.website.gallery.photoAdded };
  });
}

export async function deleteGalleryPhoto(photoId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("website.deleteGalleryPhoto", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();
    const { data: photo } = await supabase
      .from("site_content_photos")
      .select("drive_file_id")
      .eq("id", photoId)
      .limit(1)
      .returns<{ drive_file_id: string }[]>();

    // A refused delete under RLS matches no row without an error; don't trash
    // the Drive file unless the row really went.
    const { data: deletedRows, error } = await supabase
      .from("site_content_photos")
      .delete()
      .eq("id", photoId)
      .select("id");

    if (error) return refuse(error.message);
    if (deletedRows?.length !== 1) return refuse(t.common.notAllowedToDeleteFile);

    const driveFileId = photo?.[0]?.drive_file_id;
    if (driveFileId) await trashInDrive(driveFileId);

    revalidateWebsitePages();
    return { ok: true };
  });
}

export async function moveGalleryPhoto(
  photoId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("website.moveGalleryPhoto", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);

    const supabase = await createClient();
    const { data: photos } = await supabase
      .from("site_content_photos")
      .select("id, sort_order")
      .order("sort_order", { ascending: true })
      .returns<{ id: string; sort_order: number }[]>();

    if (!photos) return { ok: true };

    const index = photos.findIndex((p) => p.id === photoId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || swapWith < 0 || swapWith >= photos.length) return { ok: true };

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
      return refuse(errorA?.message ?? errorB?.message ?? t.common.failedToReorder);
    }

    revalidateWebsitePages();
    return { ok: true };
  });
}

/**
 * One impact figure's baseline (0156): the starting number and the day it is
 * true to. The public figure is that plus what the app counted after the day.
 * Both blank clears it, which takes the figure off the public page. A change
 * reaches audit_log through the table's own trigger; there is nothing to
 * write here for that.
 */
export async function updateImpactBaseline(
  _state: SiteContentFormState,
  formData: FormData,
): Promise<SiteContentFormState> {
  const { t } = await getT();
  return runAction("website.updateImpactBaseline", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);

    const text = (name: string) => (formData.get(name) as string | null)?.trim() ?? "";
    const key = text("key");
    const rawCount = text("baseline_count");
    const rawDate = text("baseline_date");
    const i = t.admin.website.impact;

    if (!rawCount && !rawDate) {
      // Cleared: both null, which the table's pair check requires together.
    } else if (!rawCount || !rawDate) {
      return refuse(i.bothOrNeither);
    }

    let count: number | null = null;
    if (rawCount) {
      if (!/^\d{1,9}$/.test(rawCount)) return refuse(i.invalidCount);
      count = Number(rawCount);
    }
    let date: string | null = null;
    if (rawDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || Number.isNaN(Date.parse(rawDate))) {
        return refuse(i.invalidDate);
      }
      // A baseline "to the future" would hide adoptions from the live count.
      if (rawDate > todayIso()) return refuse(i.futureDate);
      date = rawDate;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("impact_baselines")
      .update({ baseline_count: count, baseline_date: date })
      .eq("key", key)
      .select("key")
      .returns<{ key: string }[]>();

    if (error) return refuse(error.message);
    if (!data?.length) return refuse(i.notFound);

    revalidatePath("/admin/website");
    revalidatePath("/");
    return { ok: true, success: t.common.saved };
  });
}
