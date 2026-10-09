"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { useState, useTransition } from "react";
import { Check, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatBahtPrice, roundUnitCost } from "@/lib/format";
import { formatQuantity } from "@/lib/diets/options";
import { pricePerPurchaseUnit, type ItemKind, type UnitConversion } from "@/lib/units";
import { localLabel } from "@/lib/translations/labels";
import {
  deleteConversion,
  saveConversion,
  setPricePerPurchaseUnit,
  type ConversionFields,
} from "@/app/management/units/actions";

export type UnitsPanelItem = {
  id: string;
  name: string;
  /** Already translated base unit. */
  baseUnit: string;
  conversions: UnitConversion[];
  /** Cost per base unit, when set. */
  costPerBase: number | null;
};

const inputClass =
  "rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

const EMPTY: ConversionFields = { unit: "", unitTh: "", factor: "", note: "", isPurchase: false, isCount: false };

/**
 * Which half of the 2026-10-08 split this panel is on. "conversions" is
 * Settings → Medications / Diets: add, edit and delete the units each item is
 * bought and counted in (0118). "price" is Management's stock half: the units
 * are shown, not changed, and the price per purchase unit is set, because a
 * price changes as suppliers do and a unit does not.
 */
export type UnitsPanelMode = "conversions" | "price";

/**
 * Units of measure for every item of one kind. Each item is a collapsed row:
 * its base unit, the other units it is bought and counted in, and, on the
 * price side, the price per purchase unit.
 */
export function UnitsPanel({
  kind,
  mode,
  items,
}: {
  kind: ItemKind;
  mode: UnitsPanelMode;
  items: UnitsPanelItem[];
}) {
  const { t } = useI18n();
  const u = t.units;
  // Only an item bought in a unit of its own has a price per that unit to set.
  const shown = mode === "price" ? items.filter((item) => item.conversions.some((c) => c.isPurchase)) : items;
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-foreground">{mode === "price" ? u.price.panelTitle : u.title}</h2>
      {mode === "conversions" ? (
        <>
          <p className="text-sm text-muted">{u.intro}</p>
          <p className="text-xs text-muted">{u.approxNote}</p>
          <p className="text-xs text-muted">{u.historyNote}</p>
          <p className="text-xs text-muted">{u.priceElsewhere}</p>
        </>
      ) : (
        <p className="text-sm text-muted">{u.price.panelIntro}</p>
      )}
      {shown.length === 0 ? (
        <p className="text-sm text-muted">{u.price.noPurchaseUnits}</p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded border border-border">
          {shown.map((item) => (
            <ItemUnits key={item.id} kind={kind} mode={mode} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function ItemUnits({ kind, mode, item }: { kind: ItemKind; mode: UnitsPanelMode; item: UnitsPanelItem }) {
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const u = t.units;
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [fields, setFields] = useState<ConversionFields>(EMPTY);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const purchase = item.conversions.find((c) => c.isPurchase) ?? null;
  const priced = pricePerPurchaseUnit(item.costPerBase, item.conversions);

  const open = (conversion: UnitConversion | null) => {
    setMessage(null);
    setEditingId(conversion ? conversion.id : "new");
    setFields(
      conversion
        ? {
            unit: conversion.unit,
            unitTh: conversion.unitTh ?? "",
            factor: String(conversion.basePer),
            note: conversion.note ?? "",
            isPurchase: conversion.isPurchase,
            isCount: conversion.isCount,
          }
        : EMPTY,
    );
  };

  const set = <K extends keyof ConversionFields>(key: K, value: ConversionFields[K]) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage({ ok: false, text: result.error ?? u.errors.failed });
        return;
      }
      after?.();
      setMessage({ ok: true, text: u.saved });
    });
  };

  return (
    <details className="group px-4 py-3 text-sm">
      <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-medium text-foreground">{item.name}</span>
        <span className="text-xs text-muted">
          {u.baseUnit(item.baseUnit)} · {u.summary(item.conversions.length)}
        </span>
      </summary>

      <div className="mt-3 flex flex-col gap-3">
        {item.conversions.length === 0 && editingId !== "new" && <p className="text-muted">{u.none}</p>}

        <ul className="flex flex-col gap-2">
          {item.conversions.map((c) =>
            editingId === c.id ? (
              <li key={c.id}>
                <ConversionForm
                  base={item.baseUnit}
                  fields={fields}
                  set={set}
                  pending={pending}
                  onSave={() => run(() => saveConversion(kind, item.id, c.id, fields), () => setEditingId(null))}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex flex-wrap items-center gap-2 text-foreground">
                  {u.oneIs(localLabel(locale, c.unit, c.unitTh), formatQuantity(c.basePer), item.baseUnit)}
                  {c.isPurchase && <Badge>{u.purchaseBadge}</Badge>}
                  {c.isCount && <Badge>{u.countBadge}</Badge>}
                  {c.note && <span className="text-xs text-muted">{c.note}</span>}
                </span>
                {mode === "conversions" && (
                  <span className="flex gap-2">
                    <ActionButton icon={Pencil} compact disabled={pending} onClick={() => open(c)}>
                      {u.edit}
                    </ActionButton>
                    <ActionButton
                      icon={Trash2}
                      compact
                      disabled={pending}
                      onClick={async () => {
                        if (!await confirm({ body: u.deleteConfirm(c.unit), confirmLabel: t.common.delete })) return;
                        run(() => deleteConversion(kind, c.id));
                      }}
                    >
                      {u.delete}
                    </ActionButton>
                  </span>
                )}
              </li>
            ),
          )}
        </ul>

        {mode === "price" ? null : editingId === "new" ? (
          <ConversionForm
            base={item.baseUnit}
            fields={fields}
            set={set}
            pending={pending}
            onSave={() => run(() => saveConversion(kind, item.id, null, fields), () => setEditingId(null))}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div>
            <ActionButton icon={Plus} compact disabled={pending} onClick={() => open(null)}>
              {u.add}
            </ActionButton>
          </div>
        )}

        {mode === "price" && purchase && (
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <span className="text-sm font-medium text-foreground">{u.price.title}</span>
            {priced && item.costPerBase != null && (
              <span className="text-xs text-muted">
                {u.price.now(
                  formatBahtPrice(priced.price, locale),
                  priced.unit,
                  String(roundUnitCost(item.costPerBase)),
                  item.baseUnit,
                )}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-label={u.price.label(purchase.unit)}
                placeholder={u.price.label(purchase.unit)}
                className={`${inputClass} w-48`}
              />
              <ActionButton
                icon={Check}
                compact
                disabled={pending || !price.trim()}
                onClick={() => run(() => setPricePerPurchaseUnit(kind, item.id, price), () => setPrice(""))}
              >
                {u.price.set}
              </ActionButton>
            </div>
            <span className="text-xs text-muted">{u.price.hint(item.baseUnit)}</span>
          </div>
        )}

        {message && (
          <p role="status" className={`text-xs ${message.ok ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}
      </div>
    </details>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-surface px-1.5 py-0.5 text-xs text-foreground">{children}</span>;
}

function ConversionForm({
  base,
  fields,
  set,
  pending,
  onSave,
  onCancel,
}: {
  base: string;
  fields: ConversionFields;
  set: <K extends keyof ConversionFields>(key: K, value: ConversionFields[K]) => void;
  pending: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const u = t.units;
  return (
    <div className="flex flex-col gap-2 rounded border border-border bg-surface p-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          {u.unit}
          <input
            value={fields.unit}
            onChange={(e) => set("unit", e.target.value)}
            placeholder={u.unitPlaceholder}
            className={`${inputClass} w-48`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t.translations.thaiName}
          <input
            value={fields.unitTh}
            onChange={(e) => set("unitTh", e.target.value)}
            lang="th"
            className={`${inputClass} w-48`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {u.factor(base)}
          <input
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={fields.factor}
            onChange={(e) => set("factor", e.target.value)}
            className={`${inputClass} w-32`}
          />
        </label>
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs text-muted">
          {u.note}
          <input
            value={fields.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder={u.notePlaceholder}
            className={`${inputClass} w-full`}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-foreground">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={fields.isPurchase} onChange={(e) => set("isPurchase", e.target.checked)} />
          {u.isPurchase}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={fields.isCount} onChange={(e) => set("isCount", e.target.checked)} />
          {u.isCount}
        </label>
      </div>
      <div className="flex gap-2">
        <ActionButton icon={Save} variant="primary" compact disabled={pending} onClick={onSave}>
          {pending ? u.saving : u.save}
        </ActionButton>
        <ActionButton icon={X} compact disabled={pending} onClick={onCancel}>
          {u.cancel}
        </ActionButton>
      </div>
    </div>
  );
}
