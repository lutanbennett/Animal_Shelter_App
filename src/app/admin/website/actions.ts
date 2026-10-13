"use server";

import { revalidatePath } from "next/cache";
import {
  runAction,
  type ActionRefusal,
  type ActionResult,
} from "@/lib/action-result";
import { mapLinkLeadsSomewhere } from "@/lib/contacts/map-preview";
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
import {
  checkDonationUrl,
  DONATION_DOMAINS,
  isDonationWay,
  type DonationWay,
} from "@/lib/links/donation";
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
    // A map link that 404s at Google (a retired goo.gl link, a typo in a
    // short link) is refused here rather than published in the footer.
    if (checked.contact_map_url && !(await mapLinkLeadsSomewhere(checked.contact_map_url))) {
      return refuse(`${s.contactMapUrl}: ${s.contactMapUrlDead}`);
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
 * The typical-clinic-visit estimate (0071) — the flat figure the cashflow
 * forecast stands in for a booked-but-not-yet-invoiced visit. Its own
 * action rather than a field on updateSiteContent: it is an operational
 * number, not website copy, and only the forecast reads it, so saving it
 * has no reason to revalidate every public page.
 *
 * Blank clears it back to "not priced yet", which the forecast shows as a
 * gap. A zero would read as "clinic visits are free".
 */
export async function updateClinicVisitEstimate(
  _state: SiteContentFormState,
  formData: FormData,
): Promise<SiteContentFormState> {
  const { t } = await getT();
  return runAction("website.updateClinicVisitEstimate", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);

    const estimate = parseBahtAmount(formData.get("clinicVisitEstimate") as string | null);
    if (!estimate.ok) return refuse(t.admin.website.vetVisit.invalid);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("site_content")
      .update({
        clinic_visit_estimate: estimate.value,
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

// ---------------------------------------------------------------------------
// Ways to give (0191 donation_channels): Settings -> Website -> Donate
// ---------------------------------------------------------------------------

/** Which detail fields each way keeps; the rest are stored as null so nothing stale is shown. */
const WAY_FIELDS: Record<DonationWay, readonly string[]> = {
  paypal: ["url"],
  donorbox: ["url"],
  wise: ["url"],
  bank_transfer: ["bank_name", "account_name", "account_number"],
  promptpay: ["account_name", "promptpay_id"],
  other: ["url"],
};

function revalidateDonate() {
  revalidatePath("/admin/website");
  revalidatePath("/donate");
}

/**
 * Add a way to give (no `id`) or change one (with `id`; its kind cannot be
 * changed - delete it and add the other kind). Links are checked here with the
 * same rule the database repeats, so a wrong-company link never reaches it.
 */
export async function saveDonationChannel(
  _state: SiteContentFormState,
  formData: FormData,
): Promise<SiteContentFormState> {
  const { t } = await getT();
  return runAction("website.saveDonationChannel", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);
    const d = t.admin.website.donate;

    const text = (name: string) => (formData.get(name) as string | null)?.trim() ?? "";
    const id = text("id");
    const way = text("way");
    if (!isDonationWay(way)) return refuse(d.errors.unknownWay);

    const label = text("label");
    if (!label) return refuse(d.errors.labelRequired);

    const fields: Record<string, string | null> = {
      url: null,
      bank_name: null,
      account_name: null,
      account_number: null,
      promptpay_id: null,
    };
    for (const name of WAY_FIELDS[way]) fields[name] = text(name) || null;

    if (WAY_FIELDS[way].includes("url")) {
      if (fields.url === null) return refuse(d.errors.linkRequired);
      const check = checkDonationUrl(way, fields.url);
      if (!check.ok) {
        const domains = DONATION_DOMAINS[way];
        return refuse(
          linkErrorText(t.linkErrors, check, domains ? [domains] : undefined) ?? d.errors.linkRequired,
        );
      }
      fields.url = check.url;
    }
    if (way === "bank_transfer" && !fields.account_number) return refuse(d.errors.accountRequired);
    if (way === "promptpay" && !fields.promptpay_id) return refuse(d.errors.promptpayRequired);

    const row = { way, label, note: text("note") || null, ...fields };
    const supabase = await createClient();

    if (id) {
      const { data, error } = await supabase
        .from("donation_channels")
        .update(row)
        .eq("id", id)
        .eq("way", way)
        .select("id")
        .returns<{ id: string }[]>();
      if (error) return refuse(error.message);
      if (!data?.length) return refuse(d.errors.notFound);
    } else {
      const { data: last, error: readError } = await supabase
        .from("donation_channels")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .returns<{ sort_order: number }[]>();
      if (readError) return refuse(readError.message);
      const { error } = await supabase
        .from("donation_channels")
        .insert({ ...row, sort_order: (last?.[0]?.sort_order ?? 0) + 1 });
      if (error) return refuse(error.message);
    }

    revalidateDonate();
    return { ok: true, success: t.common.saved };
  });
}

/** Show or hide a way on /donate. Hiding keeps everything typed. */
export async function setDonationChannelShown(id: string, shown: boolean): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("website.setDonationChannelShown", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("donation_channels")
      .update({ shown })
      .eq("id", id)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return refuse(error.message);
    if (!data?.length) return refuse(t.admin.website.donate.errors.notFound);
    revalidateDonate();
    return { ok: true };
  });
}

/** Move a way one place up or down; the order is renumbered so equal numbers never stick. */
export async function moveDonationChannel(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("website.moveDonationChannel", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("donation_channels")
      .select("id, sort_order")
      .order("sort_order")
      .order("created_at")
      .returns<{ id: string; sort_order: number }[]>();
    if (error) return refuse(error.message);
    const ids = (data ?? []).map((r) => r.id);
    const from = ids.indexOf(id);
    if (from === -1) return refuse(t.admin.website.donate.errors.notFound);
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= ids.length) return { ok: true };
    [ids[from], ids[to]] = [ids[to], ids[from]];
    for (const [index, rowId] of ids.entries()) {
      const { error: updateError } = await supabase
        .from("donation_channels")
        .update({ sort_order: index + 1 })
        .eq("id", rowId);
      if (updateError) return refuse(updateError.message);
    }
    revalidateDonate();
    return { ok: true };
  });
}

export async function deleteDonationChannel(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("website.deleteDonationChannel", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);
    const supabase = await createClient();
    const { data: current } = await supabase
      .from("donation_channels")
      .select("qr_drive_file_id")
      .eq("id", id)
      .limit(1)
      .returns<{ qr_drive_file_id: string | null }[]>();
    const { error } = await supabase.from("donation_channels").delete().eq("id", id);
    if (error) return refuse(error.message);
    const qr = current?.[0]?.qr_drive_file_id;
    if (qr) await trashInDrive(qr);
    revalidateDonate();
    return { ok: true };
  });
}

/** The PromptPay QR picture for a PromptPay way. Replaces the old one (to Drive's trash). */
export async function uploadDonationQr(formData: FormData): Promise<SiteContentFormState> {
  const { t } = await getT();
  return runAction("website.uploadDonationQr", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);
    const id = (formData.get("id") as string | null)?.trim() ?? "";
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return refuse(t.admin.website.errors.noFile);

    const supabase = await createClient();
    const { data: current } = await supabase
      .from("donation_channels")
      .select("way, qr_drive_file_id")
      .eq("id", id)
      .limit(1)
      .returns<{ way: string; qr_drive_file_id: string | null }[]>();
    if (!current?.length) return refuse(t.admin.website.donate.errors.notFound);
    if (current[0].way !== "promptpay") return refuse(t.admin.website.donate.errors.qrPromptpayOnly);

    let driveFileId: string;
    try {
      driveFileId = await uploadToWebsiteFolder(file);
    } catch (err) {
      return refuse(await driveErrorMessage(err, t.admin.website.errors.uploadFailed));
    }
    const { error } = await supabase
      .from("donation_channels")
      .update({ qr_drive_file_id: driveFileId })
      .eq("id", id);
    if (error) return refuse(error.message);
    if (current[0].qr_drive_file_id) await trashInDrive(current[0].qr_drive_file_id);
    revalidateDonate();
    return { ok: true, success: t.admin.website.donate.qrUpdated };
  });
}

export async function removeDonationQr(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("website.removeDonationQr", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "website.content")) return refuse(t.admin.security.errors.adminAccessRequired);
    const supabase = await createClient();
    const { data: current } = await supabase
      .from("donation_channels")
      .select("qr_drive_file_id")
      .eq("id", id)
      .limit(1)
      .returns<{ qr_drive_file_id: string | null }[]>();
    const { error } = await supabase.from("donation_channels").update({ qr_drive_file_id: null }).eq("id", id);
    if (error) return refuse(error.message);
    const qr = current?.[0]?.qr_drive_file_id;
    if (qr) await trashInDrive(qr);
    revalidateDonate();
    return { ok: true };
  });
}
