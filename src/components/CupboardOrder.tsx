"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";

export type CupboardOrderItem = { id: string; name: string; unit: string };

/**
 * The cupboard order of Management → Medication stock or → Diet stock, one
 * row per item with Move up / Move down (0161's sort_order). Buttons, not
 * drag: everyone but the Director is on a phone, and RowActionButton is the
 * 44 px target there. Each press saves at once, so Back loses nothing.
 */
export function CupboardOrder({
  items,
  move,
}: {
  items: CupboardOrderItem[];
  move: (id: string, direction: "up" | "down") => Promise<ActionResult>;
}) {
  const { t } = useI18n();
  const o = t.management.stock.order;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(id: string, direction: "up" | "down") {
    setError(null);
    startTransition(async () => {
      try {
        const result = await move(id, direction);
        if (!result.ok) setError(result.error);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.common.failedToSave);
      }
    });
  }

  if (items.length === 0) return <p className="text-sm text-muted">{o.empty}</p>;

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-danger">{error}</p>}
      <ol className="flex flex-col gap-2" aria-busy={isPending}>
        {items.map((item, index) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted" title={o.position(index + 1)}>
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="break-words font-medium text-foreground">{item.name}</span>
              <span className="text-xs text-muted">{item.unit}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <RowActionButton
                disabled={isPending || index === 0}
                onClick={() => run(item.id, "up")}
                label={o.moveUp(item.name)}
                icon={ACTION_ICONS.moveUp}
              />
              <RowActionButton
                disabled={isPending || index === items.length - 1}
                onClick={() => run(item.id, "down")}
                label={o.moveDown(item.name)}
                icon={ACTION_ICONS.moveDown}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
