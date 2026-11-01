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
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import { removeHeroPhoto, uploadHeroPhoto } from "./actions";

export function HeroPhoto({
  heroDriveFileId,
  canChange = false,
}: {
  heroDriveFileId: string | null;
  /** can(perms, "website.gallery"), the activity uploadHeroPhoto / removeHeroPhoto ask. Off unless the caller says so. */
  canChange?: boolean;
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  // One per action: an id kept from an unknown save and sent to another action is refused by claim_write_request().
  const saveUpload = useWriteCall();
  const saveRemove = useWriteCall();
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
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
          return uploadHeroPhoto(formData);
        }),
      );
      if (result && "error" in result) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: t.admin.website.hero.updated });
      }
    });
  }

  async function handleRemove() {
    if (!await confirm({ body: t.admin.website.hero.removeConfirm })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await saveRemove((requestId) => removeHeroPhoto(requestId));
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {t.admin.website.hero.heading}
        </h2>
        <p className="text-sm text-muted">{t.admin.website.hero.subtitle}</p>
      </div>

      <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded border border-border bg-background">
        {heroDriveFileId ? (
          <Image
            src={driveImageUrl(heroDriveFileId)}
            alt={t.admin.website.hero.heading}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            {t.admin.website.hero.noPhoto}
          </div>
        )}
      </div>

      {canChange && (
      <div className="flex items-center gap-3">
        <ActionButton icon={ACTION_ICONS.uploadImage} disabled={isPending} onClick={() => inputRef.current?.click()}>
          {isPending && <PendingPuppy />}
          {isPending ? t.common.uploading : t.admin.website.hero.replace}
        </ActionButton>
        {heroDriveFileId && (
          <ActionButton variant="danger" icon={ACTION_ICONS.removeImage} disabled={isPending} onClick={handleRemove}>
            {t.admin.website.hero.remove}
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

      {message && (
        <p
          className={`text-sm ${
            message.type === "error" ? "text-danger" : "text-success"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
