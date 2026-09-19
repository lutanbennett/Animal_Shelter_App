"use client";

import { Fragment, useState, useTransition } from "react";
import { deleteImmunizationType, updateImmunizationType } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type ImmunizationTypeRow = {
  id: string;
  name: string;
  is_mandatory: boolean;
  interval_months: number | null;
};

function ImmunizationTypeRowItem({
  immunizationType,
}: {
  immunizationType: ImmunizationTypeRow;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(immunizationType.name);
  const [isMandatory, setIsMandatory] = useState(immunizationType.is_mandatory);
  const [intervalMonths, setIntervalMonths] = useState(
    immunizationType.interval_months?.toString() ?? "",
  );
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setMessage(null);
    const parsedInterval = intervalMonths ? Number(intervalMonths) : null;
    if (
      intervalMonths &&
      (!Number.isFinite(parsedInterval) || (parsedInterval ?? 0) <= 0)
    ) {
      setMessage({
        type: "error",
        text: t.admin.immunizationTypes.errors.intervalPositive,
      });
      return;
    }
    startTransition(async () => {
      try {
        await updateImmunizationType(immunizationType.id, {
          name,
          isMandatory,
          intervalMonths: parsedInterval,
        });
        setEditing(false);
        setMessage({ type: "success", text: t.common.saved });
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : t.common.failedToSave,
        });
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(t.admin.immunizationTypes.deleteConfirm(immunizationType.name)))
      return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteImmunizationType(immunizationType.id);
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : t.common.failedToDelete,
        });
      }
    });
  }

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-40 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            />
          ) : (
            <span className="text-foreground">{immunizationType.name}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              {t.admin.immunizationTypes.createForm.mandatory}
            </label>
          ) : (
            <span className="text-muted">
              {immunizationType.is_mandatory
                ? t.admin.immunizationTypes.table.mandatory
                : t.admin.immunizationTypes.table.optional}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <input
              type="number"
              min={1}
              placeholder={t.admin.immunizationTypes.table.oneOffPlaceholder}
              value={intervalMonths}
              onChange={(e) => setIntervalMonths(e.target.value)}
              className="w-24 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            />
          ) : (
            <span className="text-muted">
              {immunizationType.interval_months
                ? t.admin.immunizationTypes.table.everyMonths(
                    immunizationType.interval_months,
                  )
                : t.admin.immunizationTypes.table.oneOff}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSave}
                  className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                >
                  {t.common.save}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setEditing(false);
                    setName(immunizationType.name);
                    setIsMandatory(immunizationType.is_mandatory);
                    setIntervalMonths(
                      immunizationType.interval_months?.toString() ?? "",
                    );
                  }}
                  className="rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover"
                >
                  {t.common.cancel}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground"
              >
                {t.common.edit}
              </button>
            )}
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="rounded border border-danger/40 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              {t.common.delete}
            </button>
          </div>
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan={4}
            className={`px-4 pb-2 text-xs ${
              message.type === "error" ? "text-danger" : "text-success"
            }`}
          >
            {message.text}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function ImmunizationTypesTable({
  immunizationTypes,
}: {
  immunizationTypes: ImmunizationTypeRow[];
}) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">
              {t.admin.immunizationTypes.table.name}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.immunizationTypes.table.status}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.immunizationTypes.table.repeatInterval}
            </th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {immunizationTypes.map((immunizationType) => (
            <ImmunizationTypeRowItem
              key={immunizationType.id}
              immunizationType={immunizationType}
            />
          ))}
          {immunizationTypes.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-muted">
                {t.admin.immunizationTypes.table.noTypes}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
