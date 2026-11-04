"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import type { AssistantResident } from "@/lib/assistant/data";

/**
 * The other residents the model found in the sentence, shown above the card so the person can drop any that are wrong
 * before Confirm. What is left is what gets tagged in the saved note (docs/decisions/2026-11-04-tags-assistant-notes.md).
 * Nothing is drawn when there are none.
 */
export function MentionChips({
  ids,
  residents,
  onRemove,
}: {
  ids: string[];
  residents: AssistantResident[];
  onRemove: (id: string) => void;
}) {
  const { t } = useI18n();
  const shown = ids.flatMap((id) => residents.filter((r) => r.id === id));
  if (shown.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium text-muted">{t.assistant.mentionsLabel}</span>
      {shown.map((r) => (
        <span key={r.id} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
          #{r.name}
          <button
            type="button"
            onClick={() => onRemove(r.id)}
            aria-label={t.assistant.mentionsRemove(r.name)}
            className="text-muted hover:text-foreground"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
