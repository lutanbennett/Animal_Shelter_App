"use client";

import { useState } from "react";
import { ResidentPicker, type ResidentOption } from "@/components/ResidentPicker";

/** Which resident the appeal is for: the donation form's search picker, then a plain GET to ?resident=. */
export function ResidentChooser({
  residents,
  label,
  continueLabel,
}: {
  residents: ResidentOption[];
  label: string;
  continueLabel: string;
}) {
  const [ids, setIds] = useState<string[]>([]);
  return (
    <form method="get" className="flex max-w-md flex-col gap-3">
      <span className="text-sm font-medium text-muted">{label}</span>
      <ResidentPicker single residents={residents} selectedIds={ids} onChange={setIds} triggerLabel={label} />
      <input type="hidden" name="resident" value={ids[0] ?? ""} />
      <button
        type="submit"
        disabled={ids.length === 0}
        className="min-h-11 self-start rounded bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {continueLabel}
      </button>
    </form>
  );
}
