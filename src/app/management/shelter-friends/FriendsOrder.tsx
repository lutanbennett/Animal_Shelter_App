"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { FriendBadge } from "@/components/FriendBadge";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
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

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded border border-border text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-30";

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

  function run(action: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (result && typeof result === "object" && "error" in result) {
          setError(String((result as { error: string }).error));
        }
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
              <div className="flex min-w-0 flex-1 flex-col gap-1">
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => setFriendPublished(friend.id, !friend.published))}
                  className="rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
                >
                  {friend.published ? f.card.unpublish : f.card.publish}
                </button>
                <button
                  type="button"
                  aria-label={f.manage.moveUp(name)}
                  title={f.manage.moveUp(name)}
                  disabled={isPending || index === 0}
                  onClick={() => run(() => moveFriend(friend.id, "up"))}
                  className={iconButton}
                >
                  <ArrowUp aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={f.manage.moveDown(name)}
                  title={f.manage.moveDown(name)}
                  disabled={isPending || index === friends.length - 1}
                  onClick={() => run(() => moveFriend(friend.id, "down"))}
                  className={iconButton}
                >
                  <ArrowDown aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
