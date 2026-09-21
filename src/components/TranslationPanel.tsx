"use client";

import { useState, useTransition } from "react";
import { Languages } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { TranslationRow, TranslationStatus } from "@/lib/translations/types";
import {
  approveTranslation,
  clearTranslation,
} from "@/app/management/translations/actions";

/**
 * A translatable field's other-language text, wherever the field is shown:
 * the status, the translation (if any) and, for a manager, the editor.
 * The same component sits under the bio on the resident hub, under a
 * project story, on a photo caption and in every row of the manager's
 * queue, so translating in place and working through the queue are the
 * same action on the same row.
 *
 * What a reader sees depends on which language they read:
 *  - their language is the original's → the original is on the page
 *    already, so a manager gets the status and the editor and anyone
 *    else gets nothing (the record stays uncluttered);
 *  - their language is the translation's → the translation, labelled with
 *    its status, under the original — or a note that there isn't one.
 * The caller renders the original itself; `showOriginal` adds it here,
 * which the queue page wants and the record pages don't.
 */
export function TranslationPanel({
  row,
  canManage,
  showOriginal = false,
  recordPath,
  defaultOpen = false,
  onChange,
}: {
  row: TranslationRow;
  canManage: boolean;
  showOriginal?: boolean;
  /** The page to refresh besides the row's own record (a photo caption's folder). */
  recordPath?: string | null;
  /** Start in the editor (the queue page opens every row ready to type). */
  defaultOpen?: boolean;
  /** Called with the saved row; the queue drops approved rows from its list. */
  onChange?: (row: TranslationRow) => void;
}) {
  const { t, locale } = useI18n();
  const [current, setCurrent] = useState(row);
  const [editing, setEditing] = useState(defaultOpen && canManage);
  const [text, setText] = useState(row.text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isPending, startTransition] = useTransition();

  const tr = t.translations;
  const targetName = tr.language[current.target_lang];
  const sourceName = tr.language[current.source_lang];
  const readsTranslation = locale === current.target_lang;
  const isStale = current.status === "stale";

  // A reader who can't edit sees the panel only when there is a
  // translation in their language to show: the original is already on
  // the page, and whether one is still owed is a manager's concern.
  if (!canManage && (!readsTranslation || !current.text)) return null;

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await approveTranslation(current.id, text, recordPath);
      if (result.error || !result.row) {
        setError(result.error ?? t.common.failedToSave);
        return;
      }
      setCurrent(result.row);
      setText(result.row.text ?? "");
      setEditing(false);
      onChange?.(result.row);
    });
  }

  function clear() {
    setError(null);
    startTransition(async () => {
      const result = await clearTranslation(current.id, recordPath);
      setConfirmClear(false);
      if (result.error || !result.row) {
        setError(result.error ?? t.common.failedToRemove);
        return;
      }
      setCurrent(result.row);
      setText("");
      setEditing(false);
      onChange?.(result.row);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-border/60 bg-background/40 p-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Languages className="h-3.5 w-3.5 text-muted" aria-hidden />
        <span className="text-xs font-medium text-muted">
          {tr.translationLabel(targetName)}
        </span>
        <StatusChip status={current.status} />
        {canManage && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto text-xs font-medium text-primary hover:underline"
          >
            {current.text ? tr.editTranslation : tr.addTranslation}
          </button>
        )}
      </div>

      {showOriginal && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">{tr.original(sourceName)}</span>
          <p className="whitespace-pre-line text-foreground">{current.source_text}</p>
        </div>
      )}

      {isStale && current.reviewed_source_text && (editing || showOriginal) && (
        <div className="grid gap-2 rounded border border-warning/40 bg-warning/10 p-2 text-xs sm:grid-cols-2">
          <div>
            <span className="font-medium text-muted">{tr.previousOriginal}</span>
            <p className="mt-0.5 whitespace-pre-line text-foreground">
              {current.reviewed_source_text}
            </p>
          </div>
          {!showOriginal && (
            <div>
              <span className="font-medium text-muted">{tr.currentOriginal}</span>
              <p className="mt-0.5 whitespace-pre-line text-foreground">{current.source_text}</p>
            </div>
          )}
        </div>
      )}

      {editing ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            {tr.translationInto(targetName)}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={Math.min(8, Math.max(3, Math.ceil(current.source_text.length / 70)))}
              placeholder={tr.placeholder(targetName)}
              lang={current.target_lang}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </label>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            {current.text && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                disabled={isPending}
                className="mr-auto rounded border border-danger/40 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
              >
                {tr.clear}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setText(current.text ?? "");
                setError(null);
              }}
              disabled={isPending}
              className="rounded border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? t.common.saving : tr.approve}
            </button>
          </div>
        </form>
      ) : current.text ? (
        <p lang={current.target_lang} className="whitespace-pre-line text-foreground">
          {current.text}
        </p>
      ) : (
        <p className="text-xs text-muted">{tr.noTranslation(targetName)}</p>
      )}

      <ConfirmDialog
        open={confirmClear}
        title={tr.clear}
        body={tr.clearConfirm}
        confirmLabel={tr.clear}
        pendingLabel={t.common.saving}
        pending={isPending}
        onCancel={() => setConfirmClear(false)}
        onConfirm={clear}
      />
    </div>
  );
}

const CHIP: Record<TranslationStatus, string> = {
  pending: "border-border text-muted",
  draft: "border-primary/40 bg-primary/10 text-primary",
  approved: "border-success/40 bg-success/10 text-success",
  stale: "border-warning/60 bg-warning/15 text-foreground",
};

export function StatusChip({ status }: { status: TranslationStatus }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${CHIP[status]}`}
    >
      {t.translations.status[status]}
    </span>
  );
}
