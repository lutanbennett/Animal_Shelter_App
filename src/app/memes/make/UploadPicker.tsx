"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { MemeMaker } from "./MemeMaker";

/**
 * "Upload a photo": the file is read in this browser and drawn on the canvas; it is not sent anywhere until the
 * finished meme is saved, and the original is never filed. JPEG, PNG or WebP only: browsers cannot draw HEIC.
 */
export function UploadPicker() {
  const { t } = useI18n();
  const m = t.memes.maker;
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => () => void (src && URL.revokeObjectURL(src)), [src]);

  if (src) return <MemeMaker photoSrc={src} sourceKind="upload" sourceFileId={null} residentLabel="" />;
  return (
    <div className="flex max-w-xl flex-col gap-2">
      <label htmlFor="maker-upload" className="text-sm font-medium text-muted">{m.uploadChoose}</label>
      <input
        id="maker-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setSrc(URL.createObjectURL(f));
        }}
        className="min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground"
      />
      <p className="text-sm text-muted">{m.uploadHint}</p>
    </div>
  );
}
