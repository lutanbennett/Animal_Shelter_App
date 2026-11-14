"use client";

import { useState } from "react";
import { driveImageUrl } from "@/lib/google/drive-client";

type Words = { choose: string; uploading: string; current: string; idLabel: string; remove: string; failed: string };

/**
 * The photo control on the merchandise product form. Uploads through /api/merch/photos (a route, never the Server
 * Action: Next's 1 MB action limit would refuse a phone photo) and fills the hidden-in-effect `photo` field the
 * action already reads. The id box stays for anyone who already has one. Drawn only for a login holding merch.manage
 * at edit (the caller passes canUpload), the activity the route asks.
 */
export function MerchPhotoField({
  initialId,
  canUpload,
  words,
  inputClass,
}: {
  initialId: string;
  canUpload: boolean;
  words: Words;
  inputClass: string;
}) {
  const [id, setId] = useState(initialId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/merch/photos", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as { driveFileId?: string; error?: string };
      if (!res.ok || !json.driveFileId) setError(json.error ?? words.failed);
      else setId(json.driveFileId);
    } catch {
      setError(words.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1 text-xs text-muted">
      {id && (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={driveImageUrl(id, 160)} alt={words.current} width={80} height={80} className="h-20 w-20 rounded border border-border object-contain" />
          <button type="button" className="underline" onClick={() => setId("")}>
            {words.remove}
          </button>
        </div>
      )}
      {canUpload && (
        <label className="flex flex-col">
          {words.choose}
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
            className="text-sm text-foreground"
          />
        </label>
      )}
      {busy && <span role="status">{words.uploading}</span>}
      {error && <span role="alert" className="text-red-600">{error}</span>}
      <label className="flex flex-col">
        {words.idLabel}
        <input name="photo" value={id} onChange={(e) => setId(e.target.value)} className={inputClass} />
      </label>
    </div>
  );
}
