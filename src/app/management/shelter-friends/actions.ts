"use server";

import { refresh, revalidatePath } from "next/cache";
import { assertManagementRole } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES, WEBSITE_IMAGE_MIME_TYPES } from "@/lib/uploads/limits";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { ContactType } from "@/lib/contacts/contacts";
import { checkFacebookUrl, checkHttpsUrl, FACEBOOK_HOSTS, type LinkCheck } from "@/lib/links/validate";
import {
  canBecomeFriend,
  FRIEND_OPT_INS,
  type FriendOptIn,
} from "@/lib/shelter-friends/friends";
import {
  findOrCreateFolder,
  getDriveClient,
  uploadImageToFolder,
} from "@/lib/google/drive";
import { driveErrorMessage } from "@/lib/google/drive-errors";

/**
 * Writes to shelter_friends (0076). Admin and management only, which is
 * also what its RLS allows — management owns /management/contacts, and a
 * Friend is a contact's public profile.
 */

export type FriendActionResult = { error: string } | { success: string };

/** The editable part of a profile, as the contact hub's card sends it. */
export type FriendFields = {
  blurb: string;
  helpKind: string;
  discountNote: string;
  websiteUrl: string;
  facebookUrl: string;
  friendSince: string;
} & Record<FriendOptIn, boolean>;

function optional(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function linkError(t: Dictionary, check: LinkCheck, hosts?: readonly string[]) {
  if (check.ok) return null;
  if (check.error === "wrongHost") return t.linkErrors.wrongHost((hosts ?? []).join(" / "));
  return t.linkErrors[check.error];
}

/**
 * A profile shows on its contact's page, in both contact lists (the
 * badge), on Management → Shelter Friends — and, through the header and
 * footer link, the home strip and the /donate mention, on every public
 * page. The last is why this revalidates the whole tree.
 *
 * The card and the order list call these directly, not through a
 * <form action>, so revalidation alone doesn't re-render the caller's
 * page; refresh() does (as in management/diets/actions.ts).
 */
function revalidateFriendPages(contactId?: string | null) {
  revalidatePath("/", "layout");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
  refresh();
}

async function friendContactId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
) {
  const { data, error } = await supabase
    .from("shelter_friends")
    .select("contact_id, logo_drive_file_id")
    .eq("id", id)
    .limit(1)
    .returns<{ contact_id: string; logo_drive_file_id: string | null }[]>();
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}

/**
 * Make a Shelter Friend: an empty, unpublished profile with every detail
 * opted out (the table's defaults), placed last in the public order.
 * Offered only where canBecomeFriend() says — the one gate.
 */
export async function createFriend(contactId: string): Promise<FriendActionResult> {
  await assertManagementRole();
  const { t } = await getT();
  const e = t.shelterFriends.errors;
  const supabase = await createClient();

  const { data: contacts, error: contactError } = await supabase
    .from("contacts")
    .select("id, type")
    .eq("id", contactId)
    .limit(1)
    .returns<{ id: string; type: ContactType }[]>();
  if (contactError) return { error: contactError.message };
  const contact = contacts?.[0];
  if (!contact || !canBecomeFriend(contact)) return { error: e.notOffered };

  const { data: last } = await supabase
    .from("shelter_friends")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .returns<{ sort_order: number }[]>();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("shelter_friends").insert({
    contact_id: contactId,
    sort_order: (last?.[0]?.sort_order ?? -1) + 1,
    updated_by: user?.id ?? null,
  });
  // contact_id is unique: a second tab's click lands here.
  if (error) return { error: error.code === "23505" ? e.alreadyFriend : error.message };

  revalidateFriendPages(contactId);
  return { success: t.shelterFriends.card.created };
}

export async function updateFriend(
  id: string,
  fields: FriendFields,
): Promise<FriendActionResult> {
  await assertManagementRole();
  const { t } = await getT();

  const website = checkHttpsUrl(fields.websiteUrl);
  const facebook = checkFacebookUrl(fields.facebookUrl);
  const bad = linkError(t, website) ?? linkError(t, facebook, FACEBOOK_HOSTS);
  if (bad || !website.ok || !facebook.ok) return { error: bad ?? t.common.failedToSave };

  const friendSince = optional(fields.friendSince);
  if (friendSince && !/^\d{4}-\d{2}-\d{2}$/.test(friendSince)) {
    return { error: t.shelterFriends.errors.invalidDate };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const optIns = Object.fromEntries(
    FRIEND_OPT_INS.map((key) => [key, fields[key] === true]),
  ) as Record<FriendOptIn, boolean>;

  const { data, error } = await supabase
    .from("shelter_friends")
    .update({
      blurb: optional(fields.blurb),
      help_kind: optional(fields.helpKind),
      discount_note: optional(fields.discountNote),
      website_url: website.url,
      facebook_url: facebook.url,
      friend_since: friendSince,
      ...optIns,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", id)
    .select("contact_id")
    .returns<{ contact_id: string }[]>();

  if (error) return { error: error.message };
  if (!data?.length) return { error: t.shelterFriends.errors.notFound };

  revalidateFriendPages(data[0].contact_id);
  return { success: t.common.saved };
}

export async function setFriendPublished(
  id: string,
  published: boolean,
): Promise<FriendActionResult> {
  await assertManagementRole();
  const { t } = await getT();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shelter_friends")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("contact_id")
    .returns<{ contact_id: string }[]>();

  if (error) return { error: error.message };
  if (!data?.length) return { error: t.shelterFriends.errors.notFound };

  revalidateFriendPages(data[0].contact_id);
  return { success: published ? t.shelterFriends.card.published : t.shelterFriends.card.unpublished };
}

/**
 * Move one Friend a place up or down the public order. The whole list is
 * renumbered 0…n-1 in its current order first, so profiles that were
 * created with the same sort_order (or reordered by hand in the database)
 * still move by exactly one place. A handful of rows at shelter scale.
 */
export async function moveFriend(id: string, direction: "up" | "down") {
  await assertManagementRole();
  const supabase = await createClient();

  const { data: rows, error: loadError } = await supabase
    .from("shelter_friends")
    .select("id, sort_order, contacts(name)")
    .order("sort_order")
    .returns<{ id: string; sort_order: number; contacts: { name: string } | null }[]>();
  if (loadError) throw new Error(loadError.message);
  if (!rows) return;

  // The order /friends shows: sort_order, then name.
  const ordered = [...rows].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      (a.contacts?.name ?? "").localeCompare(b.contacts?.name ?? ""),
  );
  const index = ordered.findIndex((r) => r.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ordered.length) return;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

  const changed = ordered
    .map((row, position) => ({ row, position }))
    .filter(({ row, position }) => row.sort_order !== position);
  const results = await Promise.all(
    changed.map(({ row, position }) =>
      supabase.from("shelter_friends").update({ sort_order: position }).eq("id", row.id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    const { t } = await getT();
    throw new Error(failed.error.message ?? t.common.failedToReorder);
  }

  revalidateFriendPages();
}

async function deleteFromDrive(fileId: string) {
  try {
    await getDriveClient().deleteFile(fileId);
  } catch {
    // Best-effort, as for the Website page's photos: an orphaned Drive
    // file is a cleanup chore, not a reason to fail the user's action.
  }
}

/** Logos live beside the Website page's photos, in Website/Shelter Friends. */
export async function uploadFriendLogo(
  id: string,
  formData: FormData,
): Promise<FriendActionResult> {
  await assertManagementRole();
  const { t } = await getT();
  const w = t.admin.website.errors;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: w.noFile };
  if (!WEBSITE_IMAGE_MIME_TYPES.has(file.type)) return { error: w.unsupportedFileType(file.type || "unknown") };
  if (file.size > MAX_UPLOAD_BYTES) return { error: w.fileTooLarge };

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) return { error: w.driveNotConfigured };

  const supabase = await createClient();
  const current = await friendContactId(supabase, id);
  if (!current) return { error: t.shelterFriends.errors.notFound };

  let driveFileId: string;
  try {
    const drive = getDriveClient();
    const website = await findOrCreateFolder(drive, rootId, "Website");
    const folderId = await findOrCreateFolder(drive, website, "Shelter Friends");
    driveFileId = await uploadImageToFolder(drive, folderId, {
      name: file.name,
      mimeType: file.type,
      content: file,
    });
  } catch (err) {
    return { error: await driveErrorMessage(err, w.uploadFailed) };
  }

  // .select() so "Logo updated." is only said when the row really changed:
  // an update that matches nothing (a profile removed meanwhile, or RLS)
  // is not an error to PostgREST, just zero rows.
  const { data: saved, error } = await supabase
    .from("shelter_friends")
    .update({ logo_drive_file_id: driveFileId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("logo_drive_file_id")
    .returns<{ logo_drive_file_id: string | null }[]>();
  if (error || saved?.[0]?.logo_drive_file_id !== driveFileId) {
    await deleteFromDrive(driveFileId);
    return { error: error?.message ?? t.shelterFriends.errors.notFound };
  }

  if (current.logo_drive_file_id) await deleteFromDrive(current.logo_drive_file_id);
  revalidateFriendPages(current.contact_id);
  return { success: t.shelterFriends.card.logoUpdated };
}

export async function removeFriendLogo(id: string): Promise<FriendActionResult> {
  await assertManagementRole();
  const { t } = await getT();
  const supabase = await createClient();

  const current = await friendContactId(supabase, id);
  if (!current) return { error: t.shelterFriends.errors.notFound };

  const { error } = await supabase
    .from("shelter_friends")
    .update({ logo_drive_file_id: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  if (current.logo_drive_file_id) await deleteFromDrive(current.logo_drive_file_id);
  revalidateFriendPages(current.contact_id);
  return { success: t.common.saved };
}

/**
 * Remove the profile, not the contact: the card leaves the website and
 * its prose and translations go with it (0076's drop_translations
 * trigger). The contact, and anything else pointing at it, stays.
 */
export async function deleteFriend(id: string): Promise<FriendActionResult> {
  await assertManagementRole();
  const { t } = await getT();
  const supabase = await createClient();

  const current = await friendContactId(supabase, id);
  if (!current) return { error: t.shelterFriends.errors.notFound };

  const { error } = await supabase.from("shelter_friends").delete().eq("id", id);
  if (error) return { error: error.message };

  if (current.logo_drive_file_id) await deleteFromDrive(current.logo_drive_file_id);
  revalidateFriendPages(current.contact_id);
  return { success: t.shelterFriends.card.removed };
}
