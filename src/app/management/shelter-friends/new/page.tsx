import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CONTACT_COLUMNS, type Contact } from "@/lib/contacts/contacts";
import { canBecomeFriend } from "@/lib/shelter-friends/friends";
import { parseStepParam } from "@/app/residents/new/steps";
import { FriendWizard } from "./FriendWizard";
import { FRIEND_STEPS } from "./steps";
import { requirePermission } from "@/lib/permissions/require";

/**
 * Management → Shelter Friends → Add a Shelter Friend: the guided way to
 * what used to take five places (see docs/decisions, 2026-10-02). The
 * contacts it offers are the ones the one gate allows, that are not
 * archived and are not already a Friend.
 */
export default async function AddShelterFriendPage(
  props: PageProps<"/management/shelter-friends/new">,
) {
  await requirePermission("friends.manage");
  const { t } = await getT();
  const w = t.shelterFriends.wizard;
  const searchParams = await props.searchParams;
  const initialStep = parseStepParam(searchParams.step, FRIEND_STEPS.length);

  const supabase = await createClient();
  const [contactsResult, friendsResult] = await Promise.all([
    supabase
      .from("contacts")
      .select(CONTACT_COLUMNS)
      .is("archived_at", null)
      .order("name")
      .returns<Contact[]>(),
    supabase.from("shelter_friends").select("contact_id").returns<{ contact_id: string }[]>(),
  ]);

  const taken = new Set((friendsResult.data ?? []).map((row) => row.contact_id));
  const contacts = (contactsResult.data ?? []).filter(
    (contact) => canBecomeFriend(contact) && !taken.has(contact.id),
  );
  const loadError = contactsResult.error?.message ?? friendsResult.error?.message ?? null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{w.pageTitle}</h1>
        <p className="text-sm text-muted">{w.pageSubtitle}</p>
      </div>

      {loadError && (
        <p className="text-sm text-danger">
          {t.shelterFriends.couldntLoad}: {loadError}
        </p>
      )}

      <FriendWizard contacts={contacts} initialStep={initialStep} />
    </main>
  );
}
