"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Languages, X } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { BodyToolbar } from "@/components/BodyToolbar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ACTION_ICONS } from "@/components/hub-icons";
import { SiteBodyView } from "@/components/SiteBodyView";
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
 *
 * `pageBody` is for a website page's text (lib/site/body.ts's format): the
 * original, the translation and a live preview of the typed translation are
 * drawn as the public page draws them, and the editor gets the same style
 * toolbar as the English. Off by default, so every other field stays plain.
 */
export function TranslationPanel({
  row,
  canManage,
  showOriginal = false,
  recordPath,
  defaultOpen = false,
  onChange,
  pageBody = false,
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
  /** The field is a website page's text: styles and formatted previews (see above). */
  pageBody?: boolean;
}) {
  const { t, locale } = useI18n();
  const [current, setCurrent] = useState(row);
  const [editing, setEditing] = useState(defaultOpen && canManage);
  const [text, setText] = useState(row.text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const textId = useId();

  const tr = t.translations;
  const targetName = tr.language[current.target_lang];
  const sourceName = tr.language[current.source_lang];
  const readsTranslation = locale === current.target_lang;
  const isStale = current.status === "stale";
  // Written by the translation worker (worker/translations.mjs), not yet read by a person.
  const isMachineDraft = current.status === "draft" && !!current.engine && current.engine !== "human";

  // A reader who can't edit sees the panel only when there is a
  // translation in their language to show: the original is already on
  // the page, and whether one is still owed is a manager's concern.
  // A machine draft is the managers' to check; nobody else is shown it as if it were settled.
  if (!canManage && (!readsTranslation || !current.text || isMachineDraft)) return null;

  // A page's text as the public page draws it (styles, headings, lists), anything else as typed.
  const prose = (value: string, lang: string, className = "") =>
    pageBody ? (
      <div lang={lang} className={className}>
        <SiteBodyView body={value} size="lg" newTabLabel={t.common.opensInNewTab} />
      </div>
    ) : (
      <p lang={lang} className={`whitespace-pre-line text-foreground ${className}`}>
        {value}
      </p>
    );

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await approveTranslation(current.id, text, recordPath);
      if (!result.ok) {
        setError(result.error);
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
      if (!result.ok) {
        setError(result.error);
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
          <span className="ml-auto">
            <ActionButton
              icon={current.text ? ACTION_ICONS.edit : ACTION_ICONS.add}
              compact
              onClick={() => setEditing(true)}
            >
              {current.text ? tr.editTranslation : tr.addTranslation}
            </ActionButton>
          </span>
        )}
      </div>

      {isMachineDraft && <p className="text-xs text-muted">{tr.machineDraft}</p>}

      {showOriginal && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">{tr.original(sourceName)}</span>
          {prose(current.source_text, current.source_lang)}
        </div>
      )}

      {isStale && current.reviewed_source_text && (editing || showOriginal) && (
        <div className="grid gap-2 rounded border border-warning/40 bg-warning/10 p-2 text-xs sm:grid-cols-2">
          <div>
            <span className="font-medium text-muted">{tr.previousOriginal}</span>
            {prose(current.reviewed_source_text, current.source_lang, "mt-0.5")}
          </div>
          {!showOriginal && (
            <div>
              <span className="font-medium text-muted">{tr.currentOriginal}</span>
              {prose(current.source_text, current.source_lang, "mt-0.5")}
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
          <div className="flex flex-col gap-1">
            <label htmlFor={textId} className="text-xs font-medium text-muted">
              {tr.translationInto(targetName)}
            </label>
            {/* Drawn only in the editor, which only canManage opens: the same check approveTranslation asks. */}
            {pageBody && canManage && (
              <>
                <p className="text-xs text-muted">{t.admin.website.pages.marks.hint}</p>
                <BodyToolbar target={textRef} />
              </>
            )}
            <textarea
              id={textId}
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={
                pageBody
                  ? Math.min(20, Math.max(6, text.split("\n").length + 2))
                  : Math.min(8, Math.max(3, Math.ceil(current.source_text.length / 70)))
              }
              placeholder={tr.placeholder(targetName)}
              lang={current.target_lang}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {pageBody && (
            <div className={`grid gap-3 rounded border border-border bg-background p-3 ${showOriginal ? "" : "md:grid-cols-2"}`}>
              {!showOriginal && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted">{tr.original(sourceName)}</span>
                  {prose(current.source_text, current.source_lang)}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted">{tr.lookPreview(targetName)}</span>
                {text.trim() ? prose(text, current.target_lang) : <p className="text-xs text-muted">{tr.noTranslation(targetName)}</p>}
              </div>
            </div>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            {current.text && (
              <span className="mr-auto">
                <ActionButton
                  icon={ACTION_ICONS.clear}
                  variant="danger"
                  compact
                  onClick={() => setConfirmClear(true)}
                  disabled={isPending}
                >
                  {tr.clear}
                </ActionButton>
              </span>
            )}
            <ActionButton
              icon={X}
              compact
              onClick={() => {
                setEditing(false);
                setText(current.text ?? "");
                setError(null);
              }}
              disabled={isPending}
            >
              {t.common.cancel}
            </ActionButton>
            <ActionButton type="submit" icon={ACTION_ICONS.approve} variant="primary" compact disabled={isPending}>
              {isPending ? t.common.saving : tr.approve}
            </ActionButton>
          </div>
        </form>
      ) : current.text ? (
        prose(current.text, current.target_lang)
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
