"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { uploadResidentPhoto } from "@/components/PhotoUploader";
import { ADOPTION_UPDATE_CHANNELS } from "@/lib/adoption-updates/options";
import { saveAdoptionUpdate } from "./actions";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";
const textareaClass = `${inputClass} field-sizing-content`;

export type SenderOption = { id: string; name: string };

type PhotoItem = {
  key: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

function channelButtonClass(active: boolean) {
  return `flex-1 rounded px-3 py-2 text-sm font-medium transition ${
    active ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
  }`;
}

/**
 * Add or correct an update from an adopter. Saving writes the update first
 * (saveAdoptionUpdate), then sends each photo through the ordinary resident
 * photo route with the update's id, so every photo is tagged in the same
 * insert that records it (0097). If a photo fails, the update is already
 * saved: the form stays open on it, the failed photos can be retried, and
 * saving again corrects the same row rather than adding a second one.
 */
export function AdoptionUpdateForm({
  residentId,
  update,
  adopters,
  otherContacts,
  defaultSenderId,
  today,
}: {
  residentId: string;
  /** The update being corrected, or null to add one. */
  update: {
    id: string;
    received_on: string;
    sender_contact_id: string | null;
    channel: string;
    note: string | null;
  } | null;
  /** Carers of this resident's Adopt placements, newest first. */
  adopters: SenderOption[];
  /** Every other contact, for a partner or grown child who sent it instead. */
  otherContacts: SenderOption[];
  /** The latest Adopt placement's carer — preselected on a new update. */
  defaultSenderId: string | null;
  /** YYYY-MM-DD, server-computed so max matches the server's check. */
  today: string;
}) {
  const { t } = useI18n();
  const a = t.adoptionUpdates;
  const router = useRouter();
  const sectionHref = `/residents/${residentId}/adoption-updates`;

  const [savedId, setSavedId] = useState<string | null>(update?.id ?? null);
  const [receivedOn, setReceivedOn] = useState(update?.received_on ?? today);
  const [senderId, setSenderId] = useState(
    update ? (update.sender_contact_id ?? "") : (defaultSenderId ?? ""),
  );
  const [channel, setChannel] = useState(update?.channel ?? "");
  const [note, setNote] = useState(update?.note ?? "");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function patchPhoto(key: string, patch: Partial<PhotoItem>) {
    setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const items = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .map<PhotoItem>((file) => ({
        key: `${file.name}-${file.size}-${Math.random()}`,
        file,
        progress: 0,
        status: file.size > MAX_UPLOAD_BYTES ? "error" : "queued",
        error: file.size > MAX_UPLOAD_BYTES ? a.form.fileTooLarge : undefined,
      }));
    setPhotos((prev) => [...prev, ...items]);
  }

  /** Sequential, like PhotoUploader: the route creates Drive folders on first use. */
  async function sendPhotos(updateId: string, items: PhotoItem[]) {
    let failed = 0;
    for (const item of items) {
      patchPhoto(item.key, { status: "uploading", progress: 0, error: undefined });
      const result = await uploadResidentPhoto(
        t,
        residentId,
        item.file,
        { dateTaken: receivedOn, adoptionUpdateId: updateId },
        (progress) => patchPhoto(item.key, { progress }),
      );
      if (result.error) {
        failed += 1;
        patchPhoto(item.key, { status: "error", error: result.error });
      } else {
        patchPhoto(item.key, { status: "done", progress: 100 });
      }
    }
    return failed;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!channel) {
      setError(a.errors.channelRequired);
      return;
    }
    setPending(true);
    try {
      const result = await saveAdoptionUpdate(residentId, savedId, {
        receivedOn,
        senderContactId: senderId || null,
        channel,
        note: note || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedId(result.id);
      const toSend = photos.filter((p) => p.status === "queued" || p.status === "error");
      const oversized = toSend.filter((p) => p.file.size > MAX_UPLOAD_BYTES);
      const failed =
        (await sendPhotos(
          result.id,
          toSend.filter((p) => p.file.size <= MAX_UPLOAD_BYTES),
        )) + oversized.length;
      if (failed > 0) {
        setError(a.form.photosFailed(failed));
        router.refresh();
        return;
      }
      router.push(sectionHref);
    } catch (err) {
      // The call itself failed (offline); the action returns its own refusals.
      console.error("Saving adoption update failed:", err);
      setError(a.errors.saveFailed);
    } finally {
      setPending(false);
    }
  }

  const senderKnown =
    !senderId ||
    adopters.some((c) => c.id === senderId) ||
    otherContacts.some((c) => c.id === senderId);

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      {savedId && !update && !pending && (
        <p className="rounded-lg border border-border bg-surface p-3 text-sm text-muted">
          {a.form.savedRetryHint}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="receivedOn" className="text-sm font-medium text-muted">
            {a.form.receivedOn} <span className="text-danger">*</span>
          </label>
          <input
            id="receivedOn"
            type="date"
            required
            max={today}
            value={receivedOn}
            onChange={(e) => setReceivedOn(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="senderId" className="text-sm font-medium text-muted">
            {a.form.sender}
          </label>
          <select
            id="senderId"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
            className={inputClass}
          >
            <option value="">{a.form.noSender}</option>
            {adopters.length > 0 && (
              <optgroup label={a.form.adoptersGroup}>
                {adopters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            )}
            {otherContacts.length > 0 && (
              <optgroup label={a.form.otherContactsGroup}>
                {otherContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            )}
            {!senderKnown && <option value={senderId}>{a.form.archivedSender}</option>}
          </select>
          <p className="text-xs text-muted">{a.form.senderHint}</p>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-muted">
          {a.form.channel} <span className="text-danger">*</span>
        </legend>
        <div
          role="radiogroup"
          aria-label={a.form.channel}
          className="flex gap-1 rounded-lg border border-border bg-surface p-1"
        >
          {ADOPTION_UPDATE_CHANNELS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={channel === c}
              onClick={() => setChannel(c)}
              className={channelButtonClass(channel === c)}
            >
              {a.channels[c]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="note" className="text-sm font-medium text-muted">
          {a.form.note}
        </label>
        <textarea
          id="note"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={a.form.notePlaceholder}
          className={textareaClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="photos" className="text-sm font-medium text-muted">
          {update ? a.form.addMorePhotos : a.form.photos}
        </label>
        <input
          id="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          className="text-sm text-foreground file:mr-3 file:rounded file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-surface-hover"
        />
        <p className="text-xs text-muted">{a.form.photosHint}</p>
        {photos.length > 0 && (
          <ul className="flex flex-col gap-2">
            {photos.map((item) => (
              <li
                key={item.key}
                className="flex items-center gap-3 rounded border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="flex-1 truncate text-foreground">{item.file.name}</span>
                {item.status === "error" ? (
                  <span className="text-xs text-danger">{item.error}</span>
                ) : item.status === "done" ? (
                  <span className="text-xs font-medium text-success">
                    {t.photos.uploader.done}
                  </span>
                ) : item.status === "uploading" ? (
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                ) : null}
                {item.status !== "uploading" && item.status !== "done" && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setPhotos((prev) => prev.filter((p) => p.key !== item.key))}
                    aria-label={t.common.dismiss}
                    className="text-muted hover:text-foreground"
                  >
                    &times;
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? a.form.saving : update || savedId ? a.form.saveChanges : a.form.save}
        </button>
        <Link
          href={sectionHref}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {savedId && !update ? a.form.done : t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
