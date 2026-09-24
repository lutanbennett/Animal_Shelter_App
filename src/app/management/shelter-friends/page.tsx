import Link from "next/link";
import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { FriendsOrder, type FriendOrderRow } from "./FriendsOrder";

/**
 * Management → Shelter Friends: every profile in the order /friends shows
 * them, to reorder and to publish or take down. The profile itself is
 * written on the contact's page, where the business's details are — this
 * is the running order, not a second editor.
 */
export default async function ShelterFriendsPage() {
  await requireManagementUser();
  const { t } = await getT();
  const m = t.shelterFriends.manage;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelter_friends")
    .select(
      "id, contact_id, published, sort_order, logo_drive_file_id, help_kind, contacts(name, archived_at)",
    )
    .order("sort_order")
    .returns<FriendOrderRow[]>();

  // The order /friends uses: sort_order, then name.
  const friends = [...(data ?? [])].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      (a.contacts?.name ?? "").localeCompare(b.contacts?.name ?? ""),
  );

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
        <p className="text-sm text-muted">
          {m.subtitle}{" "}
          <Link href="/friends" target="_blank" className="text-primary hover:underline">
            {m.viewPage}
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-danger">
          {t.shelterFriends.couldntLoad}: {error.message}
        </p>
      )}

      {!error && friends.length === 0 ? (
        <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
          {m.empty}
        </p>
      ) : (
        <FriendsOrder friends={friends} />
      )}
    </main>
  );
}
