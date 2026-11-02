"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { openTagQuery, tagText, TAGS_FIELD_SUFFIX, type NoteTag } from "@/lib/note-tags/text";

type Match = { id: string; name: string; resident_code: string | null };

/**
 * A note box where typing # opens a resident picker (docs/decisions/2026-11-02-resident-tags-app.md). The text keeps
 * the name as written; the pick goes into a hidden field next to the box (`<name>__tags`, JSON of id and name) and the
 * server writes the links in the same save as the note.
 *
 * `canTag` defaults to FALSE: the caller passes can(perms, <the activity the save asks>) and a box without it is a
 * plain textarea with no hidden field, so its save leaves existing links alone. Hiding is the courtesy; the database
 * policy on resident_note_tags is the check.
 */
export function TagNoteField({
  name,
  id,
  rows = 3,
  maxLength,
  placeholder,
  defaultValue = "",
  className,
  required,
  canTag = false,
  initialTags = [],
  selfId,
  onTextChange,
  onTagsChange,
}: {
  name: string;
  id?: string;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  required?: boolean;
  canTag?: boolean;
  initialTags?: readonly NoteTag[];
  /** The resident the note is written on, never offered as a tag. */
  selfId?: string;
  /** For a form that keeps the note in state rather than reading the box on submit. */
  onTextChange?: (value: string) => void;
  onTagsChange?: (tags: NoteTag[]) => void;
}) {
  const { t } = useI18n();
  const reactId = useId();
  const listId = `${reactId}-tags`;
  const ref = useRef<HTMLTextAreaElement>(null);
  const [picks, setPicks] = useState<NoteTag[]>([...initialTags]);
  const [open, setOpen] = useState<{ start: number; query: string } | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/residents/tag-search?q=${encodeURIComponent(open.query)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("search");
        const body = (await res.json()) as { residents: Match[] };
        setMatches(body.residents.filter((r) => r.id !== selfId));
        setFailed(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setFailed(true);
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, selfId]);

  function refresh() {
    const el = ref.current;
    if (!canTag || !el) return;
    const next = openTagQuery(el.value, el.selectionStart ?? el.value.length);
    setOpen(next);
    if (!next) setMatches(null);
  }

  function choose(match: Match) {
    const el = ref.current;
    if (!el || !open) return;
    const caret = el.selectionStart ?? el.value.length;
    const written = `${tagText(match.name)} `;
    const next = el.value.slice(0, open.start) + written + el.value.slice(caret);
    // Set through the native setter so React sees an ordinary edit.
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(el, next);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    const pos = open.start + written.length;
    el.setSelectionRange(pos, pos);
    el.focus();
    const next2 = picks.some((p) => p.id === match.id) ? picks : [...picks, { id: match.id, name: match.name }];
    setPicks(next2);
    onTagsChange?.(next2);
    setOpen(null);
    setMatches(null);
  }

  return (
    <div className="relative flex flex-col gap-1">
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className={className}
        onInput={(e) => {
          onTextChange?.(e.currentTarget.value);
          refresh();
        }}
        onClick={refresh}
        onKeyUp={(e) => {
          if (e.key === "Escape") setOpen(null);
          else if (e.key.startsWith("Arrow")) refresh();
        }}
        aria-describedby={canTag ? `${listId}-hint` : undefined}
      />
      {canTag && (
        <>
          <input type="hidden" name={name + TAGS_FIELD_SUFFIX} value={JSON.stringify(picks)} />
          <p id={`${listId}-hint`} className="text-xs text-muted">
            {t.residents.tags.hint}
          </p>
          {open && (
            <ul
              id={listId}
              role="listbox"
              aria-label={t.residents.tags.listLabel}
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-md border border-border bg-surface shadow-lg"
            >
              {failed ? (
                <li className="px-3 py-3 text-sm text-danger">{t.residents.tags.searchFailed}</li>
              ) : matches === null ? (
                <li className="px-3 py-3 text-sm text-muted">{t.residents.tags.searching}</li>
              ) : matches.length === 0 ? (
                <li className="px-3 py-3 text-sm text-muted">{t.residents.tags.noMatch}</li>
              ) : (
                matches.map((m) => (
                  <li key={m.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(m)}
                      className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-surface-hover"
                    >
                      <span>{m.name}</span>
                      {m.resident_code && <span className="text-xs text-muted">{m.resident_code}</span>}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
