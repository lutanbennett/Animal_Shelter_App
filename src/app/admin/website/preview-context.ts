import type { SiteContent } from "@/lib/site/content";
import { isPagePhotoSlug } from "@/lib/site/pages";

/**
 * What the live preview of an unsaved page edit needs besides the typed words. Read on the
 * server and handed to SitePageForm. It lived in the Website admin page while the editor
 * opened there in a popup; the editor is now a page of its own, so it sits here where both
 * can reach it.
 */

/** The saved contact details the preview's "get in touch" card is built from. */
export function pickPreviewContact(c: SiteContent) {
  return {
    contact_line: c.contact_line,
    contact_phone: c.contact_phone,
    contact_email: c.contact_email,
    facebook_url: c.facebook_url,
    instagram_url: c.instagram_url,
    messenger_url: c.messenger_url,
    whatsapp_number: c.whatsapp_number,
    x_url: c.x_url,
    preferred_channels: c.preferred_channels,
  };
}

/** The photo an admin chose for Donate, Foster, Volunteer or About, as saved. */
export function pagePhotoOf(c: SiteContent, slug: string) {
  if (!isPagePhotoSlug(slug)) return null;
  const fileId = c[`${slug}_photo_drive_file_id`]?.trim();
  if (!fileId) return null;
  return {
    fileId,
    alt: c[`${slug}_photo_alt`]?.trim() ?? "",
    altTh: c[`${slug}_photo_alt_th`]?.trim() ?? "",
  };
}
