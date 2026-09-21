"use client";

import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createEnclosure } from "./actions";

type ZoneOption = { id: string; name: string };

export function CreateEnclosureForm({ zones }: { zones: ZoneOption[] }) {
  const [state, formAction, pending] = useActionState(
    createEnclosure,
    undefined,
  );
  const { t } = useI18n();

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-muted">
          {t.admin.enclosures.createForm.name}
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-48 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nameTh" className="text-sm font-medium text-muted">
          {t.admin.enclosures.createForm.nameTh}
        </label>
        <input
          id="nameTh"
          name="nameTh"
          lang="th"
          className="w-48 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="zoneId" className="text-sm font-medium text-muted">
          {t.admin.enclosures.createForm.zone}
        </label>
        <select
          id="zoneId"
          name="zoneId"
          required
          defaultValue=""
          className="w-48 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        >
          <option value="" disabled>
            {t.admin.enclosures.createForm.selectZone}
          </option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="capacity" className="text-sm font-medium text-muted">
          {t.admin.enclosures.createForm.capacity}
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={0}
          className="w-24 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted">
          {t.admin.enclosures.createForm.notes}
        </label>
        <input
          id="notes"
          name="notes"
          className="w-56 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? t.common.creating : t.admin.enclosures.createForm.addButton}
      </button>
      {state && "error" in state && (
        <p className="w-full text-sm text-danger">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="w-full text-sm text-success">{state.success}</p>
      )}
    </form>
  );
}
