"use client";

import { driveImageUrl } from "@/lib/google/drive-client";
import { placeName } from "@/lib/enclosures/names";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { AssistantResident } from "@/lib/assistant/data";

/**
 * "Which one do you mean?" — shown when a name matched more than one
 * resident. The name is the thing that was ambiguous, so the choice is
 * made on everything else about them: the code, where they are, and their
 * face. Picking one collapses it back to the ordinary select.
 */
export function ResidentCandidates({
  candidates,
  onPick,
}: {
  candidates: AssistantResident[];
  onPick: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted">{t.assistant.whichOne}</p>
      <ul className="flex flex-wrap gap-2">
        {candidates.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onPick(r.id)}
              className="flex w-36 flex-col gap-2 rounded-lg border border-border bg-background p-2 text-left transition hover:bg-surface-hover"
            >
              {r.photoFileId ? (
                <img
                  src={driveImageUrl(r.photoFileId)}
                  alt=""
                  className="aspect-square w-full rounded-md object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-md bg-surface-hover text-center text-xs text-muted">
                  {t.enclosures.hub.noPhoto}
                </div>
              )}
              <span className="truncate text-sm font-medium text-foreground">
                {r.thaiName ? `${r.name} (${r.thaiName})` : r.name}
              </span>
              <span className="text-xs text-muted">{r.code}</span>
              <span className="truncate text-xs text-muted">
                {placeName(locale, r.enclosureName, r.enclosureNameTh) || t.common.dash}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
