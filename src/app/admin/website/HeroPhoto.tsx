"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { removeHeroPhoto, uploadHeroPhoto } from "./actions";

export function HeroPhoto({
  heroDriveFileId,
}: {
  heroDriveFileId: string | null;
}) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
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
      const result = await uploadHeroPhoto(formData);
      if (result && "error" in result) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: t.admin.website.hero.updated });
      }
    });
  }

  function handleRemove() {
    if (!window.confirm(t.admin.website.hero.removeConfirm)) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await removeHeroPhoto();
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : t.common.failedToRemove,
        });
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

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
        >
          {isPending ? t.common.uploading : t.admin.website.hero.replace}
        </button>
        {heroDriveFileId && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleRemove}
            className="rounded border border-danger/40 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            {t.admin.website.hero.remove}
          </button>
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
