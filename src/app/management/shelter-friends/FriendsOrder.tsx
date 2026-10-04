"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { FriendBadge } from "@/components/FriendBadge";
import { driveImageUrl } from "@/lib/google/drive-client";
import type { ActionResult } from "@/lib/action-result";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { moveFriend, setFriendPublished } from "./actions";

export type FriendOrderRow = {
  id: string;
  contact_id: string;
  published: boolean;
  sort_order: number;
  logo_drive_file_id: string | null;
  help_kind: string | null;
  contacts: { name: string; archived_at: string | null } | null;
};

/**
 * The running order of /friends, one row per profile: move up / down,
 * publish or unpublish, and the way into the contact to edit the profile.
 * A Friend whose contact is archived stays in the list, marked, since its
 * place in the order and its profile are kept for when it is restored.
 */
export function FriendsOrder({ friends }: { friends: FriendOrderRow[] }) {
  const { t } = useI18n();
  const f = t.shelterFriends;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) setError(result.error);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.common.failedToSave);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-danger">{error}</p>}
      <ol className="flex flex-col gap-2">
        {friends.map((friend, index) => {
          const name = friend.contacts?.name ?? t.common.dash;
          const archived = Boolean(friend.contacts?.archived_at);
          const live = friend.published && !archived;
          return (
            <li
              key={friend.id}
              className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
                archived ? "border-dashed border-border bg-background" : "border-border bg-surface"
              }`}
            >
              <span className="w-6 text-right text-sm tabular-nums text-muted">{index + 1}</span>
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-white">
                {friend.logo_drive_file_id ? (
                  <Image
                    src={driveImageUrl(friend.logo_drive_file_id)}
                    alt={f.logoAlt(name)}
                    fill
                    sizes="48px"
                    className="object-contain p-0.5"
                  />
                ) : (
                  <span aria-hidden="true" className="text-lg font-semibold text-primary">
                    {name.trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
                <Link
                  href={`/contacts/${friend.contact_id}`}
                  className="truncate font-medium text-foreground hover:underline"
                >
                  {name}
                </Link>
                <div className="flex flex-wrap items-center gap-1.5">
                  <FriendBadge
                    label={live ? f.card.onWebsite : archived ? f.card.notOnWebsite : f.card.draft}
                    published={live}
                  />
                  {archived && <span className="text-xs text-muted">{f.manage.archivedNote}</span>}
                  {friend.help_kind && (
                    <span className="truncate text-xs text-muted">{friend.help_kind}</span>
                  )}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <RowActionButton
                  disabled={isPending}
                  onClick={() => run(() => setFriendPublished(friend.id, !friend.published))}
                  label={friend.published ? f.card.unpublish : f.card.publish}
                  subject={name}
                  icon={friend.published ? ACTION_ICONS.unpublish : ACTION_ICONS.publish}
                />
                <RowActionButton
                  disabled={isPending || index === 0}
                  onClick={() => run(() => moveFriend(friend.id, "up"))}
                  label={f.manage.moveUp(name)}
                  icon={ACTION_ICONS.moveUp}
                />
                <RowActionButton
                  disabled={isPending || index === friends.length - 1}
                  onClick={() => run(() => moveFriend(friend.id, "down"))}
                  label={f.manage.moveDown(name)}
                  icon={ACTION_ICONS.moveDown}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
