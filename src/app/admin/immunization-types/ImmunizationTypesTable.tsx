"use client";

import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useState, useTransition } from "react";
import { deleteImmunizationType, updateImmunizationType } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { formatBahtPrice, parseBahtAmount } from "@/lib/format";

export type ImmunizationTypeRow = {
  id: string;
  name: string;
  name_th: string | null;
  is_mandatory: boolean;
  interval_months: number | null;
  /** Baht for one dose (0071). Null means nobody has priced it yet. */
  cost: number | null;
};

function ImmunizationTypeRowItem({
  immunizationType,
}: {
  immunizationType: ImmunizationTypeRow;
}) {
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const [name, setName] = useState(immunizationType.name);
  const [nameTh, setNameTh] = useState(immunizationType.name_th ?? "");
  const [isMandatory, setIsMandatory] = useState(immunizationType.is_mandatory);
  const [intervalMonths, setIntervalMonths] = useState(
    immunizationType.interval_months?.toString() ?? "",
  );
  const [cost, setCost] = useState(immunizationType.cost?.toString() ?? "");
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
    // Blank is a real answer (not priced yet); a bad number is not, and
    // must never reach the cashflow forecast as a zero.
    const parsedCost = parseBahtAmount(cost);
    if (!parsedCost.ok) {
      setMessage({
        type: "error",
        text: t.admin.immunizationTypes.errors.costInvalid,
      });
      return;
    }
    startTransition(async () => {
      const result = await updateImmunizationType(immunizationType.id, {
        name,
        nameTh,
        isMandatory,
        intervalMonths: parsedInterval,
        cost: parsedCost.value,
      });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setEditing(false);
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleDelete() {
    if (!await confirm({ body: t.admin.immunizationTypes.deleteConfirm(immunizationType.name), confirmLabel: t.common.delete }))
      return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteImmunizationType(immunizationType.id);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2">
          {editing ? (
            <div className="flex flex-col gap-1">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-40 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
              />
              <input
                value={nameTh}
                onChange={(e) => setNameTh(e.target.value)}
                placeholder={t.translations.thaiName}
                aria-label={t.translations.thaiName}
                lang="th"
                className="w-40 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-foreground">{immunizationType.name}</span>
              {immunizationType.name_th && (
                <span lang="th" className="text-sm text-foreground">
                  {immunizationType.name_th}
                </span>
              )}
            </div>
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
          {editing ? (
            <input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder={t.admin.immunizationTypes.table.costPlaceholder}
              aria-label={t.admin.immunizationTypes.table.cost}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-28 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            />
          ) : immunizationType.cost == null ? (
            // Never "฿0" — an unpriced vaccine is a gap in the cashflow
            // forecast, which counts these rows rather than adding a zero.
            <span className="text-muted">
              {t.admin.immunizationTypes.table.notPricedYet}
            </span>
          ) : (
            <span className="text-foreground">
              {formatBahtPrice(immunizationType.cost, locale)}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <ActionButton icon={ACTION_ICONS.save} variant="primary" compact disabled={isPending} onClick={handleSave}>
                  {t.common.save}
                </ActionButton>
                <ActionButton
                  icon={ACTION_ICONS.clear}
                  compact
                  disabled={isPending}
                  onClick={() => {
                    setEditing(false);
                    setName(immunizationType.name);
                    setNameTh(immunizationType.name_th ?? "");
                    setIsMandatory(immunizationType.is_mandatory);
                    setIntervalMonths(
                      immunizationType.interval_months?.toString() ?? "",
                    );
                    setCost(immunizationType.cost?.toString() ?? "");
                  }}
                >
                  {t.common.cancel}
                </ActionButton>
              </>
            ) : (
              <RowActionButton
                  onClick={() => setEditing(true)}
                  label={t.common.edit}
                  subject={immunizationType.name}
                  icon={ACTION_ICONS.edit}
                />
            )}
            <RowActionButton
                disabled={isPending}
                onClick={handleDelete}
                label={t.common.delete}
                subject={immunizationType.name}
                icon={ACTION_ICONS.delete}
                tone="danger"
              />
          </div>
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan={5}
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
            <th className="px-4 py-2 font-medium">
              {t.admin.immunizationTypes.table.cost}
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
              <td colSpan={5} className="px-4 py-6 text-center text-muted">
                {t.admin.immunizationTypes.table.noTypes}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
