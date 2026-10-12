"use client";

import { useRef } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { PendingFileList, type useDeferredUploads } from "@/components/DeferredUploads";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * "Add a photo of the bill", for a form that saves a record first (a delivery): the photos are
 * collected here and pushed to the new record's bill route once it exists (useDeferredUploads).
 * On a phone the picker offers the camera. Several photos are allowed: a long bill, a second page.
 */
export function BillPhotoField({ uploads }: { uploads: ReturnType<typeof useDeferredUploads> }) {
  const { t } = useI18n();
  const p = t.bills.photo;
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <ActionButton icon={ACTION_ICONS.uploadImage} onClick={() => inputRef.current?.click()}>
          {uploads.files.length > 0 ? p.addAnother : p.add}
        </ActionButton>
        <span className="text-xs text-muted">{p.hint}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        hidden
        onChange={(e) => {
          uploads.addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <PendingFileList files={uploads.files} onRemove={uploads.removeFile} onRetry={null} />
    </div>
  );
}
