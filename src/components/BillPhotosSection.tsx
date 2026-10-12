"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { uploadAttachmentFile } from "@/components/AttachmentUploader";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type BillPhoto = { id: string; url: string; name: string; isPdf: boolean };

/**
 * The bill photos already filed on a delivery or a clinic visit, with a button to add another (a
 * second page, or a bill photographed after the record was saved). On a phone the picker offers
 * the camera. Not shown to anyone who may not see bills: the page decides, the database enforces.
 */
export function BillPhotosSection({
  kind,
  ownerId,
  photos,
  canAdd,
}: {
  kind: "stock_receipt" | "clinic_visit";
  ownerId: string;
  photos: BillPhoto[];
  canAdd: boolean;
}) {
  const { t } = useI18n();
  const p = t.bills.photo;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    for (const file of files) {
      const result = await uploadAttachmentFile(t, `/api/bills/${kind}/${ownerId}`, file, () => {});
      if (result.error) setError(result.error);
    }
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-2">
      {photos.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {photos.map((ph) => (
            <li key={ph.id} className="h-20 w-16 overflow-hidden rounded border border-border bg-surface-hover">
              <a href={ph.url} target="_blank" rel="noreferrer" className="block h-full w-full" aria-label={p.alt}>
                {ph.isPdf ? (
                  <span className="flex h-full w-full items-center justify-center text-muted">
                    <FileText aria-hidden="true" className="h-6 w-6" />
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ph.url} alt={p.alt} className="h-full w-full object-cover" />
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
      {canAdd && (
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton compact icon={ACTION_ICONS.uploadImage} disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? t.common.saving : photos.length > 0 ? p.addAnother : p.add}
          </ActionButton>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            hidden
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
