"use server";

import { refresh, revalidatePath } from "next/cache";
import { runAction, type ActionRefusal, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES, WEBSITE_IMAGE_MIME_TYPES } from "@/lib/uploads/limits";
import { checkFileSignature, formatNames } from "@/lib/uploads/file-signature";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { isArchived, type ContactType } from "@/lib/contacts/contacts";
import { insertContact } from "@/lib/contacts/create";
import { checkFacebookUrl, checkHttpsUrl, FACEBOOK_HOSTS, type LinkCheck } from "@/lib/links/validate";
import {
  canBecomeFriend,
  FRIEND_OPT_INS,
  type FriendOptIn,
} from "@/lib/shelter-friends/friends";
import {
  confirmUploaded,
  findOrCreateFolder,
  getDriveClient,
  uploadImageToFolder,
} from "@/lib/google/drive";
import { driveErrorMessage } from "@/lib/google/drive-errors";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

/**
 * Writes to shelter_friends (0076). Admin and management only, which is
 * also what its RLS allows — management owns /management/contacts, and a
 * Friend is a contact's public profile.
 */

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

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
 * The checks every write of a profile's fields shares — Save on the card
 * and the wizard's one save: both links, the date, and the opt-ins read
 * as strictly boolean (anything not exactly true is off). Returns the
 * columns to write, or the sentence to refuse with.
 */
function checkFriendFields(t: Dictionary, fields: FriendFields) {
  const website = checkHttpsUrl(fields.websiteUrl);
  const facebook = checkFacebookUrl(fields.facebookUrl);
  const bad = linkError(t, website) ?? linkError(t, facebook, FACEBOOK_HOSTS);
  if (bad || !website.ok || !facebook.ok) return { error: bad ?? t.common.failedToSave };

  const friendSince = optional(fields.friendSince);
  if (friendSince && !/^\d{4}-\d{2}-\d{2}$/.test(friendSince)) {
    return { error: t.shelterFriends.errors.invalidDate };
  }

  const optIns = Object.fromEntries(
    FRIEND_OPT_INS.map((key) => [key, fields[key] === true]),
  ) as Record<FriendOptIn, boolean>;

  return {
    columns: {
      blurb: optional(fields.blurb),
      help_kind: optional(fields.helpKind),
      discount_note: optional(fields.discountNote),
      website_url: website.url,
      facebook_url: facebook.url,
      friend_since: friendSince,
      ...optIns,
    },
  };
}

/** New profiles go last in the public order. */
async function nextSortOrder(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: last } = await supabase
    .from("shelter_friends")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .returns<{ sort_order: number }[]>();
  return (last?.[0]?.sort_order ?? -1) + 1;
}

/**
 * Make a Shelter Friend: an empty, unpublished profile with every detail
 * opted out (the table's defaults), placed last in the public order.
 * Offered only where canBecomeFriend() says — the one gate.
 */
export async function createFriend(contactId: string): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  return runAction("shelterFriends.createFriend", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "friends.manage")) return refuse(t.management.errors.managementAccessRequired);
    const e = t.shelterFriends.errors;
    const supabase = await createClient();

    const { data: contacts, error: contactError } = await supabase
      .from("contacts")
      .select("id, type")
      .eq("id", contactId)
      .limit(1)
      .returns<{ id: string; type: ContactType }[]>();
    if (contactError) return refuse(contactError.message);
    const contact = contacts?.[0];
    if (!contact || !canBecomeFriend(contact)) return refuse(e.notOffered);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("shelter_friends").insert({
      contact_id: contactId,
      sort_order: await nextSortOrder(supabase),
      updated_by: user?.id ?? null,
    });
    // contact_id is unique: a second tab's click lands here.
    if (error) return refuse(error.code === "23505" ? e.alreadyFriend : error.message);

    revalidateFriendPages(contactId);
    return { ok: true, success: t.shelterFriends.card.created };
  });
}

export async function updateFriend(
  id: string,
  fields: FriendFields,
): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  return runAction("shelterFriends.updateFriend", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "friends.manage")) return refuse(t.management.errors.managementAccessRequired);

    const checked = checkFriendFields(t, fields);
    if (!checked.columns) return refuse(checked.error);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("shelter_friends")
      .update({
        ...checked.columns,
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      })
      .eq("id", id)
      .select("contact_id")
      .returns<{ contact_id: string }[]>();

    if (error) return refuse(error.message);
    if (!data?.length) return refuse(t.shelterFriends.errors.notFound);

    revalidateFriendPages(data[0].contact_id);
    return { ok: true, success: t.common.saved };
  });
}

/** Who the wizard's friend is: a contact already in the book, or one made on the spot. */
export type WizardContact =
  | { mode: "existing"; id: string }
  | {
      mode: "new";
      name: string;
      type: string;
      phone: string;
      email: string;
      lineId: string;
      address: string;
    };

/**
 * The Shelter Friend wizard's one save: the contact (if it is new), the
 * profile with its text and opt-ins, and the publish flag, in that order.
 *
 * Everything that can be refused is checked before the first write, and
 * the profile goes in as a single row — so the only half-finished state
 * there can be is a contact made a moment ago whose profile then failed,
 * and that contact is removed again. (No RPC: the contact and the profile
 * are two inserts either way, and a failed second one is cheap to undo.)
 * The logo is not here — it goes to Drive, and a Drive failure must not
 * undo the rest — so the wizard calls uploadFriendLogo with the id this
 * returns. The opt-ins go through the same checkFriendFields as Save on
 * the card: only what the caller sent as exactly true is on.
 */
export async function addShelterFriend(input: {
  contact: WizardContact;
  fields: FriendFields;
  publish: boolean;
}): Promise<ActionResult<{ success: string; friendId: string; contactId: string; name: string }>> {
  const { t } = await getT();
  return runAction("shelterFriends.addShelterFriend", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "friends.manage")) return refuse(t.management.errors.managementAccessRequired);
    const e = t.shelterFriends.errors;

    const checked = checkFriendFields(t, input.fields);
    if (!checked.columns) return refuse(checked.error);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let contactId: string;
    let name: string;
    let createdContact = false;

    if (input.contact.mode === "existing") {
      const { data: contacts, error: contactError } = await supabase
        .from("contacts")
        .select("id, name, type, archived_at")
        .eq("id", input.contact.id)
        .limit(1)
        .returns<{ id: string; name: string; type: ContactType; archived_at: string | null }[]>();
      if (contactError) return refuse(contactError.message);
      const contact = contacts?.[0];
      if (!contact || !canBecomeFriend(contact) || isArchived(contact)) return refuse(e.notOffered);
      const { data: existing, error: existingError } = await supabase
        .from("shelter_friends")
        .select("id")
        .eq("contact_id", contact.id)
        .limit(1)
        .returns<{ id: string }[]>();
      if (existingError) return refuse(existingError.message);
      if (existing?.length) return refuse(e.alreadyFriend);
      contactId = contact.id;
      name = contact.name;
    } else {
      const c = input.contact;
      // The gate comes before the contact is made, not after: a type that
      // can't be a Friend must not leave a stray contact behind.
      if (!canBecomeFriend({ type: c.type as ContactType })) return refuse(e.notOffered);
      const created = await insertContact(supabase, t, {
        name: c.name,
        type: c.type,
        phone: c.phone,
        email: c.email,
        lineId: c.lineId,
        address: c.address,
      });
      if (!created.ok) return refuse(created.error);
      contactId = created.id;
      name = created.name;
      createdContact = true;
    }

    const { data: saved, error } = await supabase
      .from("shelter_friends")
      .insert({
        contact_id: contactId,
        ...checked.columns,
        published: input.publish === true,
        sort_order: await nextSortOrder(supabase),
        updated_by: user?.id ?? null,
      })
      .select("id")
      .returns<{ id: string }[]>();
    const friendId = saved?.[0]?.id;

    if (error || !friendId) {
      let message = error?.code === "23505" ? e.alreadyFriend : (error?.message ?? t.common.failedToSave);
      if (createdContact) {
        // Don't leave half a friend behind: take the new contact back out.
        const { error: undoError } = await supabase.from("contacts").delete().eq("id", contactId);
        if (undoError) {
          console.error("addShelterFriend: could not remove the contact it had just made:", undoError);
          message = t.shelterFriends.wizard.errors.contactKept(name);
          revalidatePath("/management/contacts");
          revalidatePath("/contacts");
        }
      }
      return refuse(message);
    }

    revalidatePath("/management/contacts");
    revalidatePath("/contacts");
    revalidateFriendPages(contactId);
    return {
      ok: true,
      success: t.shelterFriends.wizard.created(name, input.publish === true),
      friendId,
      contactId,
      name,
    };
  });
}

export async function setFriendPublished(
  id: string,
  published: boolean,
): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  return runAction("shelterFriends.setFriendPublished", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "friends.manage")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("shelter_friends")
      .update({ published, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("contact_id")
      .returns<{ contact_id: string }[]>();

    if (error) return refuse(error.message);
    if (!data?.length) return refuse(t.shelterFriends.errors.notFound);

    revalidateFriendPages(data[0].contact_id);
    return { ok: true, success: published ? t.shelterFriends.card.published : t.shelterFriends.card.unpublished };
  });
}

/**
 * Move one Friend a place up or down the public order. The whole list is
 * renumbered 0…n-1 in its current order first, so profiles that were
 * created with the same sort_order (or reordered by hand in the database)
 * still move by exactly one place. A handful of rows at shelter scale.
 */
export async function moveFriend(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("shelterFriends.moveFriend", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "friends.manage")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();

    const { data: rows, error: loadError } = await supabase
      .from("shelter_friends")
      .select("id, sort_order, contacts(name)")
      .order("sort_order")
      .returns<{ id: string; sort_order: number; contacts: { name: string } | null }[]>();
    if (loadError) return refuse(loadError.message);
    if (!rows) return { ok: true };

    // The order /friends shows: sort_order, then name.
    const ordered = [...rows].sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        (a.contacts?.name ?? "").localeCompare(b.contacts?.name ?? ""),
    );
    const index = ordered.findIndex((r) => r.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= ordered.length) return { ok: true };
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
    if (failed?.error) return refuse(failed.error.message ?? t.common.failedToReorder);

    revalidateFriendPages();
    return { ok: true };
  });
}

/** To Drive's trash, restorable for 30 days — as for the Website page's photos. */
async function trashInDrive(fileId: string) {
  try {
    await getDriveClient().trashFile(fileId);
  } catch {
    // Best-effort, as for the Website page's photos: an orphaned Drive
    // file is a cleanup chore, not a reason to fail the user's action.
  }
}

/** Logos live beside the Website page's photos, in Website/Shelter Friends. */
export async function uploadFriendLogo(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  return runAction("shelterFriends.uploadFriendLogo", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "friends.manage")) return refuse(t.management.errors.managementAccessRequired);
    const w = t.admin.website.errors;

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return refuse(w.noFile);
    if (!WEBSITE_IMAGE_MIME_TYPES.has(file.type)) return refuse(w.unsupportedFileType(file.type || "unknown"));
    if (file.size > MAX_UPLOAD_BYTES) return refuse(w.fileTooLarge);
    // The bytes decide, not the browser's guess from the name (file-signature.ts).
    const mimeType = await checkFileSignature(file, WEBSITE_IMAGE_MIME_TYPES);
    if (!mimeType) {
      return refuse(t.uploads.notReadable(file.name, formatNames(WEBSITE_IMAGE_MIME_TYPES)));
    }

    const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootId) return refuse(w.driveNotConfigured);

    const supabase = await createClient();
    const current = await friendContactId(supabase, id);
    if (!current) return refuse(t.shelterFriends.errors.notFound);

    let driveFileId: string;
    try {
      const drive = getDriveClient();
      const website = await findOrCreateFolder(drive, rootId, "Website");
      const folderId = await findOrCreateFolder(drive, website, "Shelter Friends");
      driveFileId = await uploadImageToFolder(drive, folderId, {
        name: file.name,
        mimeType,
        content: file,
      });
    } catch (err) {
      return refuse(await driveErrorMessage(err, w.uploadFailed));
    }
    // Read it back before the profile points at it or the old logo is trashed.
    try {
      await confirmUploaded(getDriveClient(), driveFileId, file.size);
    } catch (err) {
      console.error("Logo upload did not land whole:", err);
      await trashInDrive(driveFileId);
      return refuse(w.uploadFailed);
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
      await trashInDrive(driveFileId);
      return refuse(error?.message ?? t.shelterFriends.errors.notFound);
    }

    if (current.logo_drive_file_id) await trashInDrive(current.logo_drive_file_id);
    revalidateFriendPages(current.contact_id);
    return { ok: true, success: t.shelterFriends.card.logoUpdated };
  });
}

export async function removeFriendLogo(id: string): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  return runAction("shelterFriends.removeFriendLogo", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "friends.manage")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();

    const current = await friendContactId(supabase, id);
    if (!current) return refuse(t.shelterFriends.errors.notFound);

    const { error } = await supabase
      .from("shelter_friends")
      .update({ logo_drive_file_id: null, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return refuse(error.message);

    if (current.logo_drive_file_id) await trashInDrive(current.logo_drive_file_id);
    revalidateFriendPages(current.contact_id);
    return { ok: true, success: t.common.saved };
  });
}

/**
 * Remove the profile, not the contact: the card leaves the website and
 * its prose and translations go with it (0076's drop_translations
 * trigger). The contact, and anything else pointing at it, stays.
 */
export async function deleteFriend(id: string): Promise<ActionResult<{ success: string }>> {
  const { t } = await getT();
  return runAction("shelterFriends.deleteFriend", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "friends.manage")) return refuse(t.management.errors.managementAccessRequired);
    const supabase = await createClient();

    const current = await friendContactId(supabase, id);
    if (!current) return refuse(t.shelterFriends.errors.notFound);

    const { error } = await supabase.from("shelter_friends").delete().eq("id", id);
    if (error) return refuse(error.message);

    if (current.logo_drive_file_id) await trashInDrive(current.logo_drive_file_id);
    revalidateFriendPages(current.contact_id);
    return { ok: true, success: t.shelterFriends.card.removed };
  });
}
