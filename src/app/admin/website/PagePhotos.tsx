"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { PendingPuppy } from "@/components/PuppyLoader";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import { removePagePhoto, savePagePhotoAlt, uploadPagePhoto, type PagePhotoPage } from "./actions";

type Photo = { fileId: string | null; alt: string | null; altTh: string | null };

export function PagePhotos({ photos }: { photos: Record<PagePhotoPage, Photo> }) {
  const { t } = useI18n();
  const p = t.admin.website.pagePhotos;
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{p.heading}</h2>
        <p className="text-sm text-muted">{p.subtitle}</p>
      </div>
      {(["donate", "foster", "volunteer", "about"] as const).map((page) => (
        <PagePhoto key={page} page={page} photo={photos[page]} />
      ))}
    </section>
  );
}

function PagePhoto({ page, photo }: { page: PagePhotoPage; photo: Photo }) {
  const { t } = useI18n();
  const p = t.admin.website.pagePhotos;
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await runUploadAction(file, t.admin.website.errors, () =>
        uploadPagePhoto(page, formData),
      );
      if (result && "error" in result) setMessage({ type: "error", text: result.error });
      else setMessage({ type: "success", text: p.updated });
    });
  }

  async function handleRemove() {
    if (!await confirm({ body: p.removeConfirm })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await removePagePhoto(page);
      if (!result.ok) setMessage({ type: "error", text: result.error });
    });
  }

  function handleAlt(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await savePagePhotoAlt(page, formData);
      if (result && "error" in result) setMessage({ type: "error", text: result.error });
      else setMessage({ type: "success", text: t.common.saved });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
      <h3 className="text-base font-semibold text-foreground">{p.pages[page]}</h3>

      <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded border border-border bg-background">
        {photo.fileId ? (
          <Image src={driveImageUrl(photo.fileId)} alt={p.pages[page]} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm text-muted">
            {p.noPhoto}
          </div>
        )}
      </div>

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

      {photo.fileId && (
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
    </div>
  );
}
