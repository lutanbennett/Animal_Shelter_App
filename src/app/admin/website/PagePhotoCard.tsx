"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { WRITE_REQUEST_FIELD } from "@/lib/write-requests";
import { PendingPuppy } from "@/components/PuppyLoader";
import type { PagePhotoSlug } from "@/lib/site/pages";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import { removePagePhoto, savePagePhotoAlt, uploadPagePhoto } from "./actions";

export type PagePhoto = { fileId: string | null; alt: string | null; altTh: string | null };

/**
 * The photo beside one page's heading (0200), on that page's own edit page — the four
 * slots used to sit in one list on the Pages tab, above the editor nobody could reach
 * without scrolling past them.
 *
 * `canEdit` is the activity uploadPagePhoto, removePagePhoto and savePagePhotoAlt all
 * ask (website.content, read from their bodies in actions.ts). It defaults to false, so
 * a caller that forgets to pass it offers no control at all rather than a button the
 * database then refuses. The photo itself is still shown: seeing what is on the page is
 * reading, and the Pages tab already needs website.content at read to open.
 */
export function PagePhotoCard({
  page,
  photo,
  canEdit = false,
}: {
  page: PagePhotoSlug;
  photo: PagePhoto;
  canEdit?: boolean;
}) {
  const { t } = useI18n();
  const p = t.admin.website.pagePhotos;
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  // One per action: an id kept from an unknown save and sent to another action is refused by claim_write_request().
  const saveUpload = useWriteCall();
  const saveRemove = useWriteCall();
  const saveAlt = useWriteCall();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await runUploadAction(file, t.admin.website.errors, () =>
        saveUpload((requestId) => {
          formData.set(WRITE_REQUEST_FIELD, requestId);
          return uploadPagePhoto(page, formData);
        }),
      );
      if (result && "error" in result) setMessage({ type: "error", text: result.error });
      else setMessage({ type: "success", text: p.updated });
    });
  }

  async function handleRemove() {
    if (!await confirm({ body: p.removeConfirm })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await saveRemove((requestId) => removePagePhoto(page, requestId));
      if (!result.ok) setMessage({ type: "error", text: result.error });
    });
  }

  function handleAlt(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await saveAlt((requestId) => {
        formData.set(WRITE_REQUEST_FIELD, requestId);
        return savePagePhotoAlt(page, formData);
      });
      if (result && "error" in result) setMessage({ type: "error", text: result.error });
      else setMessage({ type: "success", text: t.common.saved });
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{p.cardHeading}</h2>
        <p className="text-sm text-muted">{p.cardSubtitle}</p>
      </div>

      <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded border border-border bg-background">
        {photo.fileId ? (
          <Image
            src={driveImageUrl(photo.fileId)}
            alt={photo.alt?.trim() || p.cardHeading}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm text-muted">
            {p.noPhoto}
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton icon={ACTION_ICONS.uploadImage} disabled={isPending} onClick={() => inputRef.current?.click()}>
            {isPending && <PendingPuppy />}
            {isPending ? t.common.uploading : p.replace}
          </ActionButton>
          {photo.fileId && (
            <ActionButton variant="danger" icon={ACTION_ICONS.removeImage} disabled={isPending} onClick={handleRemove}>
              {p.remove}
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
      )}

      {canEdit && photo.fileId && (
        <form action={handleAlt} className="flex flex-col gap-2">
          <p className="text-sm text-muted">{p.altHelp}</p>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            {p.alt}
            <input name="alt" defaultValue={photo.alt ?? ""} maxLength={300} className="min-h-11 rounded border border-border bg-background px-3 font-normal" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            {p.altTh}
            <input name="alt_th" defaultValue={photo.altTh ?? ""} maxLength={300} className="min-h-11 rounded border border-border bg-background px-3 font-normal" />
          </label>
          <div>
            <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save} disabled={isPending}>{t.common.save}</ActionButton>
          </div>
        </form>
      )}

      {message && (
        <p className={`text-sm ${message.type === "error" ? "text-danger" : "text-success"}`}>{message.text}</p>
      )}
    </section>
  );
}
