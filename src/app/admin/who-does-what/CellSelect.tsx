"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { setCell } from "./actions";

/**
 * One editable box on the grid: a choice saved as soon as it is picked. A refusal (a prerequisite, a lost
 * 2-step session) puts the box back and says why beside it.
 */
export function CellSelect({
  roleKey,
  activity,
  kind,
  level,
  label,
}: {
  roleKey: string;
  activity: string;
  kind: "level" | "yesno";
  level: number;
  label: string;
}) {
  const { t } = useI18n();
  const w = t.admin.whoDoesWhat;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const options =
    kind === "yesno"
      ? [
          { v: 0, text: w.levels.no },
          { v: 2, text: w.levels.yes },
        ]
      : [
          { v: 0, text: w.levels.none },
          { v: 1, text: w.levels.read },
          { v: 2, text: w.levels.edit },
        ];
  return (
    <div className="flex flex-col items-center gap-1">
      <select
        aria-label={label}
        value={level}
        disabled={pending}
        onChange={(e) => {
          const next = Number(e.target.value);
          setError(null);
          startTransition(async () => {
            const result = await setCell(roleKey, activity, next);
            if (!result.ok) setError(result.error);
            router.refresh();
          });
        }}
        className="min-h-11 rounded border border-border bg-background px-1 py-1 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:min-h-0"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.text}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="max-w-40 text-xs text-danger [overflow-wrap:anywhere]">
          {error}
        </p>
      )}
    </div>
  );
}
