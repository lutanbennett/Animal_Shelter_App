"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useKeptForm } from "@/lib/use-kept-form";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import type { FriendChoice, ShopLinkRow } from "@/lib/shop/shop-links";
import {
  deleteShopLink,
  moveShopLink,
  removeShopPhoto,
  saveShopLink,
  setShopLinkShown,
  uploadShopPhotoAction,
} from "./actions";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * Settings → Shop for the shelter: the entries /shop shows (0285). Every control is drawn only
 * when `canEdit` is true, which the page reads from can(perms, "shop.manage", "edit") - the same
 * activity every action asks - and which defaults to false, so a caller that forgets offers nothing.
 * Reading the list needs only shop.manage at read.
 */
export function ShopLinksEditor({
  rows,
  friends,
  canEdit = false,
}: {
  rows: ShopLinkRow[];
  friends: FriendChoice[];
  canEdit?: boolean;
}) {
  const { t } = useI18n();
  const m = t.shop.manage;
  return (
    <div className="flex flex-col gap-6">
      {rows.length === 0 && <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">{m.empty}</p>}
      <ul className="flex flex-col gap-4">
        {rows.map((row, index) => (
          <li key={row.id} className="rounded border border-border bg-surface p-4">
            <EntryCard row={row} isFirst={index === 0} isLast={index === rows.length - 1} canEdit={canEdit} />
          </li>
        ))}
      </ul>

      {canEdit && (
        <>
          <section className="rounded border border-dashed border-border p-4">
            <h2 className="mb-3 text-base font-semibold text-foreground">{m.addShopHeading}</h2>
            <EntryForm row={null} />
          </section>
          <section className="rounded border border-dashed border-border p-4">
            <h2 className="mb-3 text-base font-semibold text-foreground">{m.addFriendHeading}</h2>
            {friends.length === 0 ? <p className="text-sm text-muted">{m.noFriendsToAdd}</p> : <EntryForm row={null} friends={friends} />}
          </section>
        </>
      )}
    </div>
  );
}

function EntryCard({ row, isFirst, isLast, canEdit }: { row: ShopLinkRow; isFirst: boolean; isLast: boolean; canEdit: boolean }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const m = t.shop.manage;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const name = row.friend?.name ?? row.title ?? "";

  function run(action: () => Promise<{ ok: boolean } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok && "error" in result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-base font-semibold text-foreground">
          {name}
          {row.friend_id && <span className="ml-2 text-xs font-medium text-muted">{t.shop.friendBadge}</span>}
        </h2>
        <span className={`rounded px-2 py-1 text-xs font-medium text-foreground ${row.shown ? "bg-success/15" : "bg-warning/15"}`}>
          {row.shown ? m.shown : m.hidden}
        </span>
        {canEdit && (
          <>
            <ActionButton compact icon={ACTION_ICONS.moveUp} disabled={pending || isFirst} onClick={() => run(() => moveShopLink(row.id, "up"))}>
              {m.moveUp}
            </ActionButton>
            <ActionButton compact icon={ACTION_ICONS.moveDown} disabled={pending || isLast} onClick={() => run(() => moveShopLink(row.id, "down"))}>
              {m.moveDown}
            </ActionButton>
            <ActionButton
              compact
              icon={row.shown ? ACTION_ICONS.unpublish : ACTION_ICONS.publish}
              disabled={pending}
              onClick={() => run(() => setShopLinkShown(row.id, !row.shown))}
            >
              {row.shown ? m.hide : m.show}
            </ActionButton>
          </>
        )}
      </div>

      {canEdit ? <EntryForm row={row} /> : <ReadOnlyEntry row={row} />}
      {canEdit && !row.friend_id && <PhotoPicture row={row} />}

      {canEdit && (
        <div>
          <ActionButton
            compact
            variant="danger"
            icon={ACTION_ICONS.delete}
            disabled={pending}
            onClick={async () => {
              if (!(await confirm({ body: m.confirmDelete(name) }))) return;
              run(() => deleteShopLink(row.id));
            }}
          >
            {m.remove}
          </ActionButton>
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function ReadOnlyEntry({ row }: { row: ShopLinkRow }) {
  return (
    <dl className="grid gap-1 text-sm">
      <dd className="break-all text-muted">{row.link_url}</dd>
      {row.note && <dd className="text-foreground">{row.note}</dd>}
      {row.price_hint && <dd className="text-muted">{row.price_hint}</dd>}
    </dl>
  );
}

/** The fields of an entry. `row` null = adding; `friends` set = adding a Shelter Friend. */
function EntryForm({ row, friends }: { row: ShopLinkRow | null; friends?: FriendChoice[] }) {
  const { t } = useI18n();
  const m = t.shop.manage;
  const [state, onSubmit, pending] = useKeptForm(saveShopLink, undefined);
  const isFriend = !!friends || !!row?.friend_id;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {row && <input type="hidden" name="id" value={row.id} />}
      {friends && (
        <label className="flex max-w-sm flex-col gap-1 text-sm font-medium text-muted">
          {m.friendPick}
          <select name="friend_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              {m.friendPickPlaceholder}
            </option>
            {friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal">{m.friendNote}</span>
        </label>
      )}
      {!isFriend && (
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {m.name}
          <input name="title" required defaultValue={row?.title ?? ""} className={inputClass} />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium text-muted">
        {m.link}
        <input name="link_url" type="url" inputMode="url" required defaultValue={row?.link_url ?? ""} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-muted">
        {m.note}
        <input name="note" defaultValue={row?.note ?? ""} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-muted">
        {m.price}
        <input name="price_hint" defaultValue={row?.price_hint ?? ""} className={inputClass} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <ActionButton type="submit" variant="primary" icon={row ? ACTION_ICONS.save : ACTION_ICONS.add} disabled={pending}>
          {row ? m.save : m.add}
        </ActionButton>
        {state && !state.ok && <p className="text-sm text-danger">{state.error}</p>}
        {state && state.ok && <p className="text-sm text-success">{state.success}</p>}
      </div>
    </form>
  );
}

function PhotoPicture({ row }: { row: ShopLinkRow }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const m = t.shop.manage;
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    const formData = new FormData();
    formData.append("id", row.id);
    formData.append("file", file);
    startTransition(async () => {
      const result = await runUploadAction(file, t.admin.website.errors, () => uploadShopPhotoAction(formData));
      if (result && "error" in result) setMessage({ type: "error", text: result.error });
      else setMessage({ type: "success", text: m.photoUpdated });
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <h3 className="text-sm font-semibold text-foreground">{m.photo}</h3>
      {row.photo_drive_file_id && (
        <Image
          src={driveImageUrl(row.photo_drive_file_id)}
          alt={row.title ?? ""}
          width={160}
          height={160}
          unoptimized
          className="h-40 w-40 rounded border border-border bg-white object-contain"
        />
      )}
      <div className="flex flex-wrap gap-3">
        <ActionButton compact icon={ACTION_ICONS.uploadImage} disabled={pending} onClick={() => inputRef.current?.click()}>
          {m.photo}
        </ActionButton>
        {row.photo_drive_file_id && (
          <ActionButton
            compact
            variant="danger"
            icon={ACTION_ICONS.removeImage}
            disabled={pending}
            onClick={async () => {
              if (!(await confirm({ body: m.removePhoto }))) return;
              startTransition(async () => {
                const result = await removeShopPhoto(row.id);
                if (!result.ok) setMessage({ type: "error", text: result.error });
              });
            }}
          >
            {m.removePhoto}
          </ActionButton>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {message && <p className={`text-sm ${message.type === "error" ? "text-danger" : "text-success"}`}>{message.text}</p>}
    </div>
  );
}
