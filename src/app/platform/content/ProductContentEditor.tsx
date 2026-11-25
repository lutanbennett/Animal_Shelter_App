"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmProvider";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import { useWriteCall } from "@/lib/use-write-form";
import { WRITE_REQUEST_FIELD } from "@/lib/write-requests";
import { PRODUCT_KEY_RE, PRODUCT_PAGE_RE } from "@/lib/site/product-content";
import { deleteProductContent, removeProductPhoto, saveProductContent, uploadProductPhoto } from "./actions";

export type ContentRow = { page: string; key: string; en: string; th: string; driveFileId: string | null };

const field = "min-h-9 w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground";
const btn = "min-h-11 rounded border border-border bg-surface px-3 py-1 text-sm font-medium text-foreground hover:text-primary disabled:opacity-50 md:min-h-9";
const primary = "min-h-11 rounded bg-primary px-4 py-1 text-sm font-medium !text-white hover:opacity-90 disabled:opacity-50 md:min-h-9";

const idOf = (page: string, key: string) => `${page}\u0000${key}`;
/** A photo line is one whose name ends in "photo" (hero.photo, photo), or that already holds a photo. */
const isPhotoKey = (key: string) => key === "photo" || key.endsWith(".photo");

/** "bands.2.mock.title" belongs to the group "bands.2.mock"; a one-part key sits in the page's own group (""). */
const groupOf = (key: string) => {
  const i = key.lastIndexOf(".");
  return i < 0 ? "" : key.slice(0, i);
};

/** Natural order, so bands.2 comes before bands.10. */
const natural = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });

/**
 * The product site's lines (#pcmsx). A draft of every line is held here; Save sends only the lines that differ from what was
 * loaded, English and Thai together, in one atomic call. Controls that act are drawn only when the login holds aal2, which
 * is what the database functions demand (0441): at aal1 one notice sends the person to the step-up, as /platform does.
 */
export function ProductContentEditor({ rows, canWrite, stepUpPath }: { rows: ContentRow[]; canWrite: boolean; stepUpPath: string }) {
  const { t } = useI18n();
  const c = t.admin.productAdmin.content;
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const saveCall = useWriteCall();
  const deleteCall = useWriteCall();
  const photoCall = useWriteCall();
  const removeCall = useWriteCall();
  const [drafts, setDrafts] = useState<Record<string, { en: string; th: string }>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [lineMsg, setLineMsg] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [newLine, setNewLine] = useState({ page: "", key: "", en: "", th: "" });

  const pages = useMemo(() => {
    const byPage = new Map<string, ContentRow[]>();
    for (const r of rows) byPage.set(r.page, [...(byPage.get(r.page) ?? []), r]);
    return [...byPage.entries()].sort(([a], [b]) => (a === "home" ? -1 : b === "home" ? 1 : natural(a, b)));
  }, [rows]);

  const draftOf = (r: ContentRow) => drafts[idOf(r.page, r.key)] ?? { en: r.en, th: r.th };
  const changed = rows.filter((r) => {
    const d = drafts[idOf(r.page, r.key)];
    return d && (d.en !== r.en || d.th !== r.th);
  });

  function edit(r: ContentRow, part: "en" | "th", value: string) {
    setMsg(null);
    setDrafts((d) => ({ ...d, [idOf(r.page, r.key)]: { ...draftOf(r), [part]: value } }));
  }

  function save() {
    setMsg(null);
    const lines = changed.map((r) => ({ page: r.page, key: r.key, ...draftOf(r) }));
    startTransition(async () => {
      const result = await saveCall((id) => saveProductContent(lines, id));
      if (!result.ok) return setMsg({ ok: false, text: result.error ?? t.common.somethingWentWrong });
      setDrafts({});
      setMsg({ ok: true, text: c.saved("count" in result ? result.count : lines.length) });
      router.refresh();
    });
  }

  function addLine() {
    setMsg(null);
    if (!PRODUCT_PAGE_RE.test(newLine.page)) return setMsg({ ok: false, text: c.errors.badPage });
    if (!PRODUCT_KEY_RE.test(newLine.key)) return setMsg({ ok: false, text: c.errors.badKey });
    startTransition(async () => {
      const result = await saveCall((id) => saveProductContent([newLine], id));
      if (!result.ok) return setMsg({ ok: false, text: result.error ?? t.common.somethingWentWrong });
      setNewLine({ page: newLine.page, key: "", en: "", th: "" });
      setMsg({ ok: true, text: c.saved(1) });
      router.refresh();
    });
  }

  async function remove(r: ContentRow) {
    if (!(await confirm({ body: c.removeConfirm }))) return;
    startTransition(async () => {
      const result = await deleteCall((id) => deleteProductContent(r.page, r.key, id));
      setLineMsg((m) => ({ ...m, [idOf(r.page, r.key)]: result.ok ? { ok: true, text: "" } : { ok: false, text: result.error ?? t.common.somethingWentWrong } }));
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {!canWrite && (
        <p className="max-w-prose rounded-lg border border-border bg-surface p-3 text-sm text-foreground">
          {c.needsTwoStep}{" "}
          <Link href={stepUpPath} className="font-medium underline">
            {c.verify}
          </Link>
        </p>
      )}

      {canWrite && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
          <button type="button" className={primary} disabled={pending || changed.length === 0} onClick={save}>
            {pending ? c.saving : c.save}
          </button>
          <span className="text-sm text-muted" aria-live="polite">
            {changed.length === 0 ? c.nothingChanged : c.changedCount(changed.length)}
          </span>
          {msg && <span className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</span>}
        </div>
      )}

      {pages.length === 0 && <p className="text-sm text-muted">{c.noRows}</p>}

      {pages.map(([page, list]) => {
        const groups = new Map<string, ContentRow[]>();
        for (const r of list) groups.set(groupOf(r.key), [...(groups.get(groupOf(r.key)) ?? []), r]);
        const ordered = [...groups.entries()].sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : natural(a, b)));
        const dirty = list.filter((r) => changed.includes(r)).length;
        return (
          <details key={page} className="rounded-lg border border-border bg-surface" data-page={page}>
            <summary className="cursor-pointer px-4 py-3 text-base font-semibold text-foreground">
              {page} <span className="text-sm font-normal text-muted">({list.length}){dirty > 0 ? ` · ${c.changedCount(dirty)}` : ""}</span>
            </summary>
            <div className="flex flex-col gap-5 border-t border-border p-4">
              {ordered.map(([group, items]) => (
                <section key={group || "page"} className="flex flex-col gap-3">
                  {group && <h3 className="text-sm font-semibold text-muted">{group}</h3>}
                  {items.map((r) => (
                    <LineRow
                      key={r.key}
                      row={r}
                      draft={draftOf(r)}
                      shown={group ? r.key.slice(group.length + 1) : r.key}
                      canWrite={canWrite}
                      busy={pending}
                      onEdit={(part, v) => edit(r, part, v)}
                      onRemove={() => remove(r)}
                      message={lineMsg[idOf(r.page, r.key)]}
                      photoCall={photoCall}
                      removeCall={removeCall}
                      onPhotoMessage={(m) => setLineMsg((x) => ({ ...x, [idOf(r.page, r.key)]: m }))}
                      refresh={() => router.refresh()}
                    />
                  ))}
                </section>
              ))}
            </div>
          </details>
        );
      })}

      {canWrite && (
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <h2 className="text-base font-semibold text-foreground">{c.addTitle}</h2>
          <p className="max-w-prose text-sm text-muted">{c.addHint}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-foreground">
              {c.pageName}
              <input className={field} value={newLine.page} onChange={(e) => setNewLine({ ...newLine, page: e.target.value })} name="new-page" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-foreground">
              {c.lineKey}
              <input className={field} value={newLine.key} onChange={(e) => setNewLine({ ...newLine, key: e.target.value })} name="new-key" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-foreground">
              {c.english}
              <textarea className={field} rows={2} value={newLine.en} onChange={(e) => setNewLine({ ...newLine, en: e.target.value })} name="new-en" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-foreground">
              {c.thai}
              <textarea className={field} rows={2} value={newLine.th} onChange={(e) => setNewLine({ ...newLine, th: e.target.value })} name="new-th" />
            </label>
          </div>
          <div>
            <button type="button" className={btn} disabled={pending || !newLine.page || !newLine.key} onClick={addLine}>
              {c.add}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function LineRow({
  row,
  draft,
  shown,
  canWrite,
  busy,
  onEdit,
  onRemove,
  message,
  photoCall,
  removeCall,
  onPhotoMessage,
  refresh,
}: {
  row: ContentRow;
  draft: { en: string; th: string };
  shown: string;
  canWrite: boolean;
  busy: boolean;
  onEdit: (part: "en" | "th", v: string) => void;
  onRemove: () => void;
  message?: { ok: boolean; text: string };
  photoCall: ReturnType<typeof useWriteCall>;
  removeCall: ReturnType<typeof useWriteCall>;
  onPhotoMessage: (m: { ok: boolean; text: string }) => void;
  refresh: () => void;
}) {
  const { t } = useI18n();
  const c = t.admin.productAdmin.content;
  const fileRef = useRef<HTMLInputElement>(null);
  const [working, startWork] = useTransition();
  const photo = isPhotoKey(row.key) || !!row.driveFileId;

  function upload(file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.set("page", row.page);
    fd.set("key", row.key);
    fd.set("en", draft.en);
    fd.set("th", draft.th);
    fd.set("file", file);
    startWork(async () => {
      const result = await runUploadAction(file, t.admin.website.errors, () =>
        photoCall((id) => {
          fd.set(WRITE_REQUEST_FIELD, id);
          return uploadProductPhoto(fd);
        }),
      );
      onPhotoMessage(result.ok ? { ok: true, text: "" } : { ok: false, text: result.error ?? t.common.somethingWentWrong });
      if (result.ok) refresh();
    });
  }

  function clearPhoto() {
    startWork(async () => {
      const result = await removeCall((id) => removeProductPhoto(row.page, row.key, draft.en, draft.th, id));
      onPhotoMessage(result.ok ? { ok: true, text: "" } : { ok: false, text: result.error ?? t.common.somethingWentWrong });
      if (result.ok) refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-border bg-background p-3" data-key={row.key}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted">{shown}</span>
        {canWrite && (
          <button type="button" className="text-xs font-medium text-danger underline" disabled={busy || working} onClick={onRemove}>
            {c.remove}
          </button>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted">
          {c.english}
          <textarea className={field} rows={rowsFor(draft.en)} value={draft.en} readOnly={!canWrite} onChange={(e) => onEdit("en", e.target.value)} name={`en:${row.page}:${row.key}`} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {c.thai}
          <textarea className={field} rows={rowsFor(draft.th)} value={draft.th} readOnly={!canWrite} onChange={(e) => onEdit("th", e.target.value)} name={`th:${row.page}:${row.key}`} lang="th" />
        </label>
      </div>
      {photo && (
        <div className="flex flex-wrap items-center gap-3">
          {row.driveFileId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={driveImageUrl(row.driveFileId, 400)} alt={draft.en} className="h-24 w-auto rounded border border-border object-cover" />
          ) : (
            <span className="text-sm text-muted">{c.noPhoto}</span>
          )}
          {canWrite && (
            <>
              <button type="button" className={btn} disabled={busy || working} onClick={() => fileRef.current?.click()}>
                {working ? c.uploading : row.driveFileId ? c.replace : c.upload}
              </button>
              {row.driveFileId && (
                <button type="button" className={btn} disabled={busy || working} onClick={clearPhoto}>
                  {c.removePhoto}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
            </>
          )}
        </div>
      )}
      {message?.text && <p className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p>}
    </div>
  );
}

const rowsFor = (s: string) => Math.min(8, Math.max(1, Math.ceil(s.length / 60)));
